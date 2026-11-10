# PEPB x WärmSchöN

A shared door-to-door map of part of Berlin-Schöneberg. Students log which door they rang, whether anyone opened and whether there was a conversation, and everyone sees the map update live.

The code and the house map in this repository are public. The class code and all door data stay in Supabase, and only people who entered the class code can read the door data.

## Set up the database

1. On [supabase.com](https://supabase.com), create a new project. Choose the Frankfurt region so the data stays in the EU.
2. In **SQL Editor → New query**, paste all of `setup.sql` and click **Run**.
3. In a new query, set the class code. Use at least 10 characters, and don't save it in this repository:

   ```sql
   select public.set_class_code('your class code here');
   ```

4. In **Authentication → Sign In / Providers**, turn on **Allow anonymous sign-ins**. Students sign in without an email address.
5. In **Project Settings → API Keys**, copy the project URL and the **publishable** key into `config.js`. Never use the secret key there.

## Run the class

- **Joining:** share the link and class code with the class, but not in public. Each student enters both, plus their first name.
- **New devices:** access is remembered per browser. A new phone or cleared browser data means entering the code again, and that student can no longer delete entries made on the old one.
- **Changing the code:** run `set_class_code` again. People who already joined stay in.

## Manage the data

Run these in the SQL Editor.

Remove one student's access (their logged doors stay):

```sql
delete from public.members where first_name = 'Name';
```

Delete a mistaken entry, after finding its `id` in the `visits` table:

```sql
delete from public.visits where id = 'the-entry-id';
```

Delete all door data and memberships when the project ends:

```sql
truncate public.interviews, public.visit_reasons, public.visits, public.door_counts, public.floor_extras, public.members, public.join_attempts;
delete from auth.users where is_anonymous;
```

## Get the statistics

Paste `stats.sql` into the SQL Editor and click **Run**. It shows how many doors were rung and opened, how many conversations took place, and how many houses were visited, without any names.

For the reasons why doors opened without a conversation, do the same with `stats-reasons.sql`. Students choose a reason when they log such a door, but only you can see the reasons, in the SQL Editor.

When you have your statistics, you can remove the link between reasons and addresses by running `delete from public.visit_reasons;`.

## Interviews

The interview form was removed from the website on 10 November 2026; interviews will move to LimeSurvey. Interviews saved before then are still in the `interviews` table in Supabase. You can read them with these queries in the SQL Editor:

- `export-interviews-table.sql`: one row per interview and one column per question, for Excel
- `stats-interviews.sql`, `stats-interview-numbers.sql`, `export-interview-texts.sql`: counts, averages and written answers

To delete all of them: `truncate public.interviews;`

## Files

| File | What it does |
|---|---|
| `index.html`, `style.css` | The map page and its look |
| `app.js` | Map, door list, joining, saving and live updates |
| `data.js` | Houses, streets and parks in the campaign area |
| `config.js` | Public connection details for Supabase |
| `setup.sql` | Tables, access rules and database functions |
| `stats.sql`, `stats-reasons.sql` | Totals for the end of the project |
| `update-reasons.sql`, `update-interviews.sql` | Add later features to a database set up before they existed |
| `stats-interviews.sql`, `stats-interview-numbers.sql`, `export-interview-texts.sql`, `export-interviews-table.sql` | Interview results |
| `.github/workflows/keep-alive.yml` | Stops the free Supabase project from pausing |

Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, available under the Open Database License.
