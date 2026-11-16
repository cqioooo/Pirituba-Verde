-- Preenche endereco e bairro iniciais no ponto recém-criado a partir da geocodificação reversa do GPS/mapa.
-- Executa somente quando o usuário possui ocorrência vinculada ao ponto e o endereço ainda está vazio.

create or replace function public.definir_endereco_ponto_inicial(
  p_ponto_id uuid,
  p_endereco text default null,
  p_bairro text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_endereco text := nullif(trim(coalesce(p_endereco, '')), '');
  v_bairro text := nullif(trim(coalesce(p_bairro, '')), '');
begin
  if v_uid is null or p_ponto_id is null or (v_endereco is null and v_bairro is null) then
    return;
  end if;

  if not exists (
    select 1
    from public.ocorrencias o
    where o.ponto_id = p_ponto_id
      and o.registrado_por = v_uid
  ) then
    raise exception 'Sem permissão para atualizar endereço deste ponto'
      using errcode = '42501';
  end if;

  update public.pontos_descarte
  set
    endereco = coalesce(nullif(trim(endereco), ''), v_endereco),
    bairro = coalesce(nullif(trim(bairro), ''), v_bairro),
    updated_at = now()
  where id = p_ponto_id
    and (nullif(trim(endereco), '') is null or nullif(trim(bairro), '') is null);
end;
$$;

revoke all on function public.definir_endereco_ponto_inicial(uuid, text, text) from public;
grant execute on function public.definir_endereco_ponto_inicial(uuid, text, text) to authenticated;
