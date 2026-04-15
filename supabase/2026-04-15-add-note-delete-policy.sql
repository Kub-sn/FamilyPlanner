drop policy if exists "family members can delete notes" on public.notes;

create policy "family members can delete notes"
on public.notes
for delete
using (public.is_family_member(family_id));