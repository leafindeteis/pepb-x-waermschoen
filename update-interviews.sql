-- PEPB x WärmSchöN: adds the interview form.
-- Paste this into Supabase → SQL Editor → New query, then click "Run". Run it once.

-- Interviews have no address, door, student or time of day, so they can't be linked to the map.
create table public.interviews (
  id             uuid primary key default gen_random_uuid(),
  interview_date date not null default (now() at time zone 'Europe/Berlin')::date,
  tenure         text not null check (tenure in ('owner', 'tenant')),
  choices        jsonb not null default '{}' check (jsonb_typeof(choices) = 'object'),
  numbers        jsonb not null default '{}' check (jsonb_typeof(numbers) = 'object'),
  texts          jsonb not null default '{}' check (jsonb_typeof(texts) = 'object'),
  check (pg_column_size(choices) + pg_column_size(numbers) + pg_column_size(texts) < 60000)
);

-- The date is always set by the database, never by the phone.
create function public.stamp_interview() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.interview_date := (now() at time zone 'Europe/Berlin')::date;
  return new;
end;
$$;
create trigger stamp_interview before insert on public.interviews
  for each row execute function public.stamp_interview();
revoke all on function public.stamp_interview() from public, anon, authenticated;

-- Class members can add interviews but not read them, not even their own. Only you can, in the SQL Editor.
alter table public.interviews enable row level security;
revoke all on public.interviews from anon, authenticated;
grant insert on public.interviews to authenticated;
create policy "Class can add interviews" on public.interviews
  for insert to authenticated with check (public.is_member());
