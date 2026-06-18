DIGITAL LIFEFORM — IVORY GLASS V2

Modifiche:
- login usa neutral.nosfondo.png;
- sprite login molto più grande;
- tutti gli accenti testuali rossi diventano grafite;
- entrambe le bolle chat sono grafite con testo bianco;
- titoli grandi con font di sistema più leggibile e peso 600;
- login nuovamente scrollabile su mobile;
- body bloccato solo quando la chat è realmente aperta;
- ripristinata la possibilità di usare il pulsante ACCEDI su mobile.

Installazione:
1. Estrarre lo ZIP nella root:
   C:\Projects\lifeform-web

2. Confermare la sovrascrittura di:
   src\components\LifeformChat.tsx
   src\components\IvoryGlassTheme.css

3. Verificare che esista:
   public\sprites\emotions\neutral.nosfondo.png

4. Eseguire:
   npm run build
   npm run dev

5. Aggiornare con CTRL+F5.
   Sul telefono usare una scheda privata al primo test.

Non sono richieste modifiche SQL.
