DIGITAL LIFEFORM — DARK FORM FIELD TEXT V14

Questa patch rende più scuri e leggibili i testi dentro:
- input;
- select;
- textarea;
- placeholder;
- opzioni dei menu a tendina;
- campi autofill di Chrome/Safari.

Non sovrascrive il CSS: aggiunge solo un blocco finale a:
src\components\IvoryGlassTheme.css

Installazione:
1. Estrarre nella root:
   C:\Projects\lifeform-web

2. Eseguire:
   cd /d C:\Projects\lifeform-web
   node scripts\append-dark-form-field-text.mjs

3. Poi:
   npm run build
   npm run dev

4. Ricaricare senza cache.
