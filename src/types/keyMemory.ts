export const KEY_MEMORY_CATEGORIES = [
  'conversation_memory',
  'user_preference',
  'important_person',
  'important_place',
  'important_project',
  'long_term_goal',
  'conversation_summary',
  'key_event',
  'lifeform_belief',
  'other',
] as const

export type KeyMemoryCategory =
  (typeof KEY_MEMORY_CATEGORIES)[number]

export const KEY_MEMORY_STATUSES = [
  'active',
  'temporary',
  'superseded',
  'archived',
] as const

export type KeyMemoryStatus =
  (typeof KEY_MEMORY_STATUSES)[number]

export type KeyMemorySource =
  | 'auto'
  | 'manual'
  | 'curiosity'

export const KEY_MEMORY_CONFIDENCE_LEVELS = [
  'high',
  'medium',
  'tentative',
] as const

export type KeyMemoryConfidence =
  (typeof KEY_MEMORY_CONFIDENCE_LEVELS)[number]

export type KeyMemory = {
  id: string
  user_id: string
  lifeform_id: string
  category: KeyMemoryCategory
  content: string
  importance: number
  status: KeyMemoryStatus
  status_reason: string
  superseded_by_id: string | null
  source: KeyMemorySource
  confidence: KeyMemoryConfidence
  created_at: string
  updated_at: string
  last_confirmed_at: string | null
  archived_at: string | null
}

export type KeyMemoryInput = {
  category: KeyMemoryCategory
  content: string
  importance: number
}

export type KeyMemoryCandidate = {
  action: 'create' | 'update'
  memoryId: string | null
  category: KeyMemoryCategory
  content: string
  importance: number
  reason: string
}
