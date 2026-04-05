create or replace function public.is_family_owner(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.families f
    where f.id = target_family_id
      and f.owner_user_id = auth.uid()
  );
$$;

create or replace function public.can_accept_family_invite(target_family_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = target_user_id
    and exists (
      select 1
      from public.family_invites fi
      where fi.family_id = target_family_id
        and lower(fi.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and fi.accepted_at is null
    );
$$;

    drop function if exists public.accept_family_invite_for_current_user();

create or replace function public.accept_family_invite_for_current_user()
returns table (accepted_invite_id uuid, accepted_family_id uuid, accepted_role text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  pending_invite public.family_invites%rowtype;
begin
  if current_user_id is null or current_email = '' then
    return;
  end if;

  select *
  into pending_invite
  from public.family_invites fi
  where lower(fi.email) = current_email
    and fi.accepted_at is null
  order by fi.created_at desc
  for update
  limit 1;

  if pending_invite.id is null then
    return;
  end if;

  insert into public.family_members (family_id, user_id, role)
  values (pending_invite.family_id, current_user_id, pending_invite.role)
  on conflict (family_id, user_id)
  do update set role = excluded.role;

  update public.profiles
  set role = pending_invite.role
  where id = current_user_id;

  update public.family_invites
  set accepted_at = now()
  where id = pending_invite.id
    and lower(email) = current_email
    and accepted_at is null;

  if not found then
    return;
  end if;

  return query
  select pending_invite.id, pending_invite.family_id, pending_invite.role;
end;
$$;

create table if not exists public.family_invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'familyuser')),
  invited_by_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  accepted_at timestamptz null
);

create unique index if not exists family_invites_unique_pending_email
on public.family_invites (family_id, lower(email))
where accepted_at is null;

alter table public.family_invites enable row level security;

drop policy if exists "admins can view family invites" on public.family_invites;
create policy "admins can view family invites"
on public.family_invites
for select
using (
  public.is_family_owner(family_id)
  or public.is_family_admin(family_id)
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

drop policy if exists "invitees and admins can update family invites" on public.family_invites;
drop policy if exists "admins can update family invites" on public.family_invites;
create policy "admins can update family invites"
on public.family_invites
for update
using (
  public.is_family_owner(family_id)
  or public.is_family_admin(family_id)
)
with check (
  public.is_family_owner(family_id)
  or public.is_family_admin(family_id)
);

drop policy if exists "admins can delete family invites" on public.family_invites;
create policy "admins can delete family invites"
on public.family_invites
for delete
using (
  public.is_family_owner(family_id)
  or public.is_family_admin(family_id)
);

drop policy if exists "owners and admins can add memberships" on public.family_members;
create policy "owners and admins can add memberships"
on public.family_members
for insert
with check (
  exists (
    select 1
    from public.families f
    where f.id = family_members.family_id
      and f.owner_user_id = auth.uid()
  )
  or public.is_family_admin(family_id)
  or public.can_accept_family_invite(family_id, user_id)
);