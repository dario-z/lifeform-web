DIGITAL LIFEFORM — VISUAL CONTRAST + ENGLISH MENUS + LARGE SPRITES

Modifiche incluse:

1. Contrasto testi
- Il nome della Lifeform sopra le sue bolle ora è chiaro come quello dell'utente.
- Le bolle restano grafite con testo bianco.
- Sono stati aggiunti override di contrasto per evitare testo chiaro su chiaro o scuro su scuro nelle zone principali.

2. Menu in inglese
- Menu mobile: State, Model, Tokens today, Emotions, Key Memories, Clear chat, Change API, Sign out.
- Pannello Emotions tradotto in inglese.
- Pannello Key Memories tradotto in inglese.
- Categorie Key Memories tradotte in inglese.
- Messaggi generici della chat tradotti in inglese.

3. Sprite desktop
- Su browser desktop la sezione sprite a sinistra non lascia più vedere il colore di sfondo del pannello.
- Lo sprite riempie tutta la sezione con object-fit: cover.
- I piccoli indicatori vengono sovrapposti sopra allo sprite.

4. Login
- Lo sprite nella schermata di login è molto più grande.
- La schermata di login ruota automaticamente gli sprite ogni secondo.
- Le varianti horny sono escluse dalla rotazione del login.
- Le scritte del pannello sinistro sono sovrapposte a una bolla grafite con trasparenza sfumata verso l'alto.

File inclusi:
src\components\LifeformChat.tsx
src\components\LifeformSprite.tsx
src\components\IvoryGlassTheme.css
src\components\KeyMemoriesPanel.tsx
src\components\EmotionMonitor.tsx
src\lib\keyMemories.ts

Installazione:
1. Estrarre nella root:
   C:\Projects\lifeform-web

2. Sovrascrivere i file indicati sopra.

3. Eseguire:
   npm run build
   npm run dev

4. Ricaricare con CTRL+F5.
   Su mobile, usare una scheda privata al primo test.

Nessuna modifica SQL richiesta.
