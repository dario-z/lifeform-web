DIGITAL LIFEFORM — SPRINT 05
DREAM QUALITY: LOCALIZED CENTRAL ANCHORS

This sprint upgrades Dream generation only. It does not add database columns or change the Dreams UI.

WHAT CHANGES
------------
1. Shorter Dreams
   - Old target: 55–170 words
   - New hard limit: 35–70 words
   - The app validates the word count. If Gemini misses the target, it retries once.

2. Localized anchors
   - Anchor libraries can stay internally in English.
   - The saved Dream anchor and the Dream itself must be written in the Lifeform language.
   - Italian Lifeforms will save an Italian anchor; French Lifeforms a French anchor; etc.
   - For non-English Lifeforms, the raw English source anchor is rejected.

3. Anchor is now the centre of the Dream
   - The localized anchor must be in the first sentence.
   - It must return in the final sentence.
   - It must occur exactly twice.
   - It must cause or transform at least two events.
   - It cannot be mere scenery.

4. Automatic retry
   - If Gemini gives a Dream that is too long/short, keeps the English anchor,
     or fails the first/final-sentence anchor structure, the app asks once more
     for a compliant replacement.
   - If it still fails, Dream generation fails silently as before and retries
     the next time the app is opened. Chat is never blocked.

INSTALLATION
------------
1. Extract this ZIP in:
   C:\Projects\lifeform-web

2. It replaces only:
   src\lib\dreams.ts

3. No Supabase migration is needed.

4. Build:
   cd /d C:\Projects\lifeform-web
   npm run build
   npm run dev

TESTING WITHOUT WAITING UNTIL TOMORROW
--------------------------------------
To force a new Dream for testing, remove today's Dream row in Supabase:

  delete from public.dreams
  where lifeform_id = 'YOUR_LIFEFORM_ID'
    and dream_date = current_date;

Then reload the app. Wait for Dreaming… to finish.

Expected for an Italian Lifeform:
- 35–70 words.
- random anchor shown in Dreams is Italian, not English.
- Same anchor appears in the first and final sentence.
- The anchor visibly drives the whole Dream.

Important:
Existing saved Dreams are not modified. They naturally disappear once newer
Dreams replace them in the three-Dream retention window.
