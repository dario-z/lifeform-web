import { useEffect, useState } from 'react'
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
import {
  normalizeDailyTokenLimit,
} from '../lib/gemini'
import './EmotionMonitor.css'
import './MobileResponsive.css'

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
  const [
    dailyTokenLimitInput,
    setDailyTokenLimitInput,
  ] = useState(
    String(dailyTokenLimit),
  )

  useEffect(() => {
    setDailyTokenLimitInput(
      String(dailyTokenLimit),
    )
  }, [dailyTokenLimit])

  const commitDailyTokenLimit = () => {
    const cleanValue =
      dailyTokenLimitInput
        .replace(/[^0-9]/g, '')
        .slice(0, 9)

    if (!cleanValue) {
      setDailyTokenLimitInput(
        String(dailyTokenLimit),
      )
      return
    }

    const normalizedValue =
      normalizeDailyTokenLimit(
        Number(cleanValue),
      )

    setDailyTokenLimitInput(
      String(normalizedValue),
    )

    if (
      normalizedValue !==
      dailyTokenLimit
    ) {
      onDailyTokenLimitChange(
        normalizedValue,
      )
    }
  }

  const closeMonitor = () => {
    commitDailyTokenLimit()
    onClose()
  }

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
          closeMonitor()
        }
      }}
    >
      <aside
        className="emotion-monitor"
        aria-label="Parametri emotivi"
      >
        <header className="emotion-monitor-header">
          <div className="emotion-monitor-title">
            <p className="eyebrow">
              Emotional telemetry
            </p>

            <h2>Parametri emotivi</h2>
          </div>

          <button
            type="button"
            className="emotion-monitor-close"
            onClick={closeMonitor}
            aria-label="Chiudi parametri emotivi"
          >
            ×
          </button>
        </header>

        <section className="emotion-monitor-summary">
          <div>
            <span>Stato attuale</span>
            <strong>
              {getEmotionUiLabel(
                currentEmotion,
              )}
            </strong>
          </div>

          <div>
            <span>Intensità</span>
            <strong>{intensity}</strong>
          </div>

          <div>
            <span>Classificatore</span>
            <strong>
              {analyzing
                ? 'Analisi…'
                : analysisSource === 'fallback'
                  ? 'Fallback locale'
                  : analysisSource === 'model'
                    ? 'Gemini'
                    : 'In attesa'}
            </strong>
          </div>

          <div>
            <span>Pool emotivo</span>
            <strong>
              {emotionPointTotal}
              {' / '}
              {EMOTION_POINT_BUDGET}
            </strong>
          </div>

          <div>
            <span>Token odierni</span>
            <strong>
              {dailyTokensUsed.toLocaleString('it-IT')}
              {' / '}
              {dailyTokenLimit.toLocaleString('it-IT')}
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
              ? 'Salvataggio impostazioni…'
              : 'Le impostazioni vengono salvate automaticamente.'}
        </div>

        <section className="daily-token-settings">
          <div className="daily-token-settings-heading">
            <div>
              <span>Stanchezza giornaliera</span>
              <strong>
                {tokenPercentage}%
              </strong>
            </div>

            <p>
              Tired dipende soltanto dai token realmente utilizzati oggi da chat e classificatore emotivo.
            </p>
          </div>

          <div
            className="daily-token-progress"
            aria-label={
              'Consumo token giornaliero: ' +
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
              Token massimi giornalieri
            </span>

            <input
              id="daily-token-limit-monitor"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={dailyTokenLimitInput}
              onChange={(event) =>
                setDailyTokenLimitInput(
                  event.target.value
                    .replace(/[^0-9]/g, '')
                    .slice(0, 9),
                )
              }
              onBlur={commitDailyTokenLimit}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.currentTarget.blur()
                }
              }}
              aria-label="Token massimi giornalieri"
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
                  emotion === 'tired'
                    ? 'emotion-parameter emotion-parameter-derived'
                    : 'emotion-parameter'
                }
              >
                <div className="emotion-parameter-heading">
                  <span>
                    {getEmotionUiLabel(emotion)}
                  </span>

                  <span>
                    Livello {level}
                  </span>
                </div>

                <div
                  className="emotion-level-track"
                  aria-label={
                    getEmotionUiLabel(emotion) +
                    ': livello ' +
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
                    Automatico: segue il consumo token giornaliero.
                  </p>
                ) : (
                  <label
                    className="emotion-sensitivity-control"
                    htmlFor={inputId}
                  >
                    <span>Sensibilità</span>

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
                        'Sensibilità ' +
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
          <span>Livello = stato dinamico</span>
          <span>Sensibilità = reattività 0–100</span>
          <span>
            Tired = consumo token giornaliero
          </span>
          <span>
            Pool massimo: {EMOTION_POINT_BUDGET}
          </span>
        </footer>
      </aside>
    </div>,
    document.body,
  )
}
