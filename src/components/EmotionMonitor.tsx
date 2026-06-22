import { createPortal } from 'react-dom'
import { EMOTION_LABELS } from '../lib/sprites'
import {
  EMOTION_POINT_BUDGET,
  TRACKED_EMOTIONS,
  getEmotionPointTotal,
  type EmotionalAnalysisSource,
  type EmotionLevels,
  type TrackedEmotion,
} from '../lib/emotions'
import type {
  EmotionalSensitivities,
  EmotionalState,
} from '../types/lifeform'
import './EmotionMonitor.css'

type EmotionMonitorProps = {
  open: boolean
  levels: EmotionLevels
  sensitivities: EmotionalSensitivities
  currentEmotion: EmotionalState
  intensity: number
  analyzing: boolean
  lastReason: string | null
  analysisSource: EmotionalAnalysisSource | null
  savingSensitivities: boolean
  sensitivitySaveError: string | null
  dailyTokenLimit: number
  dailyTokensUsed: number
  savingTokenSettings: boolean
  tokenSettingsSaveError: string | null
  onSensitivityChange: (
    emotion: TrackedEmotion,
    value: number,
  ) => void
  onDailyTokenLimitChange: (
    value: number,
  ) => void
  onClose: () => void
}

function getEmotionUiLabel(
  emotion: EmotionalState,
): string {
  if (emotion === 'horny') {
    return 'Excited'
  }

  if (emotion === 'lonely') {
    return 'Loneliness'
  }

  return EMOTION_LABELS[emotion]
}

export function EmotionMonitor({
  open,
  levels,
  sensitivities,
  currentEmotion,
  intensity,
  analyzing,
  lastReason,
  analysisSource,
  savingSensitivities,
  sensitivitySaveError,
  dailyTokenLimit,
  dailyTokensUsed,
  savingTokenSettings,
  tokenSettingsSaveError,
  onSensitivityChange,
  onDailyTokenLimitChange,
  onClose,
}: EmotionMonitorProps) {
  if (!open) {
    return null
  }

  const emotionPointTotal =
    getEmotionPointTotal(levels)

  const tokenPercentage = Math.min(
    100,
    Math.max(
      0,
      dailyTokenLimit > 0
        ? Math.round(
            dailyTokensUsed /
              dailyTokenLimit *
              100,
          )
        : 0,
    ),
  )

  const settingsError =
    sensitivitySaveError ??
    tokenSettingsSaveError

  const savingSettings =
    savingSensitivities ||
    savingTokenSettings

  return createPortal(
    <div
      className="emotion-monitor-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <aside
        className="emotion-monitor"
        aria-label="Emotional parameters"
      >
        <header className="emotion-monitor-header">
          <div className="emotion-monitor-title">
            <p className="eyebrow">
              Emotional telemetry
            </p>

            <h2>Emotional parameters</h2>
          </div>

          <button
            type="button"
            className="emotion-monitor-close"
            onClick={onClose}
            aria-label="Close emotional parameters"
          >
            ×
          </button>
        </header>

        <section className="emotion-monitor-summary">
          <div>
            <span>Current state</span>
            <strong>
              {getEmotionUiLabel(
                currentEmotion,
              )}
            </strong>
          </div>

          <div>
            <span>Intensity</span>
            <strong>{intensity}</strong>
          </div>

          <div>
            <span>Classifier</span>
            <strong>
              {analyzing
                ? 'Analysis…'
                : analysisSource === 'fallback'
                  ? 'Local fallback'
                  : analysisSource === 'model'
                    ? 'Gemini'
                    : 'Waiting'}
            </strong>
          </div>

          <div>
            <span>Emotion pool</span>
            <strong>
              {emotionPointTotal}
              {' / '}
              {EMOTION_POINT_BUDGET}
            </strong>
          </div>

          <div>
            <span>Daily tokens</span>
            <strong>
              {dailyTokensUsed.toLocaleString('en-US')}
              {' / '}
              {dailyTokenLimit.toLocaleString('en-US')}
            </strong>
          </div>
        </section>

        {lastReason && (
          <p className="emotion-monitor-reason">
            {lastReason}
          </p>
        )}

        <div
          className={
            settingsError
              ? 'emotion-sensitivity-save-status emotion-sensitivity-save-status-error'
              : 'emotion-sensitivity-save-status'
          }
          aria-live="polite"
        >
          {settingsError
            ? settingsError
            : savingSettings
              ? 'Saving settings…'
              : 'Settings are saved automatically.'}
        </div>

        <section className="daily-token-settings">
          <div className="daily-token-settings-heading">
            <div>
              <span>Daily tiredness</span>
              <strong>
                {tokenPercentage}%
              </strong>
            </div>

            <p>
              Tired depends only on the tokens actually used today by chat and emotional classifier.
            </p>
          </div>

          <div
            className="daily-token-progress"
            aria-label={
              'Daily token usage: ' +
              String(tokenPercentage) +
              '%'
            }
          >
            <span
              style={{
                width:
                  String(tokenPercentage) +
                  '%',
              }}
            />
          </div>

          <label
            className="daily-token-limit-control"
            htmlFor="daily-token-limit-monitor"
          >
            <span>
              Daily token limit
            </span>

            <input
              id="daily-token-limit-monitor"
              type="number"
              min="1000"
              max="100000000"
              step="10000"
              value={dailyTokenLimit}
              onChange={(event) => {
                if (
                  Number.isFinite(
                    event.target.valueAsNumber,
                  )
                ) {
                  onDailyTokenLimitChange(
                    event.target.valueAsNumber,
                  )
                }
              }}
            />
          </label>
        </section>

        <div className="emotion-parameter-list">
          {TRACKED_EMOTIONS.map((emotion) => {
            const level = levels[emotion]
            const sensitivity =
              sensitivities[emotion] ?? 50

            const inputId =
              'emotion-sensitivity-' + emotion

            return (
              <section
                key={emotion}
                className={
                  emotion === 'tired' ||
                  emotion === 'lonely'
                    ? 'emotion-parameter emotion-parameter-derived'
                    : 'emotion-parameter'
                }
              >
                <div className="emotion-parameter-heading">
                  <span>
                    {getEmotionUiLabel(emotion)}
                  </span>

                  <span>
                    Level {level}
                  </span>
                </div>

                <div
                  className="emotion-level-track"
                  aria-label={
                    getEmotionUiLabel(emotion) +
                    ': level ' +
                    String(level)
                  }
                >
                  <span
                    style={{
                      width:
                        String(level) + '%',
                    }}
                  />
                </div>

                {emotion === 'tired' ? (
                  <p className="emotion-derived-note">
                    Automatic: follows daily token usage.
                  </p>
                ) : emotion === 'lonely' ? (
                  <p className="emotion-derived-note">
                    Automatic: begins after 24 hours away and eases after conversation.
                  </p>
                ) : (
                  <label
                    className="emotion-sensitivity-control"
                    htmlFor={inputId}
                  >
                    <span>Sensitivity</span>

                    <input
                      id={inputId}
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={sensitivity}
                      onChange={(event) =>
                        onSensitivityChange(
                          emotion,
                          Number(
                            event.target.value,
                          ),
                        )
                      }
                      aria-label={
                        'Sensitivity ' +
                        getEmotionUiLabel(
                          emotion,
                        )
                      }
                    />

                    <output htmlFor={inputId}>
                      {sensitivity}
                    </output>
                  </label>
                )}
              </section>
            )
          })}
        </div>

        <footer className="emotion-monitor-footer">
          <span>Level = dynamic state</span>
          <span>Sensitivity = reactivity 0–100</span>
          <span>
            Tired + Loneliness = automatic
          </span>
          <span>
            Maximum pool: {EMOTION_POINT_BUDGET}
          </span>
        </footer>
      </aside>
    </div>,
    document.body,
  )
}
