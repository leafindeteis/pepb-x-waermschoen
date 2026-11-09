-- PEPB x WärmSchöN: all interviews as one table, one row per interview and one column per question.
-- Paste this into Supabase → SQL Editor → New query, then click "Run". It only reads.
-- To use it in Excel: Export → CSV above the results, then in Excel use Data → From Text/CSV.
-- Empty cells mean the question wasn't answered or doesn't apply (owner/tenant questions).
-- More interviews simply give more rows. Run it again any time for the latest state.

select
  i.interview_date                                   as "Date",
  coalesce(i.texts ->> 'student_name', '')           as "Student",
  coalesce(i.texts ->> 'interview_number', '')       as "Interview number",
  coalesce(i.tenure, '')                             as "Owner or tenant",

  -- About the person
  coalesce(i.choices ->> 'age', '')                  as "Age range",
  coalesce(i.choices ->> 'gender', '')               as "Gender",
  coalesce(i.numbers ->> 'household_size', '')       as "Household size",
  coalesce(i.choices ->> 'german_first_language', '') as "German as first language",

  -- Housing
  coalesce(i.numbers ->> 'years_lived', '')          as "Length of residence (years)",
  coalesce(replace(i.choices ->> 'landlord', '_', ' '), '') as "Landlord (tenants)",
  coalesce(i.texts ->> 'landlord_other', '')         as "Other landlord",
  coalesce(i.numbers ->> 'years_planned', '')        as "Years planning to stay (tenants)",
  coalesce(i.texts ->> 'property_management', '')    as "Property management",
  coalesce(i.choices ->> 'owner_via_management', '') as "Organised via property management (owners)",

  -- Heating supply
  coalesce(i.texts ->> 'heating_type', '')           as "Heating type",
  coalesce(i.texts ->> 'energy_source', '')          as "Energy source",
  coalesce(i.numbers ->> 'heating_age', '')          as "Age of heating system (years)",

  -- Satisfaction
  coalesce(i.choices ->> 'heating_satisfaction', '') as "Satisfied with heating",
  coalesce(i.choices ->> 'insulation_satisfaction', '') as "Satisfied with energetic state",
  coalesce(i.texts ->> 'satisfaction_why', '')       as "Why, problems and defects",
  coalesce(i.choices ->> 'heated_less', '')          as "Heated less than wanted",
  coalesce(i.texts ->> 'heated_less_why', '')        as "Why heated less",
  coalesce(i.choices ->> 'complained', '')           as "Complained to landlord (tenants)",
  coalesce(i.texts ->> 'complained_why', '')         as "Why (not) complained",
  coalesce(i.choices ->> 'tenant_advice', '')        as "Tenant advice known or used (tenants)",

  -- Heating replacement
  coalesce(i.texts ->> 'heating_tenant_wishes', '')  as "Heating replacement: important (tenants)",
  coalesce(i.choices ->> 'owner_heating_looked_into', '') as "Heating replacement: looked into it (owners)",
  coalesce(i.choices ->> 'owner_heating_informed', '') as "Heating replacement: sufficiently informed (owners)",
  coalesce(i.texts ->> 'owner_heating_notes', '')    as "Heating replacement: notes (owners)",

  -- Energy-efficient retrofitting
  coalesce(i.texts ->> 'retrofit_done', '')          as "Retrofitting already done",
  coalesce(i.texts ->> 'retrofit_tenant_wishes', '') as "Retrofitting: important (tenants)",
  coalesce(i.choices ->> 'owner_retrofit_looked_into', '') as "Retrofitting: looked into it (owners)",
  coalesce(i.choices ->> 'owner_retrofit_informed', '') as "Retrofitting: sufficiently informed (owners)",
  coalesce(i.texts ->> 'owner_retrofit_notes', '')   as "Retrofitting: notes (owners)",

  -- Information and participation
  coalesce(i.choices ->> 'knows_how_to_get_informed', '') as "Knows how to get informed",
  coalesce(i.choices ->> 'wants_to_participate', '') as "Wants to participate",
  coalesce(i.texts ->> 'participate_where', '')      as "Participate where",
  coalesce(i.texts ->> 'participate_why', '')        as "Why (not) participate",
  coalesce(i.choices ->> 'heard_of_heat_planning', '') as "Heard of heat planning",
  coalesce(i.texts ->> 'heat_planning_what', '')     as "Heat planning: what, where",

  -- Local heating network
  (select coalesce(string_agg(replace(x, '_', ' '), ', '), '') from jsonb_array_elements_text(coalesce(i.choices -> 'inform_format', '[]')) x)
                                                     as "Inform how (format)",
  coalesce(i.texts ->> 'inform_format_other', '')    as "Other format",
  (select coalesce(string_agg(x, ', '), '') from jsonb_array_elements_text(coalesce(i.choices -> 'inform_by', '[]')) x)
                                                     as "Informed by whom",
  coalesce(i.texts ->> 'inform_by_other', '')        as "Informed by whom else",
  coalesce(i.choices ->> 'coop_interest', '')        as "Interest in cooperative (owners)",
  coalesce(i.texts ->> 'coop_why', '')               as "Why (not) cooperative",

  -- Other
  coalesce(i.texts ->> 'other_notes', '')            as "Other"
from public.interviews i
order by i.interview_date, i.texts ->> 'student_name', i.texts ->> 'interview_number';
