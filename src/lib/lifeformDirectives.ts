export type LifeformDirectiveEntity =
  | 'memory'
  | 'goal'
  | 'belief'
  | 'thread'

export type LifeformDirectiveOperation =
  | 'create'
  | 'archive'

export type LifeformDirectCommand = {
  entity: LifeformDirectiveEntity
  operation: LifeformDirectiveOperation
  refersToLatest: boolean
}

function normalizeDirectiveText(
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

const THREAD_PATTERNS = [
  /\bthread\b/,
  /\bthreads\b/,
  /\bfilone\b/,
  /\bfiloni\b/,
  /\bcontesto attivo\b/,
  /\bcontesti attivi\b/,
  /\bprogetto attivo\b/,
  /\bprogetti attivi\b/,
  /\bongoing project\b/,
  /\bongoing thread\b/,
  /\bworkstream\b/,
  /\bwork stream\b/,
  /\bfil de travail\b/,
  /\bfils de travail\b/,
  /\bcontexte actif\b/,
  /\bcontextes actifs\b/,
  /\bhilo activo\b/,
  /\bhilos activos\b/,
  /\bproyecto activo\b/,
  /\bproyectos activos\b/,
  /\barbeitsstrang\b/,
  /\barbeitsstrange\b/,
  /\baktiver kontext\b/,
  /\baktive kontexte\b/,
] as const

const BELIEF_PATTERNS = [
  /\bbelief\b/,
  /\bbeliefs\b/,
  /\bconvinzione\b/,
  /\bconvinzioni\b/,
  /\bcredenza\b/,
  /\bcredenze\b/,
  /\bprincipio\b/,
  /\bprincipi\b/,
  /\bconviction\b/,
  /\bconvictions\b/,
  /\bcroyance\b/,
  /\bcroyances\b/,
  /\bconviction\b/,
  /\bconvictions\b/,
  /\bprincipe\b/,
  /\bprincipes\b/,
  /\buberzeugung\b/,
  /\buberzeugungen\b/,
  /\bglaubenssatz\b/,
  /\bglaubenssatze\b/,
  /\bansicht\b/,
  /\bansichten\b/,
  /\bcreencia\b/,
  /\bcreencias\b/,
  /\bconviccion\b/,
  /\bconvicciones\b/,
] as const

const GOAL_PATTERNS = [
  /\bgoal\b/,
  /\bgoals\b/,
  /\bobiettivo\b/,
  /\bobiettivi\b/,
  /\bobbiettivo\b/,
  /\bobbiettivi\b/,
  /\bmeta\b/,
  /\bmetas\b/,
  /\bobjective\b/,
  /\bobjectives\b/,
  /\bobjectif\b/,
  /\bobjectifs\b/,
  /\bbut\b/,
  /\bbuts\b/,
  /\bziel\b/,
  /\bziele\b/,
  /\bvorhaben\b/,
  /\bvorhabens\b/,
  /\bobjetivo\b/,
  /\bobjetivos\b/,
] as const

const MEMORY_PATTERNS = [
  /\bkey memory\b/,
  /\bkey memories\b/,
  /\bmemory\b/,
  /\bmemories\b/,
  /\bmemoria chiave\b/,
  /\bmemorie chiave\b/,
  /\bmemoria\b/,
  /\bmemorie\b/,
  /\bricordo\b/,
  /\bricordi\b/,
  /\bmemoire\b/,
  /\bmemoires\b/,
  /\bsouvenir\b/,
  /\bsouvenirs\b/,
  /\berinnerung\b/,
  /\berinnerungen\b/,
  /\bgedachtnisnotiz\b/,
  /\bgedachtnisnotizen\b/,
  /\bmemoria clave\b/,
  /\bmemorias clave\b/,
  /\brecuerdo\b/,
  /\brecuerdos\b/,
] as const

const CREATE_PATTERNS = [
  /\bcrea\b/,
  /\bcreare\b/,
  /\bcreami\b/,
  /\bcreiamo\b/,
  /\baggiungi\b/,
  /\baggiungere\b/,
  /\binserisci\b/,
  /\binserire\b/,
  /\bregistra\b/,
  /\bregistrare\b/,
  /\bsalva\b/,
  /\bsalvare\b/,

  /\bcreate\b/,
  /\bmake\b/,
  /\badd\b/,
  /\binsert\b/,
  /\bregister\b/,
  /\bsave\b/,

  /\bcree\b/,
  /\bcreer\b/,
  /\bcreez\b/,
  /\bajoute\b/,
  /\bajouter\b/,
  /\bajoutez\b/,
  /\binsere\b/,
  /\binserer\b/,
  /\benregistre\b/,
  /\benregistrer\b/,
  /\bsauvegarde\b/,
  /\bsauvegarder\b/,

  /\berstelle\b/,
  /\berstellen\b/,
  /\berstellt\b/,
  /\bfuge\b/,
  /\bfugen\b/,
  /\blege\b.*\ban\b/,
  /\bspeichere\b/,
  /\bspeichern\b/,
  /\bregistriere\b/,
  /\bregistrieren\b/,

  /\bcrea\b/,
  /\bcrear\b/,
  /\bcreame\b/,
  /\banade\b/,
  /\banadir\b/,
  /\bagrega\b/,
  /\bagregar\b/,
  /\binserta\b/,
  /\binsertar\b/,
  /\bregistra\b/,
  /\bregistrar\b/,
  /\bguarda\b/,
  /\bguardar\b/,
] as const

const ARCHIVE_PATTERNS = [
  /\belimina\b/,
  /\beliminare\b/,
  /\brimuovi\b/,
  /\brimuovere\b/,
  /\bcancella\b/,
  /\bcancellare\b/,
  /\barchivia\b/,
  /\barchiviare\b/,
  /\bscarta\b/,
  /\bscartare\b/,
  /\btogli\b/,
  /\btogliere\b/,

  /\bdelete\b/,
  /\bremove\b/,
  /\barchive\b/,
  /\bdiscard\b/,

  /\bsupprime\b/,
  /\bsupprimer\b/,
  /\bretire\b/,
  /\bretirer\b/,
  /\barchive\b/,
  /\barchiver\b/,
  /\bjette\b/,
  /\bjeter\b/,

  /\blosche\b/,
  /\bloschen\b/,
  /\bentferne\b/,
  /\bentfernen\b/,
  /\barchiviere\b/,
  /\barchivieren\b/,
  /\bverwerfe\b/,
  /\bverwerfen\b/,

  /\belimina\b/,
  /\beliminar\b/,
  /\bborra\b/,
  /\bborrar\b/,
  /\bquita\b/,
  /\bquitar\b/,
  /\barchiva\b/,
  /\barchivar\b/,
  /\bdescarta\b/,
  /\bdescartar\b/,
] as const

const LATEST_PATTERNS = [
  /\bappena creat[oa]\b/,
  /\bappena aggiunt[oa]\b/,
  /\bl['?]ultimo\b/,
  /\bl['?]ultima\b/,
  /\bl['?]ultimi\b/,
  /\bl['?]ultime\b/,
  /\bultimo\b/,
  /\bultima\b/,
  /\bprecedente\b/,
  /\bprecedenti\b/,

  /\bjust created\b/,
  /\bjust added\b/,
  /\bthe latest\b/,
  /\bthe last\b/,
  /\blatest\b/,
  /\blast\b/,
  /\bprevious\b/,
  /\bthat one\b/,

  /\bque tu viens de creer\b/,
  /\bque tu viens d['?]ajouter\b/,
  /\ble dernier\b/,
  /\bla derniere\b/,
  /\bles derniers\b/,
  /\bles dernieres\b/,
  /\bprecedent\b/,
  /\bprecedente\b/,

  /\bgerade erstellt\b/,
  /\bgerade hinzugefugt\b/,
  /\bzuletzt erstellt\b/,
  /\bzuletzt hinzugefugt\b/,
  /\bder letzte\b/,
  /\bdie letzte\b/,
  /\bdas letzte\b/,
  /\bvorherige\b/,
  /\bvorherigen\b/,

  /\brecien cread[oa]\b/,
  /\brecien anadid[oa]\b/,
  /\bel ultimo\b/,
  /\bla ultima\b/,
  /\blos ultimos\b/,
  /\blas ultimas\b/,
  /\banterior\b/,
  /\banteriores\b/,
] as const

function detectEntity(
  text: string,
): LifeformDirectiveEntity | null {
  const matches = [
    {
      entity: 'thread' as const,
      found: matchesAny(
        text,
        THREAD_PATTERNS,
      ),
    },
    {
      entity: 'belief' as const,
      found: matchesAny(
        text,
        BELIEF_PATTERNS,
      ),
    },
    {
      entity: 'goal' as const,
      found: matchesAny(
        text,
        GOAL_PATTERNS,
      ),
    },
    {
      entity: 'memory' as const,
      found: matchesAny(
        text,
        MEMORY_PATTERNS,
      ),
    },
  ].filter((candidate) => candidate.found)

  return matches.length === 1
    ? matches[0].entity
    : null
}

export function detectLifeformDirectCommand(
  message: string,
): LifeformDirectCommand | null {
  const text = normalizeDirectiveText(message)

  if (!text) {
    return null
  }

  const entity = detectEntity(text)

  if (!entity) {
    return null
  }

  const archiveRequested = matchesAny(
    text,
    ARCHIVE_PATTERNS,
  )

  const createRequested = matchesAny(
    text,
    CREATE_PATTERNS,
  )

  const refersToLatest = matchesAny(
    text,
    LATEST_PATTERNS,
  )

  if (archiveRequested) {
    return {
      entity,
      operation: 'archive',
      refersToLatest,
    }
  }

  if (createRequested) {
    return {
      entity,
      operation: 'create',
      refersToLatest: false,
    }
  }

  return null
}

export function getDirectiveEntityLabel(
  entity: LifeformDirectiveEntity,
): string {
  if (entity === 'thread') {
    return 'Thread'
  }

  if (entity === 'belief') {
    return 'Belief'
  }

  if (entity === 'goal') {
    return 'Goal'
  }

  return 'Key Memory'
}
