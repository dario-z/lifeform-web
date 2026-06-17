EMOTIONAL POINT BUDGET UPDATE

Budget totale configurato: 240 punti.

Funzionamento:
- ogni emozione resta compresa tra 0 e 100;
- il totale di tutte le emozioni non può superare 240;
- finché esiste spazio libero, un parametro può crescere normalmente;
- quando il pool è pieno, ogni punto guadagnato da una emozione viene sottratto proporzionalmente dalle altre;
- i segnali più forti vengono applicati per ultimi, quindi hanno priorità nel riequilibrio;
- i vecchi dati già sopra il limite vengono ridimensionati automaticamente;
- il pannello Emozioni mostra il totale corrente, ad esempio 186 / 240.

Installazione:
1. Estrarre lo ZIP dentro C:\Projects\lifeform-web
2. Confermare la sovrascrittura dei tre file.
3. Eseguire npm run build
4. Eseguire npm run dev

Non serve alcuna migrazione Supabase.
