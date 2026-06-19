DIGITAL LIFEFORM — TOP EMOTIONS + REQUESTED KEY MEMORY + TAP PNG CYCLE

Modifiche incluse:

1. Top 3 emozioni
- L'etichetta sopra lo sprite non mostra più solo un'emozione.
- Ora mostra fino alle 3 emozioni più alte, con relativo punteggio.
- Se c'è una reazione temporanea, può entrare nella top 3 per quei due secondi.

2. Key Memories richieste esplicitamente dall'utente
- Se l'utente chiede di creare/salvare/registrare una Key Memory, il sistema forza il salvataggio.
- La memoria viene estratta dal contesto degli ultimi messaggi, quindi funziona anche con frasi tipo:
  "salva una key memory di quello di cui stavamo parlando".
- Queste memorie vengono salvate come Manuali, non Auto.
- Se esiste già una memoria simile, viene aggiornata.
- Se il limite 10/10 è pieno, può sostituire la memoria Auto meno importante.
- Se sono tutte Manuali, viene mostrato un errore e l'utente deve eliminarne una dal pannello.

3. Click/tap sugli sprite PNG intercambiabili
- Per curious, happy, sad e horny, toccare/cliccare lo sprite passa subito alla variante successiva.
- Il ciclo automatico ogni 3 secondi resta attivo.
- Engaged e Thinking restano contestuali in base ai livelli emotivi, perché hanno una sola variante scelta semanticamente.

Installazione:
1. Estrarre nella root:
   C:\Projects\lifeform-web

2. Sovrascrivere:
   src\components\LifeformChat.tsx
   src\components\LifeformSprite.tsx
   src\components\IvoryGlassTheme.css

3. Eseguire:
   npm run build
   npm run dev

4. Aggiornare con CTRL+F5.
   Su mobile, usare una scheda privata al primo test.

Nessuna modifica SQL richiesta.
