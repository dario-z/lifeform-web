DIGITAL LIFEFORM — SPRINT 06
CONFIRMED MEMORY / GOAL / BELIEF PROPOSALS

PURPOSE
-------
This sprint stops the Lifeform from autonomously writing important memories.
Instead, it can create one conservative proposal at a time, and the user decides.

A proposal can be displayed as:
- Possible memory
- Possible goal
- Possible belief

There is no separate Goals database yet: accepted Goals and Beliefs are stored as
confirmed Key Memories using their existing categories:
- long_term_goal
- lifeform_belief

This keeps the system small, safe and compatible with the current app.

BEHAVIOUR
---------
1. Autonomous proposals are deliberately rare:
   - one pending proposal maximum;
   - importance must be at least 70;
   - generic summaries, filler words, casual phrases, temporary moods and one-off details
     are rejected before a card is created;
   - exact dismissed content is not proposed again automatically.

2. The card appears above the chat composer:
   “I think this could matter.”
   [Keep it] [Dismiss]

3. Keep it:
   - stores the item as a Key Memory with source = manual;
   - user-confirmed memories are never changed automatically later;
   - updates a very similar existing Key Memory instead of duplicating it.

4. Dismiss:
   - removes the pending card;
   - does not create a Key Memory;
   - prevents the exact same proposed text from being shown again automatically.

5. Explicit commands still work directly:
   If the user explicitly says “remember this”, “save this memory”, “ricorda che…”,
   the existing manual Key Memory flow remains immediate. The user has already made
   the decision in that case.

6. Clear chat:
   - dismisses any pending proposal tied to the old conversation;
   - preserves already accepted Key Memories, exactly as before.

IMPORTANT LIMIT
---------------
The existing Key Memories limit of 10 remains active.
If all 10 slots are occupied and the proposed item does not update a similar memory,
the app will show an error and will not silently delete another confirmed memory.

INSTALLATION
------------
0. Create a safety commit first:

   cd /d C:\Projects\lifeform-web
   git add .
   git commit -m "Stable base before confirmed proposals"
   git push

1. Extract this ZIP into:

   C:\Projects\lifeform-web

2. In Supabase Dashboard -> SQL Editor, run:

   supabase\lifeform_proposals_migration.sql

3. Then build and run:

   cd /d C:\Projects\lifeform-web
   npm run build
   npm run dev

FILES ADDED
-----------
- src/types/lifeformProposal.ts
- src/components/LifeformProposalCard.tsx
- src/components/LifeformProposalCard.css
- supabase/lifeform_proposals_migration.sql

FILES UPDATED
-------------
- src/lib/emotions.ts
- src/components/LifeformChat.tsx

TESTING
-------
A. Build
   npm run build

B. Visual test without waiting for Gemini to decide naturally:
   In Supabase SQL Editor, insert a test proposal. Replace YOUR_LIFEFORM_ID.

   insert into public.lifeform_proposals (
     user_id,
     lifeform_id,
     kind,
     status,
     action,
     target_memory_id,
     category,
     content,
     importance,
     reason
   )
   select
     user_id,
     id,
     'goal',
     'pending',
     'create',
     null,
     'long_term_goal',
     'Improve the Dream system so its central images feel meaningful.',
     82,
     'This is a durable direction that can guide future conversations.'
   from public.lifeforms
   where id = 'YOUR_LIFEFORM_ID';

   Reload the app. The card should appear above the composer as “Possible goal”.

C. Acceptance test
   - Click Keep it.
   - Open Key Memories.
   - Confirm the item is present.
   - Confirm it is now a manual / user-confirmed memory.

D. Dismissal test
   - Repeat the SQL test with a different content string.
   - Click Dismiss.
   - Confirm the card disappears and no Key Memory is created.

NATURAL TEST
------------
The normal model is intentionally conservative. Use a genuinely durable statement,
not a casual chat line. For example:

“I am building Digital Lifeform as a long-term project, and I want it to preserve
only memories that I explicitly confirm.”

The Lifeform may propose it after the reply. It should not propose random repeated
words or trivial wording.
