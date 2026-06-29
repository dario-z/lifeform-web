import type {
  KeyMemory,
} from '../types/keyMemory'
import type {
  LifeformBelief,
  LifeformGoal,
} from '../types/lifeformIdentity'

type PersistentRecord = {
  content: string
  importance: number
  confidence:
    | 'high'
    | 'medium'
    | 'tentative'
  last_confirmed_at: string | null
}

function getKeyMemoryOrigin(
  source: KeyMemory['source'],
): string {
  return source === 'manual'
    ? 'user-confirmed'
    : 'lifeform inference'
}

function getIdentityOrigin(
  source:
    | LifeformGoal['source']
    | LifeformBelief['source'],
): string {
  if (source === 'manual') {
    return 'user-confirmed'
  }

  if (source === 'proposal') {
    return 'lifeform proposal'
  }

  return 'migrated record'
}

function getConfirmationLabel(
  value: string | null,
): string {
  return value
    ? 'last confirmed: ' + value
    : 'not directly confirmed'
}

function formatRecord(
  kind: string,
  record: PersistentRecord,
  origin: string,
): string {
  return [
    '- ' + kind + ': ' + record.content,
    '  origin: ' + origin,
    '  confidence: ' + record.confidence,
    '  ' + getConfirmationLabel(
      record.last_confirmed_at,
    ),
    '  importance: ' +
      String(record.importance) +
      '%',
  ].join('\n')
}

export function buildIdentityConfidenceContext({
  keyMemories,
  goals,
  beliefs,
}: {
  keyMemories: KeyMemory[]
  goals: LifeformGoal[]
  beliefs: LifeformBelief[]
}): string {
  const currentMemories = [
    ...keyMemories,
  ]
    .filter(
      (memory) =>
        memory.status === 'active' ||
        memory.status === 'temporary',
    )
    .sort(
      (left, right) =>
        right.importance -
        left.importance,
    )
    .slice(0, 10)

  const activeGoals = [
    ...goals,
  ]
    .filter(
      (goal) => goal.status === 'active',
    )
    .sort(
      (left, right) =>
        right.importance -
        left.importance,
    )
    .slice(0, 8)

  const activeBeliefs = [
    ...beliefs,
  ]
    .filter(
      (belief) =>
        belief.status === 'active',
    )
    .sort(
      (left, right) =>
        right.importance -
        left.importance,
    )
    .slice(0, 8)

  const entries = [
    ...currentMemories.map((memory) =>
      formatRecord(
        'Key Memory',
        memory,
        getKeyMemoryOrigin(memory.source),
      ),
    ),
    ...activeGoals.map((goal) =>
      formatRecord(
        'Goal',
        goal,
        getIdentityOrigin(goal.source),
      ),
    ),
    ...activeBeliefs.map((belief) =>
      formatRecord(
        'Belief',
        belief,
        getIdentityOrigin(belief.source),
      ),
    ),
  ]

  return [
    'Persistent context reliability protocol:',
    '- high: treat as reliable saved context. You may use it naturally, but the latest explicit user statement always overrides it.',
    '- medium: use as working context, but do not present it as a directly confirmed fact unless the user confirms it in the current conversation.',
    '- tentative: treat only as a hypothesis or unverified context. Do not make strong claims about the user, make consequential decisions from it, or state it as certain. When it matters, ask naturally for confirmation.',
    '- A lifeform belief is never objective truth, regardless of confidence.',
    '- Mention origin, confidence or confirmation date only when the user asks how you know something, asks to verify it, or that distinction is important to the answer.',
    '',
    'Current persistent records with reliability:',
    ...(entries.length > 0
      ? entries
      : ['- No current Key Memories, Goals or Beliefs.']),
  ].join('\n')
}
