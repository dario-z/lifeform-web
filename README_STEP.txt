DIGITAL LIFEFORM — MP4 EMOTION TRANSITIONS

Nuova funzione:
- quando cambia emozione, viene riprodotto prima il video MP4 relativo;
- al termine del video, la UI torna automaticamente alla PNG della stessa emozione;
- il passaggio video -> PNG è pensato per essere seamless;
- toccando/cliccando lo sprite, il video dell'emozione corrente viene riprodotto in qualsiasi momento;
- anche la riproduzione manuale mantiene il lieve movimento zoom/bounce già applicato agli sprite;
- se un MP4 manca o non viene caricato, la UI torna alla PNG senza bloccare la chat.

Percorso previsto dei video:
public\sprites\emotions\mp4\neutral.mp4
public\sprites\emotions\mp4\happy.mp4
public\sprites\emotions\mp4\sad.mp4
...

I nomi devono corrispondere alle chiavi interne degli sprite:
neutral, curious, engaged, happy, concerned, sad, wary, irritated,
angry, afraid, reflective, tired, dormant, thinking, horny.

Nota:
la UI mostra "Excited", ma la chiave interna e quindi il file restano:
horny.mp4

Installazione:
1. Estrarre nella root:
   C:\Projects\lifeform-web

2. Sovrascrivere:
   src\components\LifeformSprite.tsx
   src\components\IvoryGlassTheme.css

3. Verificare che i video siano in:
   public\sprites\emotions\mp4

4. Eseguire:
   npm run build
   npm run dev

5. Aggiornare con CTRL+F5.
   Su telefono usare una scheda privata al primo test.

Nessuna modifica SQL richiesta.
