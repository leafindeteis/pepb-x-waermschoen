-- PEPB x WärmSchöN: adds reasons why a door opened without a conversation.
-- Paste this into Supabase → SQL Editor → New query, then click "Run". Run it once.

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
