DIGITAL LIFEFORM — SPRINT 07
SEPARATE GOALS + BELIEFS

Sprint 06 introduced a proposal card. This sprint gives accepted Goals and Beliefs
their own tables and panels instead of mixing them into Key Memories.

STRUCTURE
---------
Key Memories
- durable facts, preferences, people, places, projects and events;
- maximum 10 total;
- no status or progress.

Goals
- durable directions, not a to-do list;
- Active / Paused / Completed / Archived;
- maximum 3 Active.

Beliefs
- tentative perspectives belonging to the Lifeform;
- Active / Archived;
- maximum 10 Active.

INSTALLATION
------------
1. Create a safety commit:

   cd /d C:\Projects\lifeform-web
   git add .
   git commit -m "Stable base before goals and beliefs"
   git push

2. Extract this ZIP into:

   C:\Projects\lifeform-web

3. In Supabase Dashboard -> SQL Editor run:

   supabase\lifeform_goals_beliefs_migration.sql

4. Build and run:

   cd /d C:\Projects\lifeform-web
   npm run build
   npm run dev

MIGRATION
---------
Any legacy Key Memory with category:
- long_term_goal
- lifeform_belief

is copied into the new table and then removed from Key Memories. This is deliberate:
after the migration each item has one canonical home and Goals/Beliefs no longer
consume space in the 10 Key Memories limit.

TEST
----
- Open hamburger menu: Goals and Beliefs should appear.
- Confirm a Possible goal: it must enter Goals, not Key Memories.
- Confirm a Possible belief: it must enter Beliefs, not Key Memories.
- Goals can be paused, completed, archived and reactivated.
- Beliefs can be archived and reactivated.
- The active limits are 3 Goals and 10 Beliefs.
- If npm run build reports any TypeScript error, stop and paste the full error.
