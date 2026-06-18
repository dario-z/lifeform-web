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

export type KeyMemorySource =
  | 'auto'
  | 'manual'

export type KeyMemory = {
  id: string
  user_id: string
  lifeform_id: string
  category: KeyMemoryCategory
  content: string
  importance: number
  source: KeyMemorySource
  created_at: string
  updated_at: string
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
