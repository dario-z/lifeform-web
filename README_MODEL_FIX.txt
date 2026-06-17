GEMINI FLASH-LITE LATEST - COMPLETE FIX

This update makes gemini-flash-lite-latest the only global default and adds the model selector to both:
- the "Connetti <Lifeform>" page
- the chat header

Files replaced:
- src/lib/gemini.ts
- src/lib/geminiModels.ts
- src/lib/emotions.ts
- src/components/GeminiSetup.tsx
- src/components/LifeformChat.tsx
- src/components/GeminiModelSelect.css

No Supabase migration is required.

Install:
1. Extract this ZIP into C:\Projects\lifeform-web
2. Confirm replacement of all files.
3. Run:
   npm run build
   npm run dev
4. Open "Cambia API" once. On the connection page, select the model and reconnect.
5. Hard refresh with CTRL+F5.

The selected model is stored in localStorage under:
lifeform.gemini-model

The legacy key digital-lifeform.gemini-model is automatically migrated.
