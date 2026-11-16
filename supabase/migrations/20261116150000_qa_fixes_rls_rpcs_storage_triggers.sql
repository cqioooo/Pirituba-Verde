-- Correções dos achados críticos/altos da auditoria QA (Camada B) em ambiente Supabase.
-- ATENÇÃO: revisar antes de aplicar no banco remoto e manter alinhamento com migration 026.

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. DEF-01: Impedir auto-elevação de perfil e leitura cruzada em public.perfis
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function public.eh_gestao_ativa()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfis p
    where p.id = auth.uid()
      and p.ativo = true
      and p.perfil::text in ('analista', 'gestor', 'admin')
  );
$$;

create or replace function public.proteger_colunas_sensiveis_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.eh_gestao_ativa() then
    if new.perfil is distinct from old.perfil or new.ativo is distinct from old.ativo then
      raise exception 'Apenas administradores autorizados podem alterar perfil ou status ativo'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proteger_colunas_sensiveis_perfil on public.perfis;
create trigger trg_proteger_colunas_sensiveis_perfil
before update on public.perfis
for each row
execute function public.proteger_colunas_sensiveis_perfil();

alter table public.perfis enable row level security;

drop policy if exists "perfis_select_proprio_ou_gestao" on public.perfis;
create policy "perfis_select_proprio_ou_gestao"
on public.perfis
for select
to authenticated
using (id = auth.uid() or public.eh_gestao_ativa());

drop policy if exists "perfis_update_proprio_sem_privilegio" on public.perfis;
create policy "perfis_update_proprio_sem_privilegio"
on public.perfis
for update
to authenticated
using (id = auth.uid() or public.eh_gestao_ativa())
with check (id = auth.uid() or public.eh_gestao_ativa());

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. DEF-02: Isolamento RLS em public.ocorrencias e proteção de views
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.ocorrencias enable row level security;

revoke all on public.ocorrencias from anon;

drop policy if exists "ocorrencias_select_autor_ou_gestao" on public.ocorrencias;
create policy "ocorrencias_select_autor_ou_gestao"
on public.ocorrencias
for select
to authenticated
using (registrado_por = auth.uid() or public.eh_gestao_ativa());

drop policy if exists "ocorrencias_insert_proprio" on public.ocorrencias;
create policy "ocorrencias_insert_proprio"
on public.ocorrencias
for insert
to authenticated
with check (registrado_por = auth.uid());

-- Cidadão nunca altera status, prazo_resolucao ou prorrogado_em diretamente
drop policy if exists "ocorrencias_update_gestao" on public.ocorrencias;
create policy "ocorrencias_update_gestao"
on public.ocorrencias
for update
to authenticated
using (public.eh_gestao_ativa())
with check (public.eh_gestao_ativa());

revoke all on public.v_pontos_autenticados from anon;
revoke all on public.v_pontos_gestor from anon;
revoke all on public.v_dashboard_resumo from anon;

-- ═════════════════════════════════════════════════════════════════════════════
-- 3. DEF-05: Garantir RPC buscar_pontos_proximos(p_lat, p_lng, p_raio_metros)
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function public.buscar_pontos_proximos(
  p_lat double precision,
  p_lng double precision,
  p_raio_metros integer default 100
)
returns table (
  id uuid,
  distancia_metros double precision,
  status text,
  categoria_principal text,
  confirmacoes integer,
  criticidade double precision,
  recorrente boolean,
  endereco text,
  bairro text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    st_distance(
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
      st_setsrid(st_makepoint(p.longitude, p.latitude), 4326)::geography
    ) as distancia_metros,
    p.status::text as status,
    p.categoria_principal::text as categoria_principal,
    coalesce(p.confirmacoes, 0)::integer as confirmacoes,
    p.criticidade::double precision as criticidade,
    coalesce(p.recorrente, false) as recorrente,
    p.endereco::text as endereco,
    p.bairro::text as bairro
  from public.pontos_descarte p
  where p.latitude is not null
    and p.longitude is not null
    and p.status::text not in ('arquivado', 'invalido', 'cancelado')
    and st_dwithin(
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
      st_setsrid(st_makepoint(p.longitude, p.latitude), 4326)::geography,
      greatest(coalesce(p_raio_metros, 100), 1)
    )
  order by distancia_metros asc;
$$;

revoke all on function public.buscar_pontos_proximos(double precision, double precision, integer) from public;
grant execute on function public.buscar_pontos_proximos(double precision, double precision, integer) to authenticated;

-- ═════════════════════════════════════════════════════════════════════════════
-- 4. DEF-10: Limite diário (com trava transacional) e >= 2 fotos no backend
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function public.validar_criacao_ocorrencia()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limite integer := 3;
  v_hoje_count integer := 0;
  v_inicio_dia timestamptz;
begin
  if new.tipo = 'denuncia' then
    if coalesce(array_length(new.fotos, 1), 0) < 2 then
      raise exception 'É obrigatório anexar no mínimo 2 fotos válidas para registrar a denúncia'
        using errcode = '23514';
    end if;

    perform pg_advisory_xact_lock(hashtext('rate_limit:' || new.registrado_por::text));

    select coalesce(nullif(c.valor, '')::integer, 3)
      into v_limite
    from public.configuracoes_sistema c
    where c.chave = 'limite_denuncias_por_dia'
    limit 1;

    v_inicio_dia := date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';

    select count(*)
      into v_hoje_count
    from public.ocorrencias o
    where o.registrado_por = new.registrado_por
      and o.tipo = 'denuncia'
      and o.data_registro >= v_inicio_dia;

    if v_hoje_count >= coalesce(v_limite, 3) then
      raise exception 'Limite diário de novas denúncias atingido (% por dia)', coalesce(v_limite, 3)
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validar_criacao_ocorrencia on public.ocorrencias;
create trigger trg_validar_criacao_ocorrencia
before insert on public.ocorrencias
for each row
execute function public.validar_criacao_ocorrencia();

-- ═════════════════════════════════════════════════════════════════════════════
-- 5. DEF-09: Validação de proximidade (15m) e não-autor em public.confirmacoes
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function public.validar_confirmacao_comunitaria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ponto record;
  v_raio_geofence integer := 15;
  v_distancia double precision;
begin
  select p.id, p.latitude, p.longitude, p.status::text as status
    into v_ponto
  from public.pontos_descarte p
  where p.id = new.ponto_id;

  if v_ponto.id is null then
    raise exception 'Ponto de descarte não encontrado' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.ocorrencias o
    where o.ponto_id = new.ponto_id
      and o.registrado_por = new.usuario_id
  ) then
    raise exception 'O autor do registro não pode contabilizar confirmação externa'
      using errcode = 'P0001';
  end if;

  select coalesce(nullif(c.valor, '')::integer, 15)
    into v_raio_geofence
  from public.configuracoes_sistema c
  where c.chave = 'raio_geofence_metros'
  limit 1;

  if new.latitude is null or new.longitude is null or (new.latitude = 0 and new.longitude = 0) then
    raise exception 'Localização válida é obrigatória para confirmar um ponto'
      using errcode = 'P0001';
  end if;

  if v_ponto.latitude is not null and v_ponto.longitude is not null then
    v_distancia := st_distance(
      st_setsrid(st_makepoint(new.longitude, new.latitude), 4326)::geography,
      st_setsrid(st_makepoint(v_ponto.longitude, v_ponto.latitude), 4326)::geography
    );

    if v_distancia > coalesce(v_raio_geofence, 15) then
      raise exception 'Confirmação permitida apenas a até % metros do ponto', coalesce(v_raio_geofence, 15)
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validar_confirmacao_comunitaria on public.confirmacoes;
create trigger trg_validar_confirmacao_comunitaria
before insert on public.confirmacoes
for each row
execute function public.validar_confirmacao_comunitaria();

-- ═════════════════════════════════════════════════════════════════════════════
-- 6. NOTAS PARA REVISÃO DIRETA NO SQL EDITOR (DEF-03, DEF-04, DEF-06, DEF-08, DEF-09)
--    - Reaplicar migrations locais 20261114150000 e 20261115120000 (verificando que
--      listar_fila_moderacao usa p.categoria_principal, não o.categoria_principal).
--    - Em executar_acao_moderacao:
--      a) no ramo `prorrogar`, usar UPDATE ... RETURNING prazo_resolucao INTO v_novo_prazo
--         e devolver esse mesmo v_novo_prazo no JSONB;
--      b) no ramo `invalidar`, permitir ponto em ('novo', 'em_confirmacao', 'em_analise')
--         — antes de confirmado ("Invalidar vale para denúncias novas/falsas antes de confirmadas").
--    - Ajustar trigger de contagem de confirmacoes para não gravar status fora da
--      constraint `pontos_descarte_status_check` e alinhar `confirmacoes_para_validar` = '4'.
-- ═════════════════════════════════════════════════════════════════════════════
