DIGITAL LIFEFORM — SPRINT 01 DREAMS

This package implements the first Dreams system.

Features:
- new Supabase table: dreams
- one Dream per Lifeform per local day
- Dream generated automatically when the user returns after midnight
- Gemini-generated short surreal dream
- Dream prompt uses:
  - current emotion
  - full emotion levels
  - last emotion reason
  - recent messages
  - Key Memories
  - previous Dream
  - one required random anchor
- 100 random anchors for each emotional state:
  neutral, curious, engaged, happy, concerned, sad, wary, irritated, angry,
  afraid, reflective, tired, dormant, thinking, horny
- Dreams panel in hamburger menu
- only last 3 Dreams are kept
- recent Dreams are added to Gemini context so the user can ask about them

Install:
1. Extract this ZIP in:
   C:\Projects\lifeform-web

2. In Supabase SQL Editor, run:
   supabase\lifeform_dreams_migration.sql

3. In terminal:
   cd /d C:\Projects\lifeform-web
   npm run build
   npm run dev

4. Refresh without cache.

Expected UI:
- hamburger menu contains "Dreams 0/3" or similar
- opening Dreams shows the Dreams panel
- after returning on a new local day, the app generates one Dream in background
- only the latest 3 Dreams remain saved

Important:
- This sprint does not add gacha, inventory, rituals, currencies, rewards, or evolution.
- Dreams are symbolic fragments, not factual memories.
- If generation fails, chat should continue working and the Dreams panel will show the error.
