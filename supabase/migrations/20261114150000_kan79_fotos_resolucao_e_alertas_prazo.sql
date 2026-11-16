-- KAN-79 / KAN-84: Bucket privado para fotos de resolução e parâmetros de alerta de prazo.
-- Mantém intactas a RPC `public.executar_acao_moderacao` e `public.transicoes_moderacao` (migration 026).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fotos-resolucao',
  'fotos-resolucao',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "fotos_resolucao_select_autorizado" on storage.objects;
drop policy if exists "fotos_resolucao_insert_gestao" on storage.objects;

-- Leitura restrita à gestão ativa e ao autor da ocorrência vinculada. Nenhuma leitura anônima.
create policy "fotos_resolucao_select_autorizado"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'fotos-resolucao'
  and (
    exists (
      select 1
      from public.perfis
      where perfis.id = (select auth.uid())
        and perfis.ativo = true
        and perfis.perfil in ('analista', 'gestor', 'admin')
    )
    or exists (
      select 1
      from public.ocorrencias o
      where o.id::text = (storage.foldername(name))[1]
        and o.registrado_por = (select auth.uid())
    )
  )
);

-- Escrita permitida exclusivamente para perfis de gestão ativos.
-- Convenção obrigatória de caminho: {ocorrencia_id}/{timestamp}-{uuid}.{ext}
create policy "fotos_resolucao_insert_gestao"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'fotos-resolucao'
  and exists (
    select 1
    from public.perfis
    where perfis.id = (select auth.uid())
      and perfis.ativo = true
      and perfis.perfil in ('analista', 'gestor', 'admin')
  )
  and exists (
    select 1
    from public.ocorrencias o
    where o.id::text = (storage.foldername(name))[1]
  )
);

-- Proibido DELETE/UPDATE para manter trilha auditável e imutabilidade das evidências.

-- Parâmetros configuráveis dos alertas de prazo (KAN-79 / Tarefa 4).
insert into public.configuracoes_sistema (chave, valor, descricao)
values
  (
    'alerta_prazo_dias',
    '20,27',
    'Dias do ciclo de resolução que disparam alertas visuais na fila e no detalhe da ocorrência.'
  ),
  (
    'prazo_ciclo_dias',
    '30',
    'Duração padrão do ciclo de resolução em dias utilizada como referência junto a prazo_resolucao.'
  )
on conflict (chave) do nothing;
