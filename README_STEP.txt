DIGITAL LIFEFORM — PNG EMOTION VARIANTS

Questa versione rimuove completamente l'esperimento MP4 e torna a usare solo PNG.

Nuovo comportamento:
- niente video;
- le emozioni con più PNG ciclano automaticamente ogni 3 secondi;
- il lieve zoom/bounce già presente resta attivo;
- engaged e thinking scelgono una variante contestuale in base ai livelli emotivi.

Cicli automatici:
- curious_1.png -> curious_2.png -> curious_3.png
- happy_1.png -> happy_2.png
- sad_1.png -> sad_2.png
- horny_1.png -> horny_2.png -> horny_3.png -> horny_4.png

Varianti contestuali:
- engaged_concerned.png se concerned > 70;
- engaged_happy.png se happy > 70;
- se concerned e happy sono entrambe > 70, vince quella con valore maggiore;
- altrimenti engaged_neutral.png.

- thinking.angry.png se angry > 70;
- thinking.happy.png se happy > 70;
- se angry e happy sono entrambe > 70, vince quella con valore maggiore;
- altrimenti thinking.neutral.png.

File previsti in:
public\sprites\emotions

Elenco supportato:
afraid.png
angry.png
concerned.png
curious_1.png
curious_2.png
curious_3.png
dormant.png
engaged_concerned.png
engaged_happy.png
engaged_neutral.png
happy_1.png
happy_2.png
horny_1.png
horny_2.png
horny_3.png
horny_4.png
irritated.png
neutral.png
reflective.png
sad_1.png
sad_2.png
thinking.angry.png
thinking.happy.png
thinking.neutral.png
tired.png
wary.png

Nota:
neutral.nosfondo.png resta usata per la schermata di login.

Installazione:
1. Estrarre nella root:
   C:\Projects\lifeform-web

2. Sovrascrivere:
   src\components\LifeformSprite.tsx
   src\components\LifeformChat.tsx
   src\components\IvoryGlassTheme.css

3. Eseguire:
   npm run build
   npm run dev

4. Aggiornare con CTRL+F5.
   Sul telefono usare una scheda privata al primo test.

Nessuna modifica SQL richiesta.
