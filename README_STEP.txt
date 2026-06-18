DIGITAL LIFEFORM — MOBILE IMMERSIVE OVERLAY

Nuovo layout mobile:
- Nessuno scroll della pagina.
- Solo la cronologia della chat è scrollabile.
- Sprite grande sullo sfondo dell'intero schermo.
- Chat trasparente sovrapposta alla metà inferiore.
- Le bolle sfumano progressivamente verso l'alto.
- Pulsante hamburger in alto a sinistra.
- Menu laterale con modello, stato, token e tutti i pulsanti extra.
- L'etichetta emotiva resta piccola accanto al pulsante menu.
- Il vecchio divisore mobile viene nascosto in questa modalità.

Installazione:
1. Estrarre nella root C:\Projects\lifeform-web
2. Sovrascrivere:
   src\components\LifeformChat.tsx
   src\components\MobileChatLayout.css
3. npm run build
4. npm run dev
5. Testare prima in modalità responsive e poi sul telefono.
6. Dopo il deploy, aprire una scheda privata o ricaricare senza cache.

Nessuna modifica SQL richiesta.
