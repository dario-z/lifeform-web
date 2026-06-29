export const LIFEFORM_GOAL_STATUSES = [
  'active',
  'paused',
  'blocked',
  'completed',
  'abandoned',
  'archived',
] as const

export type LifeformGoalStatus =
  (typeof LIFEFORM_GOAL_STATUSES)[number]

export const LIFEFORM_BELIEF_STATUSES = [
  'active',
  'superseded',
  'retracted',
  'archived',
] as const

export type LifeformBeliefStatus =
  (typeof LIFEFORM_BELIEF_STATUSES)[number]

export type LifeformGoal = {
  id: string
  user_id: string
  lifeform_id: string
  content: string
  importance: number
  progress: number
  next_step: string
  blocked_reason: string
  status: LifeformGoalStatus
  status_reason: string
  source: 'proposal' | 'manual' | 'migrated'
  created_at: string
  updated_at: string
  completed_at: string | null
  archived_at: string | null
}

export type LifeformBelief = {
  id: string
  user_id: string
  lifeform_id: string
  content: string
  importance: number
  status: LifeformBeliefStatus
  status_reason: string
  source: 'proposal' | 'manual' | 'migrated'
  created_at: string
  updated_at: string
  last_confirmed_at: string | null
  superseded_by_id: string | null
  archived_at: string | null
}
