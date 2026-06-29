import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import {
  loadLifeformActivity,
  type LifeformActivityRecord,
} from '../lib/lifeformActivity'
import './LifeformIdentityPanels.css'
import './ActivityLogPanel.css'

type Props = {
  open: boolean
  lifeformId: string
  onClose: () => void
}

function getErrorMessage(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : 'Could not load the activity log.'
}

function getEntityLabel(
  entityType: LifeformActivityRecord['entity_type'],
): string {
  if (entityType === 'key_memory') {
    return 'Key Memory'
  }

  if (entityType === 'thread') {
    return 'Thread'
  }

  if (entityType === 'goal') {
    return 'Goal'
  }

  if (entityType === 'belief') {
    return 'Belief'
  }

  if (entityType === 'dream') {
    return 'Dream'
  }

  if (entityType === 'emotion') {
    return 'Emotion'
  }

  if (entityType === 'proposal') {
    return 'Proposal'
  }

  return 'Capability'
}

function getActorLabel(
  actor: LifeformActivityRecord['actor'],
): string {
  if (actor === 'reconciliation') {
    return 'Reconciliation'
  }

  if (actor === 'lifeform') {
    return 'Lifeform'
  }

  if (actor === 'system') {
    return 'System'
  }

  return 'User'
}

function getSnapshotStatus(
  snapshot: Record<string, unknown>,
): string | null {
  const value = snapshot.status

  return typeof value === 'string' &&
    value.trim()
    ? value
    : null
}

function formatEventTime(
  value: string,
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(date)
}

export function ActivityLogPanel({
  open,
  lifeformId,
  onClose,
}: Props) {
  const [events, setEvents] = useState<
    LifeformActivityRecord[]
  >([])

  const [loading, setLoading] =
    useState(false)

  const [error, setError] = useState<
    string | null
  >(null)

  const loadEvents = useCallback(
    async () => {
      setLoading(true)
      setError(null)

      try {
        const loaded =
          await loadLifeformActivity(
            lifeformId,
            80,
          )

        setEvents(loaded)
      } catch (loadError: unknown) {
        setError(
          getErrorMessage(loadError),
        )
      } finally {
        setLoading(false)
      }
    },
    [lifeformId],
  )

  useEffect(() => {
    if (!open) {
      return
    }

    void loadEvents()
  }, [open, loadEvents])

  return (
    <aside
      className={
        open
          ? 'lifeform-identity-panel lifeform-identity-panel-open activity-log-panel'
          : 'lifeform-identity-panel activity-log-panel'
      }
      aria-hidden={!open}
      aria-label="Activity Log"
    >
      <header className="lifeform-identity-header">
        <div>
          <p className="eyebrow">
            Verified history
          </p>

          <h2>Activity Log</h2>

          <p>
            {events.length} recent event
            {events.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="activity-log-header-actions">
          <button
            type="button"
            className="text-button"
            disabled={loading}
            onClick={() =>
              void loadEvents()
            }
          >
            Refresh
          </button>

          <button
            type="button"
            className="text-button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </header>

      <p className="lifeform-identity-intro">
        Verified manual, system and
        reconciliation activity.
      </p>

      {error && (
        <p className="feedback feedback-error">
          {error}
        </p>
      )}

      <div className="activity-log-list">
        {loading ? (
          <p>Loading activity...</p>
        ) : events.length === 0 ? (
          <p>
            No verified activity has been
            recorded yet.
          </p>
        ) : (
          events.map((event) => {
            const beforeStatus =
              getSnapshotStatus(
                event.before_snapshot,
              )

            const afterStatus =
              getSnapshotStatus(
                event.after_snapshot,
              )

            return (
              <article
                className="activity-log-entry"
                key={event.id}
              >
                <div className="activity-log-meta">
                  <span>
                    {formatEventTime(
                      event.created_at,
                    )}
                  </span>

                  <span>
                    {getActorLabel(
                      event.actor,
                    )}
                  </span>

                  <span>
                    {getEntityLabel(
                      event.entity_type,
                    ) +
                      ' - ' +
                      event.action}
                  </span>
                </div>

                <h3>
                  {event.summary ||
                    'Verified activity event.'}
                </h3>

                {event.reason && (
                  <p className="activity-log-reason">
                    {event.reason}
                  </p>
                )}

                {(beforeStatus || afterStatus) && (
                  <p className="activity-log-transition">
                    State: {beforeStatus ?? 'unknown'}
                    {' -> '}
                    {afterStatus ?? 'unknown'}
                  </p>
                )}
              </article>
            )
          })
        )}
      </div>
    </aside>
  )
}
