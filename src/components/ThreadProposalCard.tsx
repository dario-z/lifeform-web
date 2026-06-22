import type {
  LifeformGoal,
} from '../types/lifeformIdentity'
import type {
  LifeformThreadProposal,
} from '../types/lifeformThread'
import './LifeformThreads.css'

type ThreadProposalCardProps = {
  proposal: LifeformThreadProposal
  goals: LifeformGoal[]
  saving: boolean
  error: string | null
  onAccept: () => void
  onDismiss: () => void
}

export function ThreadProposalCard({
  proposal,
  goals,
  saving,
  error,
  onAccept,
  onDismiss,
}: ThreadProposalCardProps) {
  const linkedGoal =
    proposal.linked_goal_id
      ? goals.find(
          (goal) =>
            goal.id ===
            proposal.linked_goal_id,
        )?.content
      : null

  return (
    <section
      className="lifeform-thread-proposal-card"
      aria-label="Active Thread proposal"
    >
      <div>
        <p className="lifeform-proposal-eyebrow">
          I think this is an ongoing work context.
        </p>

        <h3>
          {proposal.action === 'update'
            ? 'Possible Thread update'
            : 'Possible Active Thread'}
        </h3>

        <h4>{proposal.title}</h4>

        <dl className="lifeform-thread-details">
          <div>
            <dt>Current context</dt>
            <dd>{proposal.current_context}</dd>
          </div>

          <div>
            <dt>Last progress</dt>
            <dd>{proposal.last_progress}</dd>
          </div>

          <div>
            <dt>Open direction</dt>
            <dd>{proposal.open_direction}</dd>
          </div>

          {linkedGoal && (
            <div>
              <dt>Linked Goal</dt>
              <dd>{linkedGoal}</dd>
            </div>
          )}
        </dl>

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
            : proposal.action === 'update'
              ? 'Update Thread'
              : 'Keep Thread'}
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
