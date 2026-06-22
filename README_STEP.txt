DIGITAL LIFEFORM — SPRINT 10.1
PROPOSAL ARBITRATION: THREADS BEFORE AUTONOMOUS MEMORIES

WHY THIS PATCH EXISTS
---------------------
Sprint 10 showed that automatic Key Memory proposals were too eager. They could
occupy the single pending-proposal slot with an ordinary project mention or
personal detail before an Active Thread had a chance to be proposed.

This patch makes the decision conservative and gives Threads the right priority.

BEHAVIOUR AFTER THIS PATCH
--------------------------
1. Explicit “remember/save this” requests keep the current direct save flow.

2. Clear ongoing work — project, sprint, continuation, resuming, next step,
   development, migration, prototype, release, or an existing Thread title —
   is evaluated as a Thread first.

3. A Thread candidate is queued before autonomous Key Memory proposals. One
   exchange can no longer create both kinds of proposal.

4. A work-context exchange suppresses autonomous memory even when no Thread is
   proposed yet. Generic project names, work notes and personal-project chatter
   therefore do not fill Key Memories.

5. Autonomous Key Memories now require:
   - importance of at least 85; and
   - an explicit durable collaboration preference or standing constraint cue.

   This keeps automatic Memory proposals for things such as language, format,
   tone, style and recurring workflow preferences. Personal anecdotes, job
   details, hobbies, temporary plans, ordinary projects, current issues and
   one-off events will not become automatic memories.

INSTALLATION
------------
0. Commit the tested Sprint 10 version first:

   cd /d C:\Projects\lifeform-web
   git add .
   git commit -m "Stable base before proposal arbitration"
   git push

1. Extract this ZIP into:

   C:\Projects\lifeform-web

2. No Supabase SQL migration is required.

3. Build:

   cd /d C:\Projects\lifeform-web
   npm run build
   npm run dev

TESTS
-----
A. Thread priority:
   Send:
   “We are continuing the Digital Lifeform web app. Sprint 10 Threads is
   installed, and now we need to refine how proposal arbitration works.”

   Expected: a Possible Active Thread / Possible Thread update can appear.
   Expected: no Key Memory proposal from the same exchange.

B. No project-memory noise:
   Send:
   “I have an idea for a personal project.”

   Expected: usually no proposal. It is not automatically a Key Memory.

C. Stable collaboration preference:
   Send:
   “Going forward, I prefer concise technical answers with a complete file when
   we are editing code.”

   Expected: a Key Memory proposal may appear.

D. Explicit memory:
   Send:
   “Remember that I prefer concise technical answers.”

   Expected: the existing explicit memory save flow still works.

IMPORTANT
---------
Do not run SQL. This patch only replaces:
- src/components/LifeformChat.tsx
- src/lib/emotions.ts
