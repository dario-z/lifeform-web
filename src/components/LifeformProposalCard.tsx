import type {
  LifeformProposal,
} from '../types/lifeformProposal'
import {
  getProposalHeading,
} from '../types/lifeformProposal'
import './LifeformProposalCard.css'

type LifeformProposalCardProps = {
  proposal: LifeformProposal
  saving: boolean
  error: string | null
  onAccept: () => void
  onDismiss: () => void
}

export function LifeformProposalCard({
  proposal,
  saving,
  error,
  onAccept,
  onDismiss,
}: LifeformProposalCardProps) {
  return (
    <section
      className="lifeform-proposal-card"
      aria-label="Lifeform proposal"
    >
      <div className="lifeform-proposal-copy">
        <p className="lifeform-proposal-eyebrow">
          I think this could matter.
        </p>

        <h3>
          {getProposalHeading(
            proposal.kind,
          )}
        </h3>

        <p className="lifeform-proposal-content">
          “{proposal.content}”
        </p>

        {proposal.reason && (
          <p className="lifeform-proposal-reason">
            {proposal.reason}
          </p>
        )}
      </div>

      {error && (
        <p
          className="lifeform-proposal-error"
          aria-live="assertive"
        >
          {error}
        </p>
      )}

      <div className="lifeform-proposal-actions">
        <button
          type="button"
          className="primary-button"
          onClick={onAccept}
          disabled={saving}
        >
          {saving
            ? 'Saving…'
            : 'Keep it'}
        </button>

        <button
          type="button"
          className="text-button"
          onClick={onDismiss}
          disabled={saving}
        >
          Dismiss
        </button>
      </div>
    </section>
  )
}
