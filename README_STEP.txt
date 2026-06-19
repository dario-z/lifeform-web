DIGITAL LIFEFORM — CHANGE API HIGH CONTRAST V15

La patch precedente agiva quasi solo su input/select/placeholder.
Questa invece forza il contrasto di tutta la pagina Change API / Gemini setup:
- descrizione;
- riquadri Provider / Selected model / Daily tokens / Cloud storage;
- label;
- testo dentro input e select;
- placeholder;
- note descrittive;
- checkbox "Remember the key";
- Sign out.

Installazione:
1. Estrarre nella root:
   C:\Projects\lifeform-web

2. Eseguire:
   cd /d C:\Projects\lifeform-web
   node scripts\append-change-api-contrast.mjs

3. Poi:
   npm run build
   npm run dev

4. Refresh senza cache.
