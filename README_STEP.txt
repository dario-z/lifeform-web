Correzione input soglia token giornaliera

Il problema era la combinazione HTML:
min="1000" + step="10000"

Con questa combinazione il browser accettava soltanto:
1000, 11000, 21000, ... 91000, 101000, ...
Per questo 100000 risultava non valido.

La correzione usa step="1000" sia nella schermata Connetti Lili sia nel pannello Emozioni.

Copia src nella root C:\Projects\lifeform-web e conferma la sovrascrittura.
Poi esegui:
npm run build
npm run dev
