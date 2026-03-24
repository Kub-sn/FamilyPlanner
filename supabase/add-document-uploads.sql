alter table public.documents
add column if not exists file_path text;

insert into storage.buckets (id, name, public)
values ('family-documents', 'family-documents', false)
on conflict (id) do update set public = excluded.public;

create or replace function public.can_access_document_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  select case
    when array_length(storage.foldername(object_name), 1) >= 1
      and (storage.foldername(object_name))[1] ~* '^[0-9a-f-]{36}$'
    then public.is_family_member(((storage.foldername(object_name))[1])::uuid)
    else false
  end;
$$;

drop policy if exists "family members can read document files" on storage.objects;
create policy "family members can read document files"
on storage.objects
for select
using (
  bucket_id = 'family-documents'
  and public.can_access_document_object(name)
);

drop policy if exists "family members can upload document files" on storage.objects;
create policy "family members can upload document files"
on storage.objects
for insert
with check (
  bucket_id = 'family-documents'
  and public.can_access_document_object(name)
);

drop policy if exists "family members can delete documents" on public.documents;
create policy "family members can delete documents"
on public.documents
for delete
using (public.is_family_member(family_id));

drop policy if exists "family members can update documents" on public.documents;
create policy "family members can update documents"
on public.documents
for update
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

drop policy if exists "family members can delete document files" on storage.objects;
create policy "family members can delete document files"
on storage.objects
for delete
using (
  bucket_id = 'family-documents'
  and public.can_access_document_object(name)
);
