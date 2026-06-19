DIGITAL LIFEFORM — LOGIN TEXT CLEANUP V12

Correzioni:
- rimosso completamente il badge "PROJECT LIFEFORM";
- rimosse le scritte extra sovrapposte ai pulsanti LOGIN / REGISTER;
- sostituito il sottotitolo sotto "Give your AI a presence." con testo inglese;
- rimossi gli overlay CSS che duplicavano titoli e testi nella zona login;
- ripristinato contrasto leggibile per label, input e placeholder.

Nota:
questa patch è volutamente conservativa e corregge il casino visivo attuale via CSS.
Per tradurre perfettamente anche ogni placeholder/testo sorgente della login, il passo successivo ideale è modificare direttamente il componente React che contiene la schermata di autenticazione.

File modificato:
src\components\IvoryGlassTheme.css

Installazione:
1. Estrarre nella root:
   C:\Projects\lifeform-web

2. Sovrascrivere:
   src\components\IvoryGlassTheme.css

3. Eseguire:
   npm run build
   npm run dev

4. Ricaricare senza cache.
