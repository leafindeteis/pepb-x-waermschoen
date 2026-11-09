-- PEPB x WärmSchöN: answers to the multiple-choice and yes/no interview questions, split by owners and tenants.
-- Paste this into Supabase → SQL Editor → New query, then click "Run". It only reads.
-- Each row counts interviews with that answer. Questions with several answers count each answer.

select
  c.key as question,
  a.answer,
  count(*) filter (where i.tenure = 'tenant') as tenants,
  count(*) filter (where i.tenure = 'owner') as owners,
  count(*) as everyone
from public.interviews i
cross join lateral jsonb_each(i.choices) c
cross join lateral (
  select jsonb_array_elements_text(c.value) as answer where jsonb_typeof(c.value) = 'array'
  union all
  select c.value #>> '{}' where jsonb_typeof(c.value) <> 'array'
) a
group by c.key, a.answer

union all
select 'tenure', tenure,
  count(*) filter (where tenure = 'tenant'), count(*) filter (where tenure = 'owner'), count(*)
from public.interviews
group by tenure

order by question, everyone desc;
