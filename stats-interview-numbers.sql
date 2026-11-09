-- PEPB x WärmSchöN: household size, years lived, years planned and heating age from the interviews.
-- Paste this into Supabase → SQL Editor → New query, then click "Run". It only reads.

select
  n.key as question,
  i.tenure,
  count(*) as answers,
  round(avg(n.value::numeric), 1) as average,
  percentile_cont(0.5) within group (order by n.value::numeric) as median,
  min(n.value::numeric) as lowest,
  max(n.value::numeric) as highest
from public.interviews i
cross join lateral jsonb_each(i.numbers) n
group by n.key, i.tenure
order by n.key, i.tenure;
