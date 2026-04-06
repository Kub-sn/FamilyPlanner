alter table public.families
add column if not exists allow_open_registration boolean not null default true;

create or replace function public.get_registration_gate(target_email text)
returns table (
  registration_allowed boolean,
  pending_invite boolean,
  open_registration_available boolean,
  has_existing_families boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(coalesce(target_email, '')));
begin
  return query
  with family_state as (
    select
      count(*)::int as family_count,
      coalesce(bool_or(f.allow_open_registration), false) as open_registration_available
    from public.families f
  ),
  invite_state as (
    select exists (
      select 1
      from public.family_invites fi
      where lower(fi.email) = normalized_email
        and fi.accepted_at is null
    ) as pending_invite
  )
  select
    case
      when normalized_email = '' then false
      when invite_state.pending_invite then true
      when family_state.family_count = 0 then true
      when family_state.open_registration_available then true
      else false
    end as registration_allowed,
    invite_state.pending_invite,
    family_state.open_registration_available,
    family_state.family_count > 0 as has_existing_families
  from family_state
  cross join invite_state;
end;
$$;

grant execute on function public.get_registration_gate(text) to anon, authenticated;

drop policy if exists "owners and admins can update own family" on public.families;
drop policy if exists "owners can update own family" on public.families;
create policy "owners and admins can update own family"
on public.families
for update
using (owner_user_id = auth.uid() or public.is_family_admin(id))
with check (owner_user_id = auth.uid() or public.is_family_admin(id));