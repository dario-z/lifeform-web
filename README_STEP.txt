DIGITAL LIFEFORM — SPRINT 04
OFFLINE EMOTIONAL DRIFT + LONELINESS

What this sprint adds
--------------------
1. Offline emotional decay:
   - Normal emotional levels halve every 24 hours.
   - Humor halves every 8 hours.
   - Levels below 2 become 0 naturally through rounding.
   - The browser applies the elapsed-time calculation when the app opens,
     becomes visible again, and every 30 minutes while it remains open.

2. Automatic Loneliness:
   - Internal key: lonely
   - UI label: Loneliness
   - Starts only after 24 hours without opening the app.
   - Target:
       36h away -> about 15
       48h away -> about 30
       72h away -> about 60
       max -> 75
   - It does NOT guilt, accuse, pressure or manipulate the user.
   - After one completed conversation exchange, Loneliness is reduced to 45%
     of its current value.
   - Uses sad_2.png with sad_1.png as fallback. No new sprite required.

3. Dreams:
   - Adds 100 Lonely random anchors.
   - This sprint does not yet rewrite Dream length/anchor language/anchor-centrality.
     Those belong to the next separate Dream-quality sprint.

INSTALLATION
------------
0. Backup first:

   cd /d C:\Projects\lifeform-web
   git add .
   git commit -m "Stable base before offline emotional drift"
   git push

1. Extract this ZIP in:
   C:\Projects\lifeform-web

2. Apply the Supabase migration manually:
   Supabase Dashboard -> SQL Editor
   Open and run:
   supabase\lifeform_offline_drift_loneliness_migration.sql

3. Patch the project-specific types/labels:
   cd /d C:\Projects\lifeform-web
   node scripts\apply-loneliness-type-label-patch.mjs

4. Build:
   npm run build
   npm run dev

TEST PLAN
---------
A. Fast visual test
- Open Emotions.
- Verify Loneliness is visible.
- Verify it says:
  Automatic: begins after 24 hours away and eases after conversation.

B. Test the 24-hour formula without waiting
- In Supabase Table Editor, open lifeforms.
- For your Lifeform, temporarily set:
  emotion_decay_at = now() - interval '12 hours'
  last_connection_at = now() - interval '48 hours'
- Reload the app.
- Existing emotion scores should noticeably decline.
- Loneliness should rise to about 30.
- Send one completed message/reply exchange.
- Loneliness should drop to about 13–14.

C. Sprite
- If Loneliness is the strongest active state, the sprite should use sad_2.png
  (or sad_1.png if sad_2.png is unavailable).

IMPORTANT
---------
- Do not run the migration twice in different variants. The provided SQL is idempotent.
- No Dream generation behaviour is changed except the availability of lonely anchors.
- If npm run build reports a missing lonely property in another Record<EmotionalState, ...>,
  paste the exact error before editing further.
