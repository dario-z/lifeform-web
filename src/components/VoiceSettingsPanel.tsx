import {
  VOICE_GENDER_PREFERENCES,
  VOICE_LANGUAGES,
  VOICE_LANGUAGE_LABELS,
  chooseNativeVoice,
  createVoiceSettingsForVoice,
  detectVoiceGenderPreference,
  getCompatibleNativeVoices,
  getVoiceGenderPreferenceLabel,
  type NativeVoiceSettings,
  type VoiceGenderPreference,
  type VoiceLanguage,
} from '../lib/nativeVoice'
import './LifeformIdentityPanels.css'
import './VoiceSettingsPanel.css'

type VoiceSettingsPanelProps = {
  open: boolean
  deviceSupported: boolean
  settings: NativeVoiceSettings
  voices: SpeechSynthesisVoice[]
  speaking: boolean
  onClose: () => void
  onSettingsChange: (
    settings: NativeVoiceSettings,
  ) => void
  onTest: () => void
  onStop: () => void
}

function getLanguageLabel(
  language: VoiceLanguage,
): string {
  return (
    VOICE_LANGUAGE_LABELS[language] +
    ' (' +
    language +
    ')'
  )
}

function getVoiceOptionLabel(
  voice: SpeechSynthesisVoice,
): string {
  return voice.name + ' — ' + voice.lang
}

export function VoiceSettingsPanel({
  open,
  deviceSupported,
  settings,
  voices,
  speaking,
  onClose,
  onSettingsChange,
  onTest,
  onStop,
}: VoiceSettingsPanelProps) {
  const languageVoices =
    getCompatibleNativeVoices(
      settings.voiceLanguage,
      voices,
    )

  const preferredVoices =
    languageVoices.filter(
      (voice) =>
        detectVoiceGenderPreference(
          voice,
        ) ===
        settings.voiceGenderPreference,
    )

  const fallbackProfileVoices =
    languageVoices.filter((voice) => {
      const detectedGender =
        detectVoiceGenderPreference(voice)

      return (
        detectedGender !== null &&
        detectedGender !==
          settings.voiceGenderPreference
      )
    })

  const selectableVoices =
    preferredVoices.length > 0
      ? preferredVoices
      : fallbackProfileVoices

  const selectedVoice = chooseNativeVoice(
    voices,
    settings,
  )

  const selectedVoiceUri =
    selectedVoice?.voiceURI ?? ''

  const hasLanguageVoices =
    languageVoices.length > 0
  const hasPreferredVoices =
    preferredVoices.length > 0
  const hasSelectableVoice =
    selectableVoices.length > 0 &&
    selectedVoice !== null

  const controlsDisabled =
    !settings.voiceEnabled ||
    !deviceSupported

  let availabilityMessage: string

  if (!deviceSupported) {
    availabilityMessage =
      'Speech synthesis is not available in this browser.'
  } else if (!hasLanguageVoices) {
    availabilityMessage =
      'No voices for ' +
      getLanguageLabel(
        settings.voiceLanguage,
      ) +
      ' are installed on this device. Test voice is disabled.'
  } else if (!hasPreferredVoices) {
    availabilityMessage =
      'No ' +
      getVoiceGenderPreferenceLabel(
        settings.voiceGenderPreference,
      ) +
      ' voice was detected for ' +
      getLanguageLabel(
        settings.voiceLanguage,
      ) +
      '. This combination is not available on this device.'

    if (fallbackProfileVoices.length > 0) {
      availabilityMessage +=
        ' Falling back only to another voice in the same language.'
    }
  } else {
    availabilityMessage =
      String(selectableVoices.length) +
      ' matching device voice' +
      (selectableVoices.length === 1
        ? ''
        : 's') +
      ' found.'
  }

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
            {settings.voiceEnabled
              ? 'On'
              : 'Off'}
            {' · '}
            {getLanguageLabel(
              settings.voiceLanguage,
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

      <p className="voice-settings-intro">
        Voice uses only the browser and
        device voices returned by the Web
        Speech API.
      </p>

      <label className="voice-settings-toggle">
        <input
          type="checkbox"
          checked={settings.voiceEnabled}
          onChange={(event) =>
            onSettingsChange({
              ...settings,
              voiceEnabled:
                event.target.checked,
            })
          }
        />

        <span>Voice On/Off</span>
      </label>

      <label className="voice-settings-field">
        <span>Language</span>

        <select
          value={settings.voiceLanguage}
          onChange={(event) =>
            onSettingsChange({
              ...settings,
              voiceLanguage: event.target
                .value as VoiceLanguage,
              voiceURI: '',
              voiceName: '',
              voiceLang: '',
            })
          }
          disabled={!settings.voiceEnabled}
        >
          {VOICE_LANGUAGES.map(
            (language) => (
              <option
                key={language}
                value={language}
              >
                {getLanguageLabel(language)}
              </option>
            ),
          )}
        </select>
      </label>

      <label className="voice-settings-field">
        <span>Voice preference</span>

        <select
          value={
            settings.voiceGenderPreference
          }
          onChange={(event) =>
            onSettingsChange({
              ...settings,
              voiceGenderPreference: event
                .target
                .value as VoiceGenderPreference,
              voiceURI: '',
              voiceName: '',
              voiceLang: '',
            })
          }
          disabled={!settings.voiceEnabled}
        >
          {VOICE_GENDER_PREFERENCES.map(
            (preference) => (
              <option
                key={preference}
                value={preference}
              >
                {getVoiceGenderPreferenceLabel(
                  preference,
                )}
              </option>
            ),
          )}
        </select>
      </label>

      <label className="voice-settings-field">
        <span>Available voice</span>

        <select
          value={selectedVoiceUri}
          onChange={(event) => {
            const voice =
              selectableVoices.find(
                (candidate) =>
                  candidate.voiceURI ===
                  event.target.value,
              ) ?? null

            onSettingsChange(
              createVoiceSettingsForVoice(
                settings,
                voice,
              ),
            )
          }}
          disabled={
            controlsDisabled ||
            !hasSelectableVoice
          }
        >
          {!hasSelectableVoice && (
            <option value="">
              No available voice
            </option>
          )}

          {selectableVoices.map((voice) => (
            <option
              key={voice.voiceURI}
              value={voice.voiceURI}
            >
              {getVoiceOptionLabel(voice)}
            </option>
          ))}
        </select>

        <small>
          {availabilityMessage}
        </small>
      </label>

      <div className="voice-settings-actions">
        <button
          type="button"
          className="primary-button"
          onClick={onTest}
          disabled={
            controlsDisabled ||
            !hasSelectableVoice
          }
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
        Some browsers load the voice list
        after the panel opens. If the list
        changes, it is refreshed from the
        device automatically.
      </p>
    </aside>
  )
}
