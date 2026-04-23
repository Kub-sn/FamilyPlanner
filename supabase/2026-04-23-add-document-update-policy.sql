drop policy if exists "family members can update documents" on public.documents;

create policy "family members can update documents"
on public.documents
for update
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));