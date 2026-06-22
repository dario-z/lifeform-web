import {
  getVoiceModeLabel,
  type NativeVoiceSettings,
  type VoiceMode,
} from '../lib/nativeVoice'
import './LifeformIdentityPanels.css'
import './VoiceSettingsPanel.css'

type VoiceSettingsPanelProps = {
  open: boolean
  supported: boolean
  settings: NativeVoiceSettings
  voices: SpeechSynthesisVoice[]
  language: string
  speaking: boolean
  onClose: () => void
  onSettingsChange: (
    settings: NativeVoiceSettings,
  ) => void
  onTest: () => void
  onStop: () => void
}

export function VoiceSettingsPanel({
  open,
  supported,
  settings,
  voices,
  language,
  speaking,
  onClose,
  onSettingsChange,
  onTest,
  onStop,
}: VoiceSettingsPanelProps) {
  const selectedVoiceExists = voices.some(
    (voice) =>
      voice.voiceURI === settings.voiceUri,
  )

  const selectedVoiceUri =
    selectedVoiceExists
      ? settings.voiceUri
      : ''

  return (
    <aside
      className={
        open
          ? 'lifeform-identity-panel lifeform-identity-panel-open voice-settings-panel'
          : 'lifeform-identity-panel voice-settings-panel'
      }
      aria-hidden={!open}
      aria-label="Voice settings"
    >
      <header className="lifeform-identity-header">
        <div>
          <p className="eyebrow">
            Device speech
          </p>

          <h2>Voice</h2>

          <p>
            {getVoiceModeLabel(
              settings.mode,
            )}
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

      {!supported ? (
        <p className="feedback feedback-error">
          Voice playback is not available in
          this browser.
        </p>
      ) : (
        <>
          <p className="voice-settings-intro">
            Uses the voices already available
            on this device. No audio is saved
            or uploaded by the app.
          </p>

          <label className="voice-settings-field">
            <span>Playback mode</span>

            <select
              value={settings.mode}
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  mode: event.target
                    .value as VoiceMode,
                })
              }
            >
              <option value="off">
                Off
              </option>

              <option value="manual">
                Manual
              </option>

              <option value="auto">
                Auto
              </option>
            </select>

            <small>
              Manual shows a speaker button on
              each Lifeform reply. Auto also
              reads each new reply aloud.
            </small>
          </label>

          <label className="voice-settings-field">
            <span>Voice</span>

            <select
              value={selectedVoiceUri}
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  voiceUri:
                    event.target.value,
                })
              }
              disabled={settings.mode === 'off'}
            >
              <option value="">
                Device default
              </option>

              {voices.map((voice) => (
                <option
                  key={voice.voiceURI}
                  value={voice.voiceURI}
                >
                  {voice.name}
                  {' · '}
                  {voice.lang}
                </option>
              ))}
            </select>

            <small>
              {voices.length > 0
                ? 'Compatible with ' +
                  language.toUpperCase() +
                  '.'
                : 'No matching local voice was found. The device default will be used when available.'}
            </small>
          </label>

          <label className="voice-settings-field">
            <span>
              Speed {settings.rate.toFixed(2)}×
            </span>

            <input
              type="range"
              min="0.85"
              max="1.15"
              step="0.05"
              value={settings.rate}
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  rate: Number(
                    event.target.value,
                  ),
                })
              }
              disabled={settings.mode === 'off'}
            />
          </label>

          <div className="voice-settings-actions">
            <button
              type="button"
              className="primary-button"
              onClick={onTest}
              disabled={settings.mode === 'off'}
            >
              Test voice
            </button>

            {speaking && (
              <button
                type="button"
                className="text-button"
                onClick={onStop}
              >
                Stop
              </button>
            )}
          </div>

          <p className="voice-settings-note">
            Auto playback may require one
            initial Test voice click after the
            page opens, depending on browser
            settings.
          </p>
        </>
      )}
    </aside>
  )
}
