DIGITAL LIFEFORM — HUMOR LABEL FIX

Risolve l'errore:

Property 'amused' is missing in EMOTION_LABELS

Installazione:
1. Estrarre nella root:
   C:\Projects\lifeform-web

2. Eseguire:
   cd /d C:\Projects\lifeform-web
   node scripts\fix-humor-label.mjs

3. Poi:
   npm run build

Fix manuale equivalente:
Aprire:
src\lib\sprites.ts

Dentro EMOTION_LABELS aggiungere:
amused: 'Humor',
