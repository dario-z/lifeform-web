# SPRINT 01 — Dreams

This sprint adds the first daily Dream system to Digital Lifeform.

## Design

A Dream is a short surreal fragment generated after midnight when the user returns to the app.

The app does not need a backend cron for this first version.

Instead:

1. User opens the chat.
2. Messages, emotion state, Key Memories and Dreams are loaded.
3. The app checks whether today's Dream already exists.
4. If not, Gemini generates one in the background.
5. The Dream is saved.
6. The app keeps only the last 3 Dreams.
7. Recent Dreams are included in the Lifeform's normal reply context.

## Random anchors

The implementation includes 100 random anchors for every emotional state.

The selected anchor is required in the prompt and must appear naturally in the Dream.

The anchor prevents the Dream from becoming a direct summary of the current conversation.

## Dream rules

The Dream must:

- be 55–170 words;
- have a title of 2–6 words;
- use surreal symbolic imagery;
- include the required random anchor;
- not directly mention code, UI, API keys, bugs, database, implementation details or user requests;
- not explain itself;
- not be a summary.

## Files

- `supabase/lifeform_dreams_migration.sql`
- `src/types/dream.ts`
- `src/lib/dreamAnchors.ts`
- `src/lib/dreams.ts`
- `src/components/DreamsPanel.tsx`
- `src/components/DreamsPanel.css`
- `src/components/LifeformChat.tsx`

## Test

Run:

```cmd
npm run build
npm run dev
```

Then:

1. Open the app.
2. Open hamburger menu.
3. Confirm `Dreams 0/3` appears.
4. Open Dreams panel.
5. Confirm no crash.
6. If no Dream appears immediately, wait for background generation.
7. Ask the Lifeform about its latest dream after generation.
