-- PEPB x WärmSchöN: all interviews as one table, one row per interview and one column per question.
-- Paste this into Supabase → SQL Editor → New query, then click "Run". It only reads.
-- To use it in Excel: Export → CSV above the results, then in Excel use Data → From Text/CSV.
-- Empty cells mean the question wasn't answered or doesn't apply (owner/tenant questions).

select
  i.interview_date                                   as "Date",
  i.texts ->> 'student_name'                         as "Student",
  i.texts ->> 'interview_number'                     as "Interview number",
  i.tenure                                           as "Owner or tenant",

  -- About the person
  i.choices ->> 'age'                                as "Age range",
  i.choices ->> 'gender'                             as "Gender",
  i.numbers ->> 'household_size'                     as "Household size",
  i.choices ->> 'german_first_language'              as "German as first language",

  -- Housing
  i.numbers ->> 'years_lived'                        as "Length of residence (years)",
  replace(i.choices ->> 'landlord', '_', ' ')        as "Landlord (tenants)",
  i.texts ->> 'landlord_other'                       as "Other landlord",
  i.numbers ->> 'years_planned'                      as "Years planning to stay (tenants)",
  i.texts ->> 'property_management'                  as "Property management",
  i.choices ->> 'owner_via_management'               as "Organised via property management (owners)",

  -- Heating supply
  i.texts ->> 'heating_type'                         as "Heating type",
  i.texts ->> 'energy_source'                        as "Energy source",
  i.numbers ->> 'heating_age'                        as "Age of heating system (years)",

  -- Satisfaction
  i.choices ->> 'heating_satisfaction'               as "Satisfied with heating",
  i.choices ->> 'insulation_satisfaction'            as "Satisfied with energetic state",
  i.texts ->> 'satisfaction_why'                     as "Why, problems and defects",
  i.choices ->> 'heated_less'                        as "Heated less than wanted",
  i.texts ->> 'heated_less_why'                      as "Why heated less",
  i.choices ->> 'complained'                         as "Complained to landlord (tenants)",
  i.texts ->> 'complained_why'                       as "Why (not) complained",
  i.choices ->> 'tenant_advice'                      as "Tenant advice known or used (tenants)",

  -- Heating replacement
  i.texts ->> 'heating_tenant_wishes'                as "Heating replacement: important (tenants)",
  i.choices ->> 'owner_heating_looked_into'          as "Heating replacement: looked into it (owners)",
  i.choices ->> 'owner_heating_informed'             as "Heating replacement: sufficiently informed (owners)",
  i.texts ->> 'owner_heating_notes'                  as "Heating replacement: notes (owners)",

  -- Energy-efficient retrofitting
  i.texts ->> 'retrofit_done'                        as "Retrofitting already done",
  i.texts ->> 'retrofit_tenant_wishes'               as "Retrofitting: important (tenants)",
  i.choices ->> 'owner_retrofit_looked_into'         as "Retrofitting: looked into it (owners)",
  i.choices ->> 'owner_retrofit_informed'            as "Retrofitting: sufficiently informed (owners)",
  i.texts ->> 'owner_retrofit_notes'                 as "Retrofitting: notes (owners)",

  -- Information and participation
  i.choices ->> 'knows_how_to_get_informed'          as "Knows how to get informed",
  i.choices ->> 'wants_to_participate'               as "Wants to participate",
  i.texts ->> 'participate_where'                    as "Participate where",
  i.texts ->> 'participate_why'                      as "Why (not) participate",
  i.choices ->> 'heard_of_heat_planning'             as "Heard of heat planning",
  i.texts ->> 'heat_planning_what'                   as "Heat planning: what, where",

  -- Local heating network
  (select string_agg(replace(x, '_', ' '), ', ') from jsonb_array_elements_text(coalesce(i.choices -> 'inform_format', '[]')) x)
                                                     as "Inform how (format)",
  i.texts ->> 'inform_format_other'                  as "Other format",
  (select string_agg(x, ', ') from jsonb_array_elements_text(coalesce(i.choices -> 'inform_by', '[]')) x)
                                                     as "Informed by whom",
  i.texts ->> 'inform_by_other'                      as "Informed by whom else",
  i.choices ->> 'coop_interest'                      as "Interest in cooperative (owners)",
  i.texts ->> 'coop_why'                             as "Why (not) cooperative",

  -- Other
  i.texts ->> 'other_notes'                          as "Other"
from public.interviews i
order by i.interview_date, i.texts ->> 'student_name', i.texts ->> 'interview_number';
