import {
  KEY_MEMORY_CATEGORIES,
  type KeyMemory,
  type KeyMemoryCandidate,
  type KeyMemoryCategory,
  type KeyMemoryInput,
} from '../types/keyMemory'

export const MAX_KEY_MEMORIES = 10
export const MAX_KEY_MEMORY_LENGTH = 500
export const AUTO_MEMORY_REPLACEMENT_MARGIN = 8

export const KEY_MEMORY_CATEGORY_LABELS:
  Record<KeyMemoryCategory, string> = {
    conversation_memory:
      'Conversation memory',
    user_preference:
      'User preference',
    important_person:
      'Important person',
    important_place:
      'Important place',
    important_project:
      'Important project',
    long_term_goal:
      'Long-term goal',
    conversation_summary:
      'Conversation summary',
    key_event:
      'Key event',
    lifeform_belief:
      'Lifeform belief',
    other:
      'Other',
  }

type RawKeyMemoryCandidate = {
  action?: unknown
  memoryId?: unknown
  category?: unknown
  content?: unknown
  importance?: unknown
  reason?: unknown
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value),
  )
}

export function isKeyMemoryCategory(
  value: unknown,
): value is KeyMemoryCategory {
  return (
    typeof value === 'string' &&
    KEY_MEMORY_CATEGORIES.includes(
      value as KeyMemoryCategory,
    )
  )
}

export function normalizeKeyMemoryContent(
  value: unknown,
): string {
  if (typeof value !== 'string') {
    return ''
  }

  return value
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_KEY_MEMORY_LENGTH)
}

export function normalizeKeyMemoryImportance(
  value: unknown,
): number {
  const numericValue =
    typeof value === 'number'
      ? value
      : Number(value)

  if (!Number.isFinite(numericValue)) {
    return 50
  }

  return clamp(
    Math.round(numericValue),
    0,
    100,
  )
}

export function normalizeKeyMemoryInput(
  input: KeyMemoryInput,
): KeyMemoryInput {
  return {
    category:
      isKeyMemoryCategory(input.category)
        ? input.category
        : 'other',
    content:
      normalizeKeyMemoryContent(
        input.content,
      ),
    importance:
      normalizeKeyMemoryImportance(
        input.importance,
      ),
  }
}

export function normalizeKeyMemoryCandidate(
  value: unknown,
  existingMemories: KeyMemory[],
): KeyMemoryCandidate | null {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return null
  }

  const raw =
    value as RawKeyMemoryCandidate

  if (
    raw.action !== 'create' &&
    raw.action !== 'update'
  ) {
    return null
  }

  if (!isKeyMemoryCategory(raw.category)) {
    return null
  }

  const content =
    normalizeKeyMemoryContent(raw.content)

  if (content.length < 8) {
    return null
  }

  const reason =
    normalizeKeyMemoryContent(
      raw.reason,
    ).slice(0, 240)

  if (raw.action === 'update') {
    const memoryId =
      typeof raw.memoryId === 'string'
        ? raw.memoryId
        : ''

    const existingMemory =
      existingMemories.find(
        (memory) =>
          memory.id === memoryId,
      )

    if (
      !existingMemory ||
      existingMemory.source !== 'auto'
    ) {
      return null
    }

    return {
      action: 'update',
      memoryId,
      category: raw.category,
      content,
      importance:
        normalizeKeyMemoryImportance(
          raw.importance,
        ),
      reason,
    }
  }

  return {
    action: 'create',
    memoryId: null,
    category: raw.category,
    content,
    importance:
      normalizeKeyMemoryImportance(
        raw.importance,
      ),
    reason,
  }
}

function normalizeComparableText(
  value: string,
): string[] {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2)
}

function getJaccardSimilarity(
  left: string[],
  right: string[],
): number {
  const leftSet = new Set(left)
  const rightSet = new Set(right)

  if (
    leftSet.size === 0 ||
    rightSet.size === 0
  ) {
    return 0
  }

  let intersection = 0

  for (const word of leftSet) {
    if (rightSet.has(word)) {
      intersection += 1
    }
  }

  const union =
    leftSet.size +
    rightSet.size -
    intersection

  return union > 0
    ? intersection / union
    : 0
}

export function findSimilarKeyMemory(
  memories: KeyMemory[],
  content: string,
): KeyMemory | null {
  const normalizedContent =
    normalizeComparableText(content)

  let bestMatch: KeyMemory | null = null
  let bestScore = 0

  for (const memory of memories) {
    const score = getJaccardSimilarity(
      normalizedContent,
      normalizeComparableText(
        memory.content,
      ),
    )

    if (score > bestScore) {
      bestScore = score
      bestMatch = memory
    }
  }

  return bestScore >= 0.56
    ? bestMatch
    : null
}

export function buildKeyMemoriesContext(
  memories: KeyMemory[],
): string {
  if (memories.length === 0) {
    return [
      'KEY MEMORIES:',
      '- No long-term key memories are stored yet.',
      '- Do not invent memories that are not present in the recent conversation.',
    ].join('\n')
  }

  const orderedMemories = [
    ...memories,
  ]
    .sort(
      (left, right) =>
        right.importance -
        left.importance,
    )
    .slice(0, MAX_KEY_MEMORIES)

  const lines = orderedMemories.map(
    (memory, index) =>
      String(index + 1) +
      '. [' +
      KEY_MEMORY_CATEGORY_LABELS[
        memory.category
      ] +
      ', importance ' +
      String(memory.importance) +
      '] ' +
      memory.content,
  )

  return [
    'KEY MEMORIES — persistent long-term context:',
    ...lines,
    'Use these memories naturally when relevant. User-edited memories are authoritative. Do not mention the memory system unless the user asks about it. Do not claim any additional long-term memory beyond this list and the recent conversation.',
  ].join('\n')
}
