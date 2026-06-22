export const LIFEFORM_GOAL_STATUSES = [
  'active',
  'paused',
  'completed',
  'archived',
] as const

export type LifeformGoalStatus =
  (typeof LIFEFORM_GOAL_STATUSES)[number]

export const LIFEFORM_BELIEF_STATUSES = [
  'active',
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
  status: LifeformGoalStatus
  source: 'proposal' | 'manual' | 'migrated'
  created_at: string
  updated_at: string
  completed_at: string | null
}

export type LifeformBelief = {
  id: string
  user_id: string
  lifeform_id: string
  content: string
  importance: number
  status: LifeformBeliefStatus
  source: 'proposal' | 'manual' | 'migrated'
  created_at: string
  updated_at: string
}
