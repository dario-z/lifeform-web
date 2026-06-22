import type {
  LifeformBelief,
  LifeformGoal,
} from '../types/lifeformIdentity'

export const MAX_ACTIVE_GOALS = 3
export const MAX_ACTIVE_BELIEFS = 10

type IdentityItem = {
  content: string
}

export function normalizeIdentityContent(
  value: string,
): string {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)
}

export function findSimilarIdentityItem<
  T extends IdentityItem,
>(
  items: T[],
  content: string,
): T | null {
  const normalized = normalizeIdentityContent(
    content,
  ).toLocaleLowerCase()

  if (!normalized) {
    return null
  }

  return (
    items.find(
      (item) =>
        normalizeIdentityContent(
          item.content,
        ).toLocaleLowerCase() === normalized,
    ) ?? null
  )
}

const goalRank: Record<
  LifeformGoal['status'],
  number
> = {
  active: 0,
  paused: 1,
  completed: 2,
  archived: 3,
}

export function sortGoals(
  goals: LifeformGoal[],
): LifeformGoal[] {
  return [...goals].sort((left, right) => {
    const statusDifference =
      goalRank[left.status] -
      goalRank[right.status]

    if (statusDifference !== 0) {
      return statusDifference
    }

    const importanceDifference =
      right.importance - left.importance

    if (importanceDifference !== 0) {
      return importanceDifference
    }

    return new Date(
      right.updated_at,
    ).getTime() - new Date(
      left.updated_at,
    ).getTime()
  })
}

export function sortBeliefs(
  beliefs: LifeformBelief[],
): LifeformBelief[] {
  return [...beliefs].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === 'active' ? -1 : 1
    }

    const importanceDifference =
      right.importance - left.importance

    if (importanceDifference !== 0) {
      return importanceDifference
    }

    return new Date(
      right.updated_at,
    ).getTime() - new Date(
      left.updated_at,
    ).getTime()
  })
}

export function buildGoalsContext(
  goals: LifeformGoal[],
): string {
  const active = sortGoals(goals)
    .filter((goal) => goal.status === 'active')
    .slice(0, MAX_ACTIVE_GOALS)

  return active.length === 0
    ? 'Active Goals:\nNo active goals are saved.'
    : [
        'Active Goals:',
        ...active.map(
          (goal, index) =>
            String(index + 1) +
            '. ' +
            goal.content,
        ),
        'Goals are durable directions, not a task list.',
      ].join('\n')
}

export function buildBeliefsContext(
  beliefs: LifeformBelief[],
): string {
  const active = sortBeliefs(beliefs)
    .filter(
      (belief) => belief.status === 'active',
    )
    .slice(0, MAX_ACTIVE_BELIEFS)

  return active.length === 0
    ? 'Active Beliefs:\nNo active beliefs are saved.'
    : [
        'Active Beliefs:',
        ...active.map(
          (belief, index) =>
            String(index + 1) +
            '. ' +
            belief.content,
        ),
        'Beliefs are tentative perspectives, not objective truth.',
      ].join('\n')
}
