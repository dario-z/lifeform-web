export const THREAD_STATUSES = [
  'active',
  'archived',
] as const

export type LifeformThreadStatus =
  (typeof THREAD_STATUSES)[number]

export const THREAD_PROPOSAL_ACTIONS = [
  'create',
  'update',
] as const

export type LifeformThreadProposalAction =
  (typeof THREAD_PROPOSAL_ACTIONS)[number]

export const THREAD_PROPOSAL_STATUSES = [
  'pending',
  'accepted',
  'dismissed',
] as const

export type LifeformThreadProposalStatus =
  (typeof THREAD_PROPOSAL_STATUSES)[number]

export type LifeformThreadSource =
  | 'proposal'
  | 'manual'

export type LifeformThread = {
  id: string
  user_id: string
  lifeform_id: string
  title: string
  current_context: string
  last_progress: string
  open_direction: string
  linked_goal_id: string | null
  status: LifeformThreadStatus
  source: LifeformThreadSource
  created_at: string
  updated_at: string
  last_activity_at: string
}

export type LifeformThreadProposal = {
  id: string
  user_id: string
  lifeform_id: string
  action: LifeformThreadProposalAction
  target_thread_id: string | null
  title: string
  current_context: string
  last_progress: string
  open_direction: string
  linked_goal_id: string | null
  status: LifeformThreadProposalStatus
  reason: string
  created_at: string
  decided_at: string | null
}

export type ThreadProposalCandidate = {
  action: LifeformThreadProposalAction
  targetThreadId: string | null
  title: string
  currentContext: string
  lastProgress: string
  openDirection: string
  linkedGoalId: string | null
  reason: string
}
