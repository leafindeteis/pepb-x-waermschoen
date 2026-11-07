-- PEPB x WärmSchöN: database setup.
-- Paste all of this into Supabase → SQL Editor → New query, then click "Run". Run it once.
-- The class code is NOT set here, because this file is public. See README.md, step 3.

-- 1. Private settings and login attempts. No rules are defined, so the app can never read them.
create table public.class_settings (
  id        boolean primary key default true check (id),
  code_hash text not null
);

create table public.join_attempts (
  user_id uuid not null references auth.users on delete cascade,
  at      timestamptz not null default now()
);
create index join_attempts_user_at on public.join_attempts (user_id, at);

-- 2. Everyone who has entered the class code, with their first name.
create table public.members (
  user_id    uuid primary key references auth.users on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 30),
  joined_at  timestamptz not null default now()
);

-- 3. The door data.
create table public.visits (
  id          uuid primary key default gen_random_uuid(),
  building_id text not null check (char_length(building_id) between 1 and 40),
  floor       integer check (floor between 0 and 60),
  door        integer not null default 0 check (door between 0 and 29),
  result      text not null check (result in ('none', 'open', 'talk', 'noaccess')),
  first_name  text not null,
  created_by  uuid references auth.users on delete set null,
  created_at  timestamptz not null default now(),
  -- "Couldn't get into the building" applies to the whole house, everything else to one floor.
  check ((result = 'noaccess') = (floor is null))
);
create index visits_building on public.visits (building_id);
create index visits_door on public.visits (building_id, floor, door);

create table public.door_counts (
  building_id text not null check (char_length(building_id) between 1 and 40),
  floor       integer not null check (floor between 0 and 60),
  count       integer not null check (count between 1 and 30),
  primary key (building_id, floor)
);

create table public.floor_extras (
  building_id text primary key check (char_length(building_id) between 1 and 40),
  extra       integer not null check (extra between 0 and 20)
);

-- 4. Is the signed-in person in the class?
create function public.is_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.members where user_id = auth.uid());
$$;

-- 5. Each visit gets its name, author and time from the database, so nobody can log under another name.
create function public.stamp_visit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.created_by := auth.uid();
  new.created_at := now();
  select m.first_name into strict new.first_name from public.members m where m.user_id = auth.uid();
  return new;
end;
$$;

create trigger stamp_visit before insert on public.visits
  for each row execute function public.stamp_visit();

-- 6. Rules: only class members see the data, and people can only delete their own visits.
alter table public.class_settings enable row level security;
alter table public.join_attempts  enable row level security;
alter table public.members        enable row level security;
alter table public.visits         enable row level security;
alter table public.door_counts    enable row level security;
alter table public.floor_extras   enable row level security;

create policy "See your own membership" on public.members
  for select to authenticated using (user_id = auth.uid());

create policy "Class can read visits" on public.visits
  for select to authenticated using (public.is_member());
create policy "Class can log visits" on public.visits
  for insert to authenticated with check (public.is_member());
create policy "Delete your own visits" on public.visits
  for delete to authenticated using (public.is_member() and created_by = auth.uid());

create policy "Class can read door counts" on public.door_counts
  for select to authenticated using (public.is_member());
create policy "Class can read added floors" on public.floor_extras
  for select to authenticated using (public.is_member());

revoke all on public.class_settings, public.join_attempts, public.members,
              public.visits, public.door_counts, public.floor_extras
  from anon, authenticated;
grant select on public.members, public.door_counts, public.floor_extras to authenticated;
grant select, insert, delete on public.visits to authenticated;

-- 7. Set or change the class code. Only you can run this, in the SQL Editor.
create function public.set_class_code(p_code text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if char_length(trim(p_code)) < 10 then
    raise exception 'Please use a class code of at least 10 characters';
  end if;
  insert into public.class_settings (id, code_hash)
  values (true, extensions.crypt(lower(trim(p_code)), extensions.gen_salt('bf')))
  on conflict (id) do update set code_hash = excluded.code_hash;
end;
$$;

-- 8. Join with the class code and a first name. Five wrong tries per 10 minutes.
create function public.join_class(p_code text, p_first_name text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  clean_name text := left(regexp_replace(trim(coalesce(p_first_name, '')), '\s+', ' ', 'g'), 30);
  stored_hash text;
begin
  if uid is null then return 'not_signed_in'; end if;
  if clean_name = '' then return 'bad_name'; end if;

  if (select count(*) from public.join_attempts
      where user_id = uid and at > now() - interval '10 minutes') >= 5 then
    return 'too_many';
  end if;

  select code_hash into stored_hash from public.class_settings where id;
  if stored_hash is null then return 'no_code_set'; end if;

  if extensions.crypt(lower(trim(coalesce(p_code, ''))), stored_hash) <> stored_hash then
    insert into public.join_attempts (user_id) values (uid);
    return 'wrong_code';
  end if;

  insert into public.members (user_id, first_name) values (uid, clean_name)
  on conflict (user_id) do update set first_name = excluded.first_name;
  delete from public.join_attempts where user_id = uid;
  return 'ok';
end;
$$;

-- 9. Change your first name. Visits already logged keep the old one.
create function public.set_first_name(p_first_name text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  clean_name text := left(regexp_replace(trim(coalesce(p_first_name, '')), '\s+', ' ', 'g'), 30);
begin
  if not public.is_member() then raise exception 'not_a_member'; end if;
  if clean_name = '' then raise exception 'bad_name'; end if;
  update public.members set first_name = clean_name where user_id = auth.uid();
  return clean_name;
end;
$$;

-- 10. Add or remove a door. Two students adding a door at the same moment both count.
create function public.change_doors(p_building text, p_floor integer, p_delta integer) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  new_count integer;
begin
  if not public.is_member() then raise exception 'not_a_member'; end if;
  if p_delta not in (-1, 1) then raise exception 'bad_change'; end if;

  insert into public.door_counts as d (building_id, floor, count)
  values (p_building, p_floor, greatest(1, 1 + p_delta))
  on conflict (building_id, floor) do update
    set count = least(30, greatest(1, d.count + p_delta))
  returning count into new_count;

  -- A door that already has a visit logged can't be removed.
  if exists (select 1 from public.visits
             where building_id = p_building and floor = p_floor and door >= new_count) then
    raise exception 'door_in_use';
  end if;
  return new_count;
end;
$$;

-- 11. Add or remove a hand-added floor.
create function public.change_floors(p_building text, p_delta integer) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  new_extra integer;
begin
  if not public.is_member() then raise exception 'not_a_member'; end if;
  if p_delta not in (-1, 1) then raise exception 'bad_change'; end if;

  insert into public.floor_extras as f (building_id, extra)
  values (p_building, greatest(0, p_delta))
  on conflict (building_id) do update
    set extra = least(20, greatest(0, f.extra + p_delta))
  returning extra into new_extra;
  return new_extra;
end;
$$;

-- 12. A harmless call for the keep-alive job, so the free project isn't paused. It reveals nothing.
create function public.ping() returns boolean
language sql stable set search_path = '' as $$ select true; $$;

-- 13. Who may call what.
revoke all on function public.is_member()                         from public, anon;
revoke all on function public.stamp_visit()                       from public, anon, authenticated;
revoke all on function public.set_class_code(text)                from public, anon, authenticated;
revoke all on function public.join_class(text, text)              from public, anon;
revoke all on function public.set_first_name(text)                from public, anon;
revoke all on function public.change_doors(text, integer, integer) from public, anon;
revoke all on function public.change_floors(text, integer)        from public, anon;
grant execute on function public.is_member()                         to authenticated;
grant execute on function public.join_class(text, text)              to authenticated;
grant execute on function public.set_first_name(text)                to authenticated;
grant execute on function public.change_doors(text, integer, integer) to authenticated;
grant execute on function public.change_floors(text, integer)        to authenticated;
grant execute on function public.ping()                              to anon, authenticated;

-- 14. Live updates: students see each other's doors without reloading.
alter publication supabase_realtime add table public.visits, public.door_counts, public.floor_extras;

-- 15. Reasons why a door opened without a conversation.
-- Reasons sit in their own table. Students can't read it, only the statistics query in the SQL Editor can.
-- Deleting a visit also deletes its reason.
create table public.visit_reasons (
  visit_id uuid primary key references public.visits on delete cascade,
  reason   text not null check (reason in ('unclear', 'language', 'time', 'interest', 'confidence', 'age', 'other'))
);
alter table public.visit_reasons enable row level security;
revoke all on public.visit_reasons from anon, authenticated;

-- Saves "opened, no conversation" and its reason together.
create function public.log_no_conversation(p_building text, p_floor integer, p_door integer, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  new_id uuid;
begin
  if not public.is_member() then raise exception 'not_a_member'; end if;
  insert into public.visits (building_id, floor, door, result)
  values (p_building, p_floor, p_door, 'open')
  returning id into new_id;
  insert into public.visit_reasons (visit_id, reason) values (new_id, p_reason);
end;
$$;

revoke all on function public.log_no_conversation(text, integer, integer, text) from public, anon;
grant execute on function public.log_no_conversation(text, integer, integer, text) to authenticated;
