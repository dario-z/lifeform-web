export type PersistentActionEntity =
  | 'thread'
  | 'goal'
  | 'belief'
  | 'memory'

export type PersistentActionOperation =
  | 'created'
  | 'updated'
  | 'saved'
  | 'archived'

export type PersistentActionReceiptStatus =
  | 'pending'
  | 'succeeded'
  | 'failed'

type ReceiptLabels = {
  thread: string
  goal: string
  belief: string
  memory: string
  created: string
  updated: string
  saved: string
  archived: string
  pendingHeading: string
  successHeading: string
  failedHeading: string
  pendingBody: string
  successBody: string
  failedBody: string
}

const RECEIPT_LABELS: Record<
  string,
  ReceiptLabels
> = {
  it: {
    thread: 'Thread',
    goal: 'Goal',
    belief: 'Belief',
    memory: 'Key Memory',
    created: 'creato',
    updated: 'aggiornato',
    saved: 'salvato',
    archived: 'archiviato',
    pendingHeading:
      'Stato azione: in elaborazione.',
    successHeading:
      'Azione verificata.',
    failedHeading:
      'Azione non eseguita.',
    pendingBody:
      'La richiesta ? stata ricevuta. Attendo una conferma effettiva dal database prima di considerarla completata.',
    successBody:
      'Il database ha confermato questa operazione.',
    failedBody:
      'Il sistema non ha confermato questa operazione. Non considero la richiesta completata.',
  },

  en: {
    thread: 'Thread',
    goal: 'Goal',
    belief: 'Belief',
    memory: 'Key Memory',
    created: 'created',
    updated: 'updated',
    saved: 'saved',
    archived: 'archived',
    pendingHeading:
      'Action status: processing.',
    successHeading:
      'Action verified.',
    failedHeading:
      'Action not completed.',
    pendingBody:
      'The request was received. I am waiting for a real database confirmation before treating it as complete.',
    successBody:
      'The database confirmed this operation.',
    failedBody:
      'The system did not confirm this operation. I do not consider the request complete.',
  },

  fr: {
    thread: 'Thread',
    goal: 'Objectif',
    belief: 'Croyance',
    memory: 'M?moire cl?',
    created: 'cr??',
    updated: 'mis ? jour',
    saved: 'enregistr?',
    archived: 'archiv?',
    pendingHeading:
      'Statut de l?action : en cours.',
    successHeading:
      'Action v?rifi?e.',
    failedHeading:
      'Action non ex?cut?e.',
    pendingBody:
      'La demande a ?t? re?ue. J?attends une confirmation r?elle de la base de donn?es avant de la consid?rer termin?e.',
    successBody:
      'La base de donn?es a confirm? cette op?ration.',
    failedBody:
      'Le syst?me n?a pas confirm? cette op?ration. Je ne consid?re pas la demande comme termin?e.',
  },

  de: {
    thread: 'Thread',
    goal: 'Ziel',
    belief: '?berzeugung',
    memory: 'Schl?sselerinnerung',
    created: 'erstellt',
    updated: 'aktualisiert',
    saved: 'gespeichert',
    archived: 'archiviert',
    pendingHeading:
      'Aktionsstatus: wird verarbeitet.',
    successHeading:
      'Aktion verifiziert.',
    failedHeading:
      'Aktion nicht ausgef?hrt.',
    pendingBody:
      'Die Anfrage wurde empfangen. Ich warte auf eine echte Datenbankbest?tigung, bevor ich sie als abgeschlossen behandle.',
    successBody:
      'Die Datenbank hat diese Aktion best?tigt.',
    failedBody:
      'Das System hat diese Aktion nicht best?tigt. Ich behandle die Anfrage nicht als abgeschlossen.',
  },

  es: {
    thread: 'Thread',
    goal: 'Objetivo',
    belief: 'Creencia',
    memory: 'Memoria clave',
    created: 'creado',
    updated: 'actualizado',
    saved: 'guardado',
    archived: 'archivado',
    pendingHeading:
      'Estado de la acci?n: procesando.',
    successHeading:
      'Acci?n verificada.',
    failedHeading:
      'Acci?n no completada.',
    pendingBody:
      'La solicitud fue recibida. Espero una confirmaci?n real de la base de datos antes de considerarla completada.',
    successBody:
      'La base de datos confirm? esta operaci?n.',
    failedBody:
      'El sistema no confirm? esta operaci?n. No considero la solicitud completada.',
  },
}

function getLabels(
  language: string,
): ReceiptLabels {
  const normalizedLanguage =
    language.toLocaleLowerCase().trim()

  return (
    RECEIPT_LABELS[normalizedLanguage] ??
    RECEIPT_LABELS.en
  )
}

export function buildPersistentActionReceipt(
  input: {
    language: string
    entity: PersistentActionEntity
    operation: PersistentActionOperation
    status: PersistentActionReceiptStatus
  },
): string {
  const labels = getLabels(
    input.language,
  )

  if (input.status === 'pending') {
    return [
      labels.pendingHeading,
      labels.pendingBody,
    ].join('\n\n')
  }

  if (input.status === 'failed') {
    return [
      labels.failedHeading,
      labels.failedBody,
    ].join('\n\n')
  }

  return [
    labels.successHeading,
    labels[input.entity] +
      ' ' +
      labels[input.operation] +
      '.',
    labels.successBody,
  ].join('\n\n')
}
