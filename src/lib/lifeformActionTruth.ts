function normalizeText(
  value: string,
): string {
  return value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchesAny(
  text: string,
  patterns: readonly RegExp[],
): boolean {
  return patterns.some((pattern) =>
    pattern.test(text),
  )
}

const PERSISTENT_ACTION_PATTERNS = [
  /\bcrea\b/,
  /\bcreare\b/,
  /\bcreami\b/,
  /\baggiungi\b/,
  /\baggiungere\b/,
  /\binserisci\b/,
  /\binserire\b/,
  /\bsalva\b/,
  /\bsalvare\b/,
  /\bregistra\b/,
  /\bregistrare\b/,
  /\baggiorna\b/,
  /\baggiornare\b/,
  /\bmodifica\b/,
  /\bmodificare\b/,
  /\barchivia\b/,
  /\barchiviare\b/,
  /\belimina\b/,
  /\beliminare\b/,
  /\brimuovi\b/,
  /\brimuovere\b/,
  /\bcancella\b/,
  /\bcancellare\b/,

  /\bcreate\b/,
  /\bmake\b/,
  /\badd\b/,
  /\binsert\b/,
  /\bsave\b/,
  /\bregister\b/,
  /\bupdate\b/,
  /\bedit\b/,
  /\barchive\b/,
  /\bdelete\b/,
  /\bremove\b/,

  /\bcree\b/,
  /\bcreer\b/,
  /\bajoute\b/,
  /\bajouter\b/,
  /\binsere\b/,
  /\benregistre\b/,
  /\benregistrer\b/,
  /\bsauvegarde\b/,
  /\bsauvegarder\b/,
  /\bmodifie\b/,
  /\bmodifier\b/,
  /\barchive\b/,
  /\barchiver\b/,
  /\bsupprime\b/,
  /\bsupprimer\b/,
  /\bretire\b/,
  /\bretirer\b/,

  /\berstelle\b/,
  /\berstellen\b/,
  /\bfuge\b/,
  /\bfugen\b/,
  /\bspeichere\b/,
  /\bspeichern\b/,
  /\bregistriere\b/,
  /\bregistrieren\b/,
  /\baktualisiere\b/,
  /\baktualisieren\b/,
  /\bbearbeite\b/,
  /\bbearbeiten\b/,
  /\barchiviere\b/,
  /\barchivieren\b/,
  /\blosche\b/,
  /\bloschen\b/,
  /\bentferne\b/,
  /\bentfernen\b/,

  /\bcrea\b/,
  /\bcrear\b/,
  /\bagrega\b/,
  /\bagregar\b/,
  /\banade\b/,
  /\banadir\b/,
  /\binserta\b/,
  /\binsertar\b/,
  /\bguarda\b/,
  /\bguardar\b/,
  /\bregistra\b/,
  /\bregistrar\b/,
  /\bactualiza\b/,
  /\bactualizar\b/,
  /\bmodifica\b/,
  /\bmodificar\b/,
  /\barchiva\b/,
  /\barchivar\b/,
  /\belimina\b/,
  /\beliminar\b/,
  /\bborra\b/,
  /\bborrar\b/,
  /\bquita\b/,
  /\bquitar\b/,
] as const

const PERSISTENT_ENTITY_PATTERNS = [
  /\bthread\b/,
  /\bthreads\b/,
  /\bfilone\b/,
  /\bfiloni\b/,
  /\bworkstream\b/,
  /\bwork stream\b/,
  /\bfil de travail\b/,
  /\bfils de travail\b/,
  /\barbeitsstrang\b/,
  /\barbeitsstrange\b/,
  /\bhilo activo\b/,
  /\bhilos activos\b/,

  /\bgoal\b/,
  /\bgoals\b/,
  /\bobiettivo\b/,
  /\bobiettivi\b/,
  /\bobbiettivo\b/,
  /\bobbiettivi\b/,
  /\bobjective\b/,
  /\bobjectives\b/,
  /\bobjectif\b/,
  /\bobjectifs\b/,
  /\bziel\b/,
  /\bziele\b/,
  /\bobjetivo\b/,
  /\bobjetivos\b/,

  /\bbelief\b/,
  /\bbeliefs\b/,
  /\bconvinzione\b/,
  /\bconvinzioni\b/,
  /\bcredenza\b/,
  /\bcredenze\b/,
  /\bcroyance\b/,
  /\bcroyances\b/,
  /\buberzeugung\b/,
  /\buberzeugungen\b/,
  /\bcreencia\b/,
  /\bcreencias\b/,

  /\bkey memory\b/,
  /\bkey memories\b/,
  /\bmemory\b/,
  /\bmemories\b/,
  /\bmemoria chiave\b/,
  /\bmemorie chiave\b/,
  /\bmemoria\b/,
  /\bmemorie\b/,
  /\bmemoire\b/,
  /\bmemoires\b/,
  /\bsouvenir\b/,
  /\bsouvenirs\b/,
  /\berinnerung\b/,
  /\berinnerungen\b/,
  /\bmemoria clave\b/,
  /\bmemorias clave\b/,
  /\brecuerdo\b/,
  /\brecuerdos\b/,
] as const

const LATEST_REFERENCE_PATTERNS = [
  /\bappena creat[oa]\b/,
  /\bappena aggiunt[oa]\b/,
  /\bl['?]ultimo\b/,
  /\bl['?]ultima\b/,
  /\bultimo\b/,
  /\bultima\b/,
  /\bprecedente\b/,

  /\bjust created\b/,
  /\bjust added\b/,
  /\bthe latest\b/,
  /\bthe last\b/,
  /\blatest\b/,
  /\blast\b/,
  /\bthat one\b/,

  /\bque tu viens de creer\b/,
  /\bque tu viens d['?]ajouter\b/,
  /\ble dernier\b/,
  /\bla derniere\b/,
  /\bprecedent\b/,

  /\bgerade erstellt\b/,
  /\bgerade hinzugefugt\b/,
  /\bzuletzt erstellt\b/,
  /\bder letzte\b/,
  /\bdie letzte\b/,
  /\bdas letzte\b/,

  /\brecien cread[oa]\b/,
  /\brecien anadid[oa]\b/,
  /\bel ultimo\b/,
  /\bla ultima\b/,
  /\banterior\b/,
] as const

export function requiresVerifiedPersistentReply(
  message: string,
): boolean {
  const text = normalizeText(message)

  if (!text) {
    return false
  }

  const asksForAction = matchesAny(
    text,
    PERSISTENT_ACTION_PATTERNS,
  )

  if (!asksForAction) {
    return false
  }

  return (
    matchesAny(
      text,
      PERSISTENT_ENTITY_PATTERNS,
    ) ||
    matchesAny(
      text,
      LATEST_REFERENCE_PATTERNS,
    )
  )
}

const UNVERIFIED_ACTION_REPLIES: Record<
  string,
  string
> = {
  it: [
    'Stato azione: non verificato.',
    'Ho ricevuto una richiesta di modificare il mio contesto persistente, ma non posso confermare che sia stata eseguita finch? il sistema non restituisce un esito verificato dal database.',
    'Non considerare questa azione completata finch? non esiste una conferma reale nel pannello corrispondente o nell?Activity Log.',
  ].join('\n\n'),

  en: [
    'Action status: unverified.',
    'I received a request to change persistent context, but I cannot confirm it happened until the system returns a database-verified result.',
    'Do not treat this action as completed until there is a real confirmation in the related panel or Activity Log.',
  ].join('\n\n'),

  fr: [
    'Statut de l?action : non v?rifi?.',
    'J?ai re?u une demande de modification du contexte persistant, mais je ne peux pas confirmer son ex?cution avant un r?sultat v?rifi? par la base de donn?es.',
    'Ne consid?re pas cette action comme termin?e avant une confirmation r?elle dans le panneau concern? ou dans l?Activity Log.',
  ].join('\n\n'),

  de: [
    'Aktionsstatus: nicht verifiziert.',
    'Ich habe eine Anfrage zur ?nderung des persistenten Kontexts erhalten, kann ihre Ausf?hrung aber erst nach einem durch die Datenbank verifizierten Ergebnis best?tigen.',
    'Betrachte diese Aktion erst als abgeschlossen, wenn eine echte Best?tigung im entsprechenden Panel oder im Activity Log vorliegt.',
  ].join('\n\n'),

  es: [
    'Estado de la acci?n: no verificado.',
    'He recibido una solicitud para modificar el contexto persistente, pero no puedo confirmar que se haya realizado hasta que el sistema devuelva un resultado verificado por la base de datos.',
    'No consideres esta acci?n completada hasta que exista una confirmaci?n real en el panel correspondiente o en el Activity Log.',
  ].join('\n\n'),
}

export function buildUnverifiedActionReply(
  language: string,
): string {
  const normalizedLanguage =
    language.toLocaleLowerCase().trim()

  return (
    UNVERIFIED_ACTION_REPLIES[
      normalizedLanguage
    ] ??
    UNVERIFIED_ACTION_REPLIES.en
  )
}
