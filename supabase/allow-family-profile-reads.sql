drop policy if exists "family members can view related profiles" on public.profiles;

create policy "family members can view related profiles"
on public.profiles
for select
using (
  exists (
    select 1
    from public.family_members current_member
    join public.family_members target_member
      on target_member.family_id = current_member.family_id
    where current_member.user_id = auth.uid()
      and target_member.user_id = profiles.id
  )
);