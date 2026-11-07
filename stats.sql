-- PEPB x WärmSchöN: totals, without names.
-- Paste this into Supabase → SQL Editor → New query, then click "Run". It only reads.
-- A door rung several times counts once, with its best result:
-- conversation, then opened, then nobody home.

with doors as (
  select distinct on (building_id, floor, door) building_id, result
  from public.visits
  where floor is not null
  order by building_id, floor, door,
    case result when 'talk' then 3 when 'open' then 2 else 1 end desc
),
door_totals as (
  select
    count(*) as rung,
    count(*) filter (where result in ('open', 'talk')) as opened,
    count(*) filter (where result = 'talk') as conversations,
    count(*) filter (where result = 'open') as opened_no_conversation,
    count(*) filter (where result = 'none') as nobody_home,
    count(distinct building_id) as houses_with_doors_rung
  from doors
)
select
  rung as doors_rung,
  opened as doors_opened,
  round(100.0 * opened / nullif(rung, 0), 1) as percent_opened,
  conversations,
  round(100.0 * conversations / nullif(opened, 0), 1) as percent_of_opened_with_conversation,
  opened_no_conversation,
  nobody_home,
  houses_with_doors_rung,
  (select count(distinct building_id) from public.visits where result = 'noaccess') as houses_no_access,
  (select count(*) from public.visits) as total_entries
from door_totals;
