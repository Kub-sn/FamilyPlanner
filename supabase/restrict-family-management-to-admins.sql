create or replace function public.bootstrap_family_for_current_user(target_family_name text)
returns table (
  family_id uuid,
  family_name text,
  role text,
  allow_open_registration boolean,
  is_owner boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_family_name text := trim(coalesce(target_family_name, ''));
  created_family public.families%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if normalized_family_name = '' then
    raise exception 'Bitte einen Familiennamen eingeben.';
  end if;

  insert into public.families (name, owner_user_id)
  values (normalized_family_name, auth.uid())
  returning * into created_family;

  insert into public.family_members (family_id, user_id, role)
  values (created_family.id, auth.uid(), 'familyuser');

  update public.profiles
  set role = 'familyuser'
  where id = auth.uid();

  return query
  select created_family.id, created_family.name, 'familyuser'::text, created_family.allow_open_registration, true;
end;
$$;

grant execute on function public.bootstrap_family_for_current_user(text) to authenticated;

drop policy if exists "owners and admins can update own family" on public.families;
drop policy if exists "admins can update own family" on public.families;
create policy "admins can update own family"
on public.families
for update
using (public.is_family_admin(id))
with check (public.is_family_admin(id));

drop policy if exists "admins can view family invites" on public.family_invites;
drop policy if exists "family members can view family invites" on public.family_invites;
create policy "family members can view family invites"
on public.family_invites
for select
using (
  public.is_family_member(family_id)
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists "admins can create family invites" on public.family_invites;
create policy "admins can create family invites"
on public.family_invites
for insert
with check (
  (public.is_family_owner(family_id) or public.is_family_admin(family_id))
  and invited_by_user_id = auth.uid()
);

drop policy if exists "admins can update family invites" on public.family_invites;
create policy "admins can update family invites"
on public.family_invites
for update
using (public.is_family_owner(family_id) or public.is_family_admin(family_id))
with check (public.is_family_owner(family_id) or public.is_family_admin(family_id));

drop policy if exists "admins can delete family invites" on public.family_invites;
create policy "admins can delete family invites"
on public.family_invites
for delete
using (public.is_family_owner(family_id) or public.is_family_admin(family_id));

drop policy if exists "owners and admins can add memberships" on public.family_members;
drop policy if exists "admins can add memberships" on public.family_members;
create policy "admins can add memberships"
on public.family_members
for insert
with check (
  public.is_family_admin(family_id)
  or public.can_accept_family_invite(family_id, user_id)
);