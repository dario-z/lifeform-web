import type {
  LifeformGoal,
} from '../types/lifeformIdentity'
import type {
  LifeformThread,
} from '../types/lifeformThread'

export const MAX_ACTIVE_THREADS = 5

export function normalizeThreadText(
  value: string,
  maximumLength: number,
): string {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maximumLength)
}

function normalizeComparisonText(
  value: string,
): string {
  return normalizeThreadText(
    value,
    200,
  )
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const threadRank: Record<
  LifeformThread['status'],
  number
> = {
  active: 0,
  paused: 1,
  resolved: 2,
  abandoned: 3,
  archived: 4,
}

export function sortThreads(
  threads: LifeformThread[],
): LifeformThread[] {
  return [...threads].sort(
    (left, right) => {
      const statusDifference =
        threadRank[left.status] -
        threadRank[right.status]

      if (statusDifference !== 0) {
        return statusDifference
      }

      return (
        new Date(
          right.last_activity_at ||
            right.updated_at,
        ).getTime() -
        new Date(
          left.last_activity_at ||
            left.updated_at,
        ).getTime()
      )
    },
  )
}

export function findSimilarThread(
  threads: LifeformThread[],
  title: string,
): LifeformThread | null {
  const normalizedTitle =
    normalizeComparisonText(title)

  if (!normalizedTitle) {
    return null
  }

  return (
    threads.find((thread) => {
      if (thread.status !== 'active') {
        return false
      }

      const currentTitle =
        normalizeComparisonText(
          thread.title,
        )

      return (
        currentTitle === normalizedTitle ||
        currentTitle.includes(
          normalizedTitle,
        ) ||
        normalizedTitle.includes(
          currentTitle,
        )
      )
    }) ?? null
  )
}

export function getThreadGoalLabel(
  thread: LifeformThread,
  goals: LifeformGoal[],
): string | null {
  if (!thread.linked_goal_id) {
    return null
  }

  return (
    goals.find(
      (goal) =>
        goal.id === thread.linked_goal_id,
    )?.content ?? null
  )
}

export function buildThreadsContext(
  threads: LifeformThread[],
  goals: LifeformGoal[],
): string {
  const activeThreads = sortThreads(
    threads.filter(
      (thread) => thread.status === 'active',
    ),
  )

  if (activeThreads.length === 0) {
    return [
      'Active Threads: none.',
      'Threads are optional ongoing work contexts, distinct from Goals and never a task list.',
    ].join('\n')
  }

  const entries = activeThreads.map(
    (thread) => {
      const linkedGoal = getThreadGoalLabel(
        thread,
        goals,
      )

      return [
        '- Thread: ' + thread.title,
        '  Current context: ' +
          thread.current_context,
        '  Last meaningful progress: ' +
          thread.last_progress,
        '  Open direction: ' +
          thread.open_direction,
        ...(linkedGoal
          ? [
              '  Linked Goal: ' +
                linkedGoal,
            ]
          : []),
      ].join('\n')
    },
  )

  return [
    'Active Threads are ongoing work contexts. They are not Goals, commitments, deadlines or task lists.',
    ...entries,
  ].join('\n')
}
