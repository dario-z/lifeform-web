DIGITAL LIFEFORM — KEY MEMORIES (MAX 10)

Nuovo sistema:
- Tabella Supabase dedicata alle Key Memories.
- Massimo 10 memorie per Lifeform, protetto anche dal database.
- Tutte le memorie vengono passate alla chiamata principale Gemini.
- La Lifeform può proporre una memoria autonoma durante la stessa chiamata
  già usata per la classificazione emotiva: non viene aggiunta una terza
  richiesta API.
- Memorie manuali e memorie modificate dall'utente diventano autorevoli e
  non vengono sovrascritte automaticamente.
- Le memorie automatiche simili vengono aggiornate invece di duplicate.
- A 10 memorie, una nuova memoria può sostituire solo una memoria automatica
  meno importante, con un margine minimo di 8 punti.
- "Svuota chat" non cancella le Key Memories.

Categorie supportate:
- Ricordi dalla conversazione
- Preferenze consolidate
- Persone importanti
- Luoghi importanti
- Progetti importanti
- Obiettivi a lungo termine
- Riassunti storici
- Eventi chiave
- Convinzioni della Lifeform
- Altro

INSTALLAZIONE

1. Supabase -> SQL Editor -> New query.
2. Eseguire tutto il contenuto di:
   supabase/key_memories_migration.sql
3. Estrarre lo ZIP nella root:
   C:\Projects\lifeform-web
4. Confermare la sovrascrittura di:
   src\lib\emotions.ts
   src\components\LifeformChat.tsx
5. Nuovi file:
   src\types\keyMemory.ts
   src\lib\keyMemories.ts
   src\components\KeyMemoriesPanel.tsx
   src\components\KeyMemoriesPanel.css
6. Eseguire:
   npm run build
   npm run dev
7. Aprire il menu della Lifeform e premere "Key Memories".

TEST RAPIDO

- Scrivere: "Ricorda che il progetto più importante su cui sto lavorando è
  Digital Lifeform e voglio renderlo utilizzabile soprattutto da mobile."
- Dopo la risposta, aprire Key Memories.
- La memoria può comparire automaticamente come Progetto importante.
- Modificarla manualmente e salvarla: la sorgente diventa Manuale.
- Aggiornare la pagina e verificare che la memoria rimanga.
- Inviare un messaggio dopo oltre 24 messaggi recenti: la memoria continua a
  essere inclusa nel contesto principale.
