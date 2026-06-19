import { createPortal } from 'react-dom'
import type { Dream } from '../types/dream'
import './DreamsPanel.css'

type DreamsPanelProps = {
  open: boolean
  dreams: Dream[]
  loading: boolean
  generating: boolean
  error: string | null
  onClose: () => void
}

function formatDreamDate(
  value: string,
): string {
  const date = new Date(
    value + 'T00:00:00',
  )

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    },
  ).format(date)
}

export function DreamsPanel({
  open,
  dreams,
  loading,
  generating,
  error,
  onClose,
}: DreamsPanelProps) {
  if (!open) {
    return null
  }

  return createPortal(
    <div
      className="dreams-panel-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <aside
        className="dreams-panel"
        aria-label="Dreams"
      >
        <header className="dreams-panel-header">
          <div>
            <p className="eyebrow">
              Nocturnal memory
            </p>

            <h2>Dreams</h2>

            <p>
              Last {dreams.length} / 3 dreams remembered
            </p>
          </div>

          <button
            type="button"
            className="dreams-panel-close"
            onClick={onClose}
            aria-label="Close Dreams"
          >
            ×
          </button>
        </header>

        <div className="dreams-panel-intro">
          Each day, when you return after midnight,
          the Lifeform may recover one abstract dream
          from recent memory, emotion and symbolic noise.
        </div>

        {generating && (
          <p className="dreams-panel-status">
            Dreaming…
          </p>
        )}

        {error && (
          <p className="dreams-panel-error">
            {error}
          </p>
        )}

        <div className="dreams-list">
          {loading ? (
            <p className="dreams-empty">
              Loading dreams…
            </p>
          ) : dreams.length === 0 ? (
            <p className="dreams-empty">
              No Dreams have been remembered yet.
              Return after midnight or continue the
              conversation to give the Lifeform more
              material to process.
            </p>
          ) : (
            dreams.map((dream) => (
              <article
                key={dream.id}
                className="dream-card"
              >
                <div className="dream-card-topline">
                  <span>
                    {formatDreamDate(
                      dream.dream_date,
                    )}
                  </span>

                  <span>
                    {dream.dominant_emotion}
                  </span>
                </div>

                <h3>{dream.title}</h3>

                <p>{dream.dream_text}</p>

                <div className="dream-anchor">
                  Anchor: {dream.random_anchor}
                </div>
              </article>
            ))
          )}
        </div>
      </aside>
    </div>,
    document.body,
  )
}
