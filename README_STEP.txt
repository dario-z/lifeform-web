DIGITAL LIFEFORM — LOGIN ENGLISH SOURCE TRANSLATION V13

Questa volta non usa overlay CSS per tradurre la login:
- rimuove le vecchie scritte generate via CSS;
- lascia visibile il testo reale dei componenti;
- include uno script che traduce direttamente le stringhe sorgente dentro src;
- traduce bottoni, tab, titoli, sottotitoli, note e placeholder/esempi dei campi login/register;
- mantiene rimosso il badge "PROJECT LIFEFORM".

Installazione:
1. Estrarre nella root:
   C:\Projects\lifeform-web

2. Sovrascrivere:
   src\components\IvoryGlassTheme.css

3. Copiare anche:
   scripts\translate-login-to-english.mjs

4. Eseguire UNA VOLTA:
   node scripts\translate-login-to-english.mjs

5. Poi:
   npm run build
   npm run dev

6. Refresh senza cache / scheda privata.

Nota:
lo script modifica direttamente i file sorgente dentro src cercando le stringhe italiane esistenti.
