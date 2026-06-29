import type {
  LifeformGoal,
} from '../types/lifeformIdentity'
import type {
  LifeformThread,
  LifeformThreadStatus,
} from '../types/lifeformThread'
import {
  getThreadGoalLabel,
  MAX_ACTIVE_THREADS,
  sortThreads,
} from '../lib/lifeformThreads'
import './LifeformIdentityPanels.css'
import './LifeformThreads.css'

type ThreadsPanelProps = {
  open: boolean
  threads: LifeformThread[]
  goals: LifeformGoal[]
  loading: boolean
  savingThreadId: string | null
  error: string | null
  onClose: () => void
  onStatusChange: (
    thread: LifeformThread,
    status: LifeformThreadStatus,
  ) => void
  onDelete: (thread: LifeformThread) => void
}

export function ThreadsPanel({
  open,
  threads,
  goals,
  loading,
  savingThreadId,
  error,
  onClose,
  onStatusChange,
  onDelete,
}: ThreadsPanelProps) {
  const activeCount = threads.filter(
    (thread) => thread.status === 'active',
  ).length

  return (
    <aside
      className={
        open
          ? 'lifeform-identity-panel lifeform-identity-panel-open'
          : 'lifeform-identity-panel'
      }
      aria-hidden={!open}
      aria-label="Threads"
    >
      <header className="lifeform-identity-header">
        <div>
          <p className="eyebrow">Work context</p>
          <h2>Threads</h2>
          <p>
            {activeCount} / {MAX_ACTIVE_THREADS} active
          </p>
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
        Threads hold the living context of an
        ongoing subject. They are not Goals,
        checklists or obligations.
      </p>

      {error && (
        <p className="feedback feedback-error">
          {error}
        </p>
      )}

      <div className="lifeform-identity-list">
        {loading ? (
          <p>Loading Threads…</p>
        ) : threads.length === 0 ? (
          <p>
            No Threads yet. Confirmed
            “Possible Active Threads” appear
            here.
          </p>
        ) : (
          sortThreads(threads).map((thread) => {
            const saving =
              savingThreadId === thread.id
            const linkedGoal = getThreadGoalLabel(
              thread,
              goals,
            )

            return (
              <article
                className="lifeform-identity-item lifeform-thread-item"
                key={thread.id}
              >
                <div className="lifeform-identity-meta">
                  <span>{thread.status}</span>

                  {linkedGoal && (
                    <span>Linked Goal</span>
                  )}
                </div>

                <h3>{thread.title}</h3>

                <dl className="lifeform-thread-details">
                  <div>
                    <dt>Current context</dt>
                    <dd>
                      {thread.current_context}
                    </dd>
                  </div>

                  <div>
                    <dt>Last progress</dt>
                    <dd>
                      {thread.last_progress}
                    </dd>
                  </div>

                  <div>
                    <dt>Open direction</dt>
                    <dd>
                      {thread.open_direction}
                    </dd>
                  </div>

                  {linkedGoal && (
                    <div>
                      <dt>Linked Goal</dt>
                      <dd>{linkedGoal}</dd>
                    </div>
                  )}
                </dl>

                <div className="lifeform-identity-actions">
                  <button
                    type="button"
                    className="text-button"
                    disabled={
                      saving ||
                      (thread.status === 'archived' &&
                        activeCount >=
                          MAX_ACTIVE_THREADS)
                    }
                    onClick={() =>
                      onStatusChange(
                        thread,
                        thread.status === 'active'
                          ? 'archived'
                          : 'active',
                      )
                    }
                  >
                    {thread.status === 'active'
                      ? 'Archive'
                      : 'Reactivate'}
                  </button>

                  <button
                    type="button"
                    className="text-button lifeform-thread-delete"
                    disabled={saving}
                    onClick={() =>
                      onDelete(thread)
                    }
                  >
                    Delete
                  </button>
                </div>
              </article>
            )
          })
        )}
      </div>
    </aside>
  )
}
