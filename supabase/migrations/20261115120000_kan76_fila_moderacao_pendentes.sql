-- KAN-76 / F4.1: Corrige a consulta da Fila de Moderação para listar TODAS as ocorrências
-- com `status = 'pendente'`, sem filtrar por sinais de inconsistência, calculando sinais
-- apenas como metadados de exibição e prioridade de ordenação.
-- Mantém intacta a RPC `public.executar_acao_moderacao` (migration 026).

drop function if exists public.listar_fila_moderacao();

create or replace function public.listar_fila_moderacao()
returns table (
  id uuid,
  data_registro timestamptz,
  created_at timestamptz,
  status text,
  descricao text,
  tipo_residuo jsonb,
  volume_estimado text,
  frequencia_percebida text,
  horario_percebido text,
  foto_url text,
  fotos text[],
  prazo_resolucao timestamptz,
  prorrogado_em timestamptz,
  categoria_principal text,
  ponto_id uuid,
  endereco text,
  bairro text,
  subprefeitura text,
  ponto_status text,
  confirmacoes integer,
  sinal_duplicata boolean,
  sinal_faixa_cinzenta boolean,
  sinal_reincidencia boolean,
  sinal_limite_diario boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_perfil text;
  v_ativo boolean;
  v_limite_diario integer := 3;
begin
  select p.perfil::text, p.ativo
    into v_perfil, v_ativo
  from public.perfis p
  where p.id = auth.uid();

  if coalesce(v_ativo, false) is false or v_perfil not in ('analista', 'gestor', 'admin') then
    raise exception 'Apenas gestão pode consultar a fila de moderação'
      using errcode = '42501';
  end if;

  select coalesce(nullif(c.valor, '')::integer, 3)
    into v_limite_diario
  from public.configuracoes_sistema c
  where c.chave = 'limite_denuncias_por_dia'
  limit 1;

  v_limite_diario := coalesce(v_limite_diario, 3);

  return query
  with base as (
    select
      o.id,
      o.data_registro,
      o.created_at,
      o.status::text as status,
      o.descricao::text as descricao,
      to_jsonb(o.tipo_residuo) as tipo_residuo,
      o.volume_estimado::text as volume_estimado,
      o.frequencia_percebida::text as frequencia_percebida,
      o.horario_percebido::text as horario_percebido,
      o.foto_url::text as foto_url,
      o.fotos,
      o.prazo_resolucao,
      o.prorrogado_em,
      p.categoria_principal::text as categoria_principal,
      p.id as ponto_id,
      p.endereco::text as endereco,
      p.bairro::text as bairro,
      p.subprefeitura::text as subprefeitura,
      p.status::text as ponto_status,
      p.confirmacoes::integer as confirmacoes,
      (
        (
          o.latitude is not null
          and o.longitude is not null
          and (
            exists (
              select 1
              from public.pontos_descarte p2
              where p2.id is distinct from o.ponto_id
                and p2.status::text not in ('arquivado', 'invalido', 'cancelado')
                and p2.latitude is not null
                and p2.longitude is not null
                and st_dwithin(
                  st_setsrid(st_makepoint(o.longitude, o.latitude), 4326)::geography,
                  st_setsrid(st_makepoint(p2.longitude, p2.latitude), 4326)::geography,
                  50
                )
            )
            or exists (
              select 1
              from public.ocorrencias o2
              where o2.id <> o.id
                and o2.status::text <> 'rejeitada'
                and o2.latitude is not null
                and o2.longitude is not null
                and st_dwithin(
                  st_setsrid(st_makepoint(o.longitude, o.latitude), 4326)::geography,
                  st_setsrid(st_makepoint(o2.longitude, o2.latitude), 4326)::geography,
                  50
                )
            )
          )
        )
        or exists (
          select 1
          from public.moderacao_ocorrencias m
          where m.ocorrencia_id = o.id
            and m.motivo::text = 'duplicata'
        )
      ) as sinal_duplicata,
      (
        (
          o.latitude is not null
          and o.longitude is not null
          and (
            exists (
              select 1
              from public.pontos_descarte p2
              where p2.id is distinct from o.ponto_id
                and p2.status::text not in ('arquivado', 'invalido', 'cancelado')
                and p2.latitude is not null
                and p2.longitude is not null
                and st_dwithin(
                  st_setsrid(st_makepoint(o.longitude, o.latitude), 4326)::geography,
                  st_setsrid(st_makepoint(p2.longitude, p2.latitude), 4326)::geography,
                  100
                )
                and not st_dwithin(
                  st_setsrid(st_makepoint(o.longitude, o.latitude), 4326)::geography,
                  st_setsrid(st_makepoint(p2.longitude, p2.latitude), 4326)::geography,
                  50
                )
            )
            or exists (
              select 1
              from public.ocorrencias o2
              where o2.id <> o.id
                and o2.status::text <> 'rejeitada'
                and o2.latitude is not null
                and o2.longitude is not null
                and st_dwithin(
                  st_setsrid(st_makepoint(o.longitude, o.latitude), 4326)::geography,
                  st_setsrid(st_makepoint(o2.longitude, o2.latitude), 4326)::geography,
                  100
                )
                and not st_dwithin(
                  st_setsrid(st_makepoint(o.longitude, o.latitude), 4326)::geography,
                  st_setsrid(st_makepoint(o2.longitude, o2.latitude), 4326)::geography,
                  50
                )
            )
          )
        )
        or exists (
          select 1
          from public.moderacao_ocorrencias m
          where m.ocorrencia_id = o.id
            and m.motivo::text = 'faixa_cinzenta'
        )
      ) as raw_faixa_cinzenta,
      (
        o.ponto_id is not null
        and (
          coalesce(p.recorrente, false)
          or coalesce(p.quantidade_ocorrencias, 0) > 1
          or exists (
            select 1
            from public.ocorrencias o_prev
            where o_prev.ponto_id = o.ponto_id
              and o_prev.id <> o.id
          )
        )
      ) as sinal_reincidencia,
      (
        o.registrado_por is not null
        and (
          select count(*)
          from public.ocorrencias o_dia
          where o_dia.registrado_por = o.registrado_por
            and timezone('America/Sao_Paulo', o_dia.data_registro)::date
              = timezone('America/Sao_Paulo', o.data_registro)::date
        ) >= greatest(v_limite_diario - 1, 1)
      ) as sinal_limite_diario
    from public.ocorrencias o
    left join public.pontos_descarte p on p.id = o.ponto_id
    where o.status = 'pendente'
  )
  select
    b.id,
    b.data_registro,
    b.created_at,
    b.status,
    b.descricao,
    b.tipo_residuo,
    b.volume_estimado,
    b.frequencia_percebida,
    b.horario_percebido,
    b.foto_url,
    b.fotos,
    b.prazo_resolucao,
    b.prorrogado_em,
    b.categoria_principal,
    b.ponto_id,
    b.endereco,
    b.bairro,
    b.subprefeitura,
    b.ponto_status,
    b.confirmacoes,
    b.sinal_duplicata,
    (b.raw_faixa_cinzenta and not b.sinal_duplicata) as sinal_faixa_cinzenta,
    b.sinal_reincidencia,
    b.sinal_limite_diario
  from base b
  order by
    b.sinal_reincidencia desc nulls last,
    b.sinal_duplicata desc nulls last,
    (b.raw_faixa_cinzenta and not b.sinal_duplicata) desc nulls last,
    b.data_registro asc;
end;
$$;

revoke all on function public.listar_fila_moderacao() from public, anon;
grant execute on function public.listar_fila_moderacao() to authenticated;
