import type {
  LifeformBelief,
  LifeformBeliefStatus,
} from '../types/lifeformIdentity'
import {
  MAX_ACTIVE_BELIEFS,
  sortBeliefs,
} from '../lib/lifeformIdentity'
import './LifeformIdentityPanels.css'

type Props = {
  open: boolean
  beliefs: LifeformBelief[]
  loading: boolean
  savingBeliefId: string | null
  error: string | null
  onClose: () => void
  onStatusChange: (
    belief: LifeformBelief,
    status: LifeformBeliefStatus,
  ) => void
}

export function BeliefsPanel({
  open,
  beliefs,
  loading,
  savingBeliefId,
  error,
  onClose,
  onStatusChange,
}: Props) {
  const active = beliefs.filter(
    (belief) => belief.status === 'active',
  ).length

  return (
    <aside
      className={
        open
          ? 'lifeform-identity-panel lifeform-identity-panel-open'
          : 'lifeform-identity-panel'
      }
      aria-hidden={!open}
      aria-label="Beliefs"
    >
      <header className="lifeform-identity-header">
        <div>
          <p className="eyebrow">Perspective</p>
          <h2>Beliefs</h2>
          <p>{active} / {MAX_ACTIVE_BELIEFS} active</p>
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
        Beliefs are tentative perspectives,
        never objective truth.
      </p>

      {error && (
        <p className="feedback feedback-error">
          {error}
        </p>
      )}

      <div className="lifeform-identity-list">
        {loading ? (
          <p>Loading beliefs?</p>
        ) : beliefs.length === 0 ? (
          <p>
            No beliefs yet. Confirmed
            ?Possible beliefs? appear here.
          </p>
        ) : (
          sortBeliefs(beliefs).map(
            (belief) => {
              const saving =
                savingBeliefId === belief.id

              const canReactivate =
                belief.status !== 'active' &&
                active < MAX_ACTIVE_BELIEFS

              return (
                <article
                  className="lifeform-identity-item"
                  key={belief.id}
                >
                  <div className="lifeform-identity-meta">
                    <span>{belief.status}</span>
                    <span>{belief.importance}%</span>
                  </div>

                  <p>{belief.content}</p>

                  <div className="lifeform-identity-actions">
                    {belief.status === 'active' && (
                      <button
                        type="button"
                        className="text-button"
                        disabled={saving}
                        onClick={() =>
                          onStatusChange(
                            belief,
                            'retracted',
                          )
                        }
                      >
                        Retract
                      </button>
                    )}

                    {belief.status !== 'active' && (
                      <button
                        type="button"
                        className="text-button"
                        disabled={
                          saving ||
                          !canReactivate
                        }
                        onClick={() =>
                          onStatusChange(
                            belief,
                            'active',
                          )
                        }
                      >
                        Reactivate
                      </button>
                    )}

                    {belief.status !== 'archived' && (
                      <button
                        type="button"
                        className="text-button"
                        disabled={saving}
                        onClick={() =>
                          onStatusChange(
                            belief,
                            'archived',
                          )
                        }
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </article>
              )
            },
          )
        )}
      </div>
    </aside>
  )
}
