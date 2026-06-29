import type {
  LifeformGoal,
  LifeformGoalStatus,
} from '../types/lifeformIdentity'
import {
  MAX_ACTIVE_GOALS,
  sortGoals,
} from '../lib/lifeformIdentity'
import './LifeformIdentityPanels.css'

type Props = {
  open: boolean
  goals: LifeformGoal[]
  loading: boolean
  savingGoalId: string | null
  error: string | null
  onClose: () => void
  onStatusChange: (
    goal: LifeformGoal,
    status: LifeformGoalStatus,
  ) => void
}

export function GoalsPanel({
  open,
  goals,
  loading,
  savingGoalId,
  error,
  onClose,
  onStatusChange,
}: Props) {
  const active = goals.filter(
    (goal) => goal.status === 'active',
  ).length

  return (
    <aside
      className={
        open
          ? 'lifeform-identity-panel lifeform-identity-panel-open'
          : 'lifeform-identity-panel'
      }
      aria-hidden={!open}
      aria-label="Goals"
    >
      <header className="lifeform-identity-header">
        <div>
          <p className="eyebrow">Direction</p>
          <h2>Goals</h2>
          <p>{active} / {MAX_ACTIVE_GOALS} active</p>
        </div>
        <button
          type="button"
          className="text-button"
          onClick={onClose}
        >
          Close
        </button>
      </header>

      <p className="lifeform-identity-intro">
        Goals are a few durable directions,
        not a daily task list.
      </p>

      {error && (
        <p className="feedback feedback-error">
          {error}
        </p>
      )}

      <div className="lifeform-identity-list">
        {loading ? (
          <p>Loading goals…</p>
        ) : goals.length === 0 ? (
          <p>
            No goals yet. Confirmed
            “Possible goals” appear here.
          </p>
        ) : (
          sortGoals(goals).map((goal) => {
            const saving =
              savingGoalId === goal.id

            return (
              <article
                className="lifeform-identity-item"
                key={goal.id}
              >
                <div className="lifeform-identity-meta">
                  <span>{goal.status}</span>
                  <span>{goal.importance}%</span>
                </div>
                <p>{goal.content}</p>
                <div className="lifeform-identity-actions">
                  {goal.status === 'active' && (
                    <>
                      <button
                        type="button"
                        className="text-button"
                        disabled={saving}
                        onClick={() =>
                          onStatusChange(goal, 'paused')
                        }
                      >
                        Pause
                      </button>
                      <button
                        type="button"
                        className="text-button"
                        disabled={saving}
                        onClick={() =>
                          onStatusChange(goal, 'completed')
                        }
                      >
                        Complete
                      </button>
                    </>
                  )}
                  {goal.status !== 'active' && (
                    <button
                      type="button"
                      className="text-button"
                      disabled={
                        saving ||
                        active >= MAX_ACTIVE_GOALS
                      }
                      onClick={() =>
                        onStatusChange(goal, 'active')
                      }
                    >
                      Reactivate
                    </button>
                  )}
                  {goal.status !== 'archived' && (
                    <button
                      type="button"
                      className="text-button"
                      disabled={saving}
                      onClick={() =>
                        onStatusChange(goal, 'archived')
                      }
                    >
                      Archive
                    </button>
                  )}
                </div>
              </article>
            )
          })
        )}
      </div>
    </aside>
  )
}
