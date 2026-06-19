DIGITAL LIFEFORM — SPRINT 02 DREAM ARRIVAL

This package improves the Dreams feature without adding gacha, rituals, inventory, or stats.

New behavior:
- When a new Dream exists and has not been read, the hamburger menu shows a small "NEW DREAM" pill.
- While a Dream is being generated, the Dreams button shows "Dreaming…".
- While the Dream is being generated, the Lifeform sprite switches to the dormant state.
- The Dreams panel highlights the unread Dream with a "NEW DREAM" label.
- Each Dream has:
  - "Ask about this dream"
  - "Copy dream"
- Asking about a Dream sends a direct chat prompt that tells the Lifeform to interpret the saved Dream without inventing a new one.
- The interpretation instructions now explicitly avoid constant melodrama; interpretations may be calm, playful, funny, mundane, absurd, or unresolved.
- No new Supabase migration is required.

Install:
1. Extract this ZIP in:
   C:\Projects\lifeform-web

2. Run:
   cd /d C:\Projects\lifeform-web
   npm run build
   npm run dev

3. Refresh without cache.

Test:
1. Open the app.
2. If the app generates a Dream, the sprite should become dormant during generation.
3. The menu should show "Dreaming…" while generation is active.
4. After generation, the menu should show "NEW DREAM".
5. Open Dreams.
6. The newest Dream should be highlighted.
7. Click "Ask about this dream".
8. The chat should send a prompt asking for an interpretation of that saved Dream.
