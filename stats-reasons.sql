-- PEPB x WärmSchöN: why doors opened without a conversation, without names or addresses.
-- Paste this into Supabase → SQL Editor → New query, then click "Run". It only reads.
-- Counts each door once, using its latest reason. Doors that later had a conversation aren't counted.

with best as (
  select building_id, floor, door,
    bool_or(result = 'talk') as had_talk
  from public.visits
  where floor is not null
  group by building_id, floor, door
),
latest as (
  select distinct on (v.building_id, v.floor, v.door) coalesce(r.reason, 'not recorded') as reason
  from public.visits v
  join best b using (building_id, floor, door)
  left join public.visit_reasons r on r.visit_id = v.id
  where v.result = 'open' and not b.had_talk
  order by v.building_id, v.floor, v.door, v.created_at desc
)
select
  case reason
    when 'unclear' then 'Unclear'
    when 'language' then 'Language'
    when 'time' then 'Time'
    when 'interest' then 'Lack of interest'
    when 'confidence' then 'Lack of self-confidence'
    when 'age' then 'Age'
    when 'other' then 'Other'
    else 'Not recorded'
  end as reason,
  count(*) as doors,
  round(100.0 * count(*) / sum(count(*)) over (), 1) as percent
from latest
group by latest.reason
order by doors desc;
