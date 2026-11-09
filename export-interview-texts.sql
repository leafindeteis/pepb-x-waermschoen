-- PEPB x WärmSchöN: all written answers from the interviews, one row per answer.
-- Paste this into Supabase → SQL Editor → New query, then click "Run". It only reads.
-- To save the result, use the download (Export → CSV) button above the results.
-- "interview" numbers the interviews in the database; "interview_number" is the number the student entered.

with numbered as (
  select row_number() over (order by interview_date, id) as interview, *
  from public.interviews
)
select
  interview,
  texts ->> 'student_name' as student,
  texts ->> 'interview_number' as interview_number,
  interview_date,
  tenure,
  t.key as question,
  t.value #>> '{}' as answer
from numbered
cross join lateral jsonb_each(texts - 'student_name' - 'interview_number') t
order by interview, question;
