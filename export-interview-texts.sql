-- PEPB x WärmSchöN: all written answers from the interviews, one row per answer.
-- Paste this into Supabase → SQL Editor → New query, then click "Run". It only reads.
-- To save the result, use the download (Export → CSV) button above the results.
-- "interview" numbers the interviews, so you can see which answers belong together.

with numbered as (
  select row_number() over (order by interview_date, id) as interview, *
  from public.interviews
)
select interview, interview_date, tenure, t.key as question, t.value #>> '{}' as answer
from numbered
cross join lateral jsonb_each(texts) t
order by interview, question;
