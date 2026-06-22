import type {
  KeyMemoryCategory,
  KeyMemoryCandidate,
  KeyMemoryInput,
} from './keyMemory'

export const LIFEFORM_PROPOSAL_KINDS = [
  'memory',
  'goal',
  'belief',
] as const

export type LifeformProposalKind =
  (typeof LIFEFORM_PROPOSAL_KINDS)[number]

export const LIFEFORM_PROPOSAL_STATUSES = [
  'pending',
  'accepted',
  'dismissed',
] as const

export type LifeformProposalStatus =
  (typeof LIFEFORM_PROPOSAL_STATUSES)[number]

export type LifeformProposal = {
  id: string
  user_id: string
  lifeform_id: string
  kind: LifeformProposalKind
  status: LifeformProposalStatus
  action: 'create' | 'update'
  target_memory_id: string | null
  category: KeyMemoryCategory
  content: string
  importance: number
  reason: string
  created_at: string
  decided_at: string | null
}

export type LifeformProposalInsert = Pick<
  LifeformProposal,
  | 'user_id'
  | 'lifeform_id'
  | 'kind'
  | 'status'
  | 'action'
  | 'target_memory_id'
  | 'category'
  | 'content'
  | 'importance'
  | 'reason'
>

export function getProposalKind(
  category: KeyMemoryCategory,
): LifeformProposalKind {
  if (category === 'long_term_goal') {
    return 'goal'
  }

  if (category === 'lifeform_belief') {
    return 'belief'
  }

  return 'memory'
}

export function getProposalHeading(
  kind: LifeformProposalKind,
): string {
  if (kind === 'goal') {
    return 'Possible goal'
  }

  if (kind === 'belief') {
    return 'Possible belief'
  }

  return 'Possible memory'
}

export function isProposalWorthyCandidate(
  candidate: KeyMemoryCandidate,
): boolean {
  if (candidate.importance < 70) {
    return false
  }

  if (
    candidate.content.trim().length < 14
  ) {
    return false
  }

  return ![
    'conversation_memory',
    'conversation_summary',
    'other',
  ].includes(candidate.category)
}

export function proposalToKeyMemoryInput(
  proposal: LifeformProposal,
): KeyMemoryInput {
  return {
    category: proposal.category,
    content: proposal.content,
    importance: proposal.importance,
  }
}
