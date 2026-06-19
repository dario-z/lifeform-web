DIGITAL LIFEFORM — CHANGE API PAGE ENGLISH TRANSLATION

Questo pacchetto traduce la pagina CHANGE API in inglese intervenendo sui file sorgente esistenti.

File bersaglio:
- src\components\GeminiSetup.tsx
- src\lib\gemini.ts

Traduce:
- intestazioni
- descrizioni
- dettagli provider/modello/token
- link Google AI Studio
- selettore modello
- descrizione modello
- soglia token giornaliera
- campo API key
- placeholder
- pulsanti Show/Hide, Verify and connect, Sign out
- note di sicurezza
- messaggi di errore Gemini
- descrizioni dei modelli

Installazione:
1. Estrarre nella root:
   C:\Projects\lifeform-web

2. Eseguire:
   cd /d C:\Projects\lifeform-web
   node scripts\translate-change-api-page.mjs

3. Poi:
   npm run build
   npm run dev

Lo script stampa quante sostituzioni fa e segnala eventuali frammenti italiani sospetti rimasti nei due file.
