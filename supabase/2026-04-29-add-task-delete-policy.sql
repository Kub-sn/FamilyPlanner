drop policy if exists "family members can delete tasks" on public.tasks;

create policy "family members can delete tasks"
on public.tasks
for delete
using (public.is_family_member(family_id));