-- KAN-73: evidências de ocorrências devem ser privadas e acessadas por URL temporária.

update storage.buckets
set public = false
where id = 'fotos-ocorrencias';

drop policy if exists "fotos_ocorrencias_select_publico" on storage.objects;
drop policy if exists "fotos_ocorrencias_select_autorizado" on storage.objects;
drop policy if exists "fotos_ocorrencias_insert_autenticado" on storage.objects;
drop policy if exists "fotos_ocorrencias_delete_proprio" on storage.objects;

create policy "fotos_ocorrencias_select_autorizado"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'fotos-ocorrencias'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or exists (
      select 1
      from public.perfis
      where perfis.id = (select auth.uid())
        and perfis.ativo = true
        and perfis.perfil in ('analista', 'gestor', 'admin')
    )
  )
);

create policy "fotos_ocorrencias_insert_autenticado"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'fotos-ocorrencias'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "fotos_ocorrencias_delete_proprio"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'fotos-ocorrencias'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
