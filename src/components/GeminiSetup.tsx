import { useState } from 'react'
import type {
  FormEvent,
} from 'react'
import {
  DEFAULT_DAILY_TOKEN_LIMIT,
  GEMINI_MODEL_OPTIONS,
  getStoredDailyTokenLimit,
  getStoredGeminiModel,
  normalizeDailyTokenLimit,
  normalizeGeminiModelId,
  saveDailyTokenLimit,
  saveGeminiApiKey,
  saveGeminiModel,
  verifyGeminiApiKey,
  type GeminiModelId,
} from '../lib/gemini'
import './GeminiModelSelect.css'
import './MobileResponsive.css'
import './IvoryGlassTheme.css'

type GeminiSetupProps = {
  lifeformName: string
  onConnected: (apiKey: string) => void
  onSignOut: () => Promise<void>
}

function sanitizeTokenInput(
  value: string,
): string {
  return value
    .replace(/[^0-9]/g, '')
    .slice(0, 9)
}

function parseTokenInput(
  value: string,
): number | null {
  const cleanValue =
    sanitizeTokenInput(value)

  if (!cleanValue) {
    return null
  }

  const numericValue =
    Number(cleanValue)

  if (!Number.isFinite(numericValue)) {
    return null
  }

  return normalizeDailyTokenLimit(
    numericValue,
  )
}

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'The API key could not be verified.'
}

export function GeminiSetup({
  lifeformName,
  onConnected,
  onSignOut,
}: GeminiSetupProps) {
  const [apiKey, setApiKey] =
    useState('')

  const [selectedModel, setSelectedModel] =
    useState<GeminiModelId>(() =>
      getStoredGeminiModel(),
    )

  const [dailyTokenLimit, setDailyTokenLimit] =
    useState(() =>
      getStoredDailyTokenLimit(),
    )

  const [
    dailyTokenLimitInput,
    setDailyTokenLimitInput,
  ] = useState(() =>
    String(getStoredDailyTokenLimit()),
  )

  const [rememberOnDevice, setRememberOnDevice] =
    useState(false)

  const [showApiKey, setShowApiKey] =
    useState(false)

  const [testing, setTesting] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const cleanApiKey =
      apiKey.trim()

    if (cleanApiKey.length < 20) {
      setError(
        'The key you entered does not look like a valid Gemini API key.',
      )
      return
    }

    const normalizedTokenLimit =
      parseTokenInput(
        dailyTokenLimitInput,
      )

    if (normalizedTokenLimit === null) {
      setError(
        'Enter a valid number of daily tokens.',
      )
      return
    }

    setDailyTokenLimit(
      normalizedTokenLimit,
    )

    setDailyTokenLimitInput(
      String(normalizedTokenLimit),
    )

    setTesting(true)
    setError(null)

    try {
      await verifyGeminiApiKey(
        cleanApiKey,
        selectedModel,
      )

      saveGeminiModel(selectedModel)
      saveDailyTokenLimit(
        normalizedTokenLimit,
      )

      saveGeminiApiKey(
        cleanApiKey,
        rememberOnDevice,
      )

      onConnected(cleanApiKey)
    } catch (verificationError: unknown) {
      setError(
        getErrorMessage(
          verificationError,
        ),
      )
    } finally {
      setTesting(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="gemini-setup-card">
        <header className="gemini-setup-header">
          <div>
            <p className="eyebrow">
              AI model
            </p>

            <h1>
              Connect {lifeformName}.
            </h1>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() => void onSignOut()}
            disabled={testing}
          >
            Sign out
          </button>
        </header>

        <div className="gemini-setup-content">
          <div className="gemini-description">
            <p>
              The Lifeform will use your Gemini key to generate replies and update its emotional state.
            </p>

            <dl className="gemini-details">
              <div>
                <dt>Provider</dt>
                <dd>Google Gemini</dd>
              </div>

              <div>
                <dt>Selected model</dt>
                <dd>{selectedModel}</dd>
              </div>

              <div>
                <dt>Daily tokens</dt>
                <dd>
                  {dailyTokenLimit.toLocaleString('en-US')}
                </dd>
              </div>

              <div>
                <dt>Cloud storage</dt>
                <dd>Disabled</dd>
              </div>
            </dl>

            <a
              className="external-link"
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
            >
              Create or manage your key in Google AI Studio
            </a>
          </div>

          <form
            className="gemini-key-form"
            onSubmit={handleSubmit}
          >
            <label htmlFor="gemini-model">
              Gemini model
            </label>

            <select
              id="gemini-model"
              className="gemini-model-select"
              value={selectedModel}
              onChange={(event) => {
                const nextModel =
                  normalizeGeminiModelId(
                    event.target.value,
                  )

                setSelectedModel(nextModel)
                saveGeminiModel(nextModel)
                setError(null)
              }}
              disabled={testing}
            >
              {GEMINI_MODEL_OPTIONS.map(
                (option) => (
                  <option
                    key={option.id}
                    value={option.id}
                  >
                    {option.label}
                    {' — '}
                    {option.note}
                  </option>
                ),
              )}
            </select>

            <p className="gemini-model-explanation">
              Gemini Flash-Lite Latest is the default model. Your choice is remembered in the browser and will be used for both chat and emotional analysis.
            </p>

            <label htmlFor="daily-token-limit">
              Daily token threshold
            </label>

            <input
              id="daily-token-limit"
              className="gemini-token-limit-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={dailyTokenLimitInput}
              onChange={(event) => {
                setDailyTokenLimitInput(
                  sanitizeTokenInput(
                    event.target.value,
                  ),
                )
                setError(null)
              }}
              onBlur={() => {
                const normalizedValue =
                  parseTokenInput(
                    dailyTokenLimitInput,
                  )

                if (normalizedValue === null) {
                  setDailyTokenLimitInput(
                    String(dailyTokenLimit),
                  )
                  return
                }

                setDailyTokenLimit(
                  normalizedValue,
                )

                setDailyTokenLimitInput(
                  String(normalizedValue),
                )
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.currentTarget.blur()
                }
              }}
              disabled={testing}
              aria-describedby="daily-token-limit-help"
              required
            />

            <p
              id="daily-token-limit-help"
              className="gemini-model-explanation"
            >
              You can enter any precise whole-number value. Default value: {DEFAULT_DAILY_TOKEN_LIMIT.toLocaleString('en-US')}. The Tired parameter will rise from 0 to 100 in proportion to the tokens actually used each day by chat and the emotional classifier.
            </p>

            <label htmlFor="gemini-api-key">
              Gemini API key
            </label>

            <div className="api-key-input-row">
              <input
                id="gemini-api-key"
                type={
                  showApiKey
                    ? 'text'
                    : 'password'
                }
                value={apiKey}
                onChange={(event) =>
                  setApiKey(
                    event.target.value,
                  )
                }
                placeholder="Paste the API key here"
                autoComplete="off"
                spellCheck={false}
                disabled={testing}
                required
              />

              <button
                type="button"
                className="small-secondary-button"
                onClick={() =>
                  setShowApiKey(
                    (current) => !current,
                  )
                }
                disabled={testing}
              >
                {showApiKey
                  ? 'Hide'
                  : 'Show'}
              </button>
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={rememberOnDevice}
                onChange={(event) =>
                  setRememberOnDevice(
                    event.target.checked,
                  )
                }
                disabled={testing}
              />

              <span>
                Remember the key on this device
              </span>
            </label>

            <p className="storage-explanation">
              If you do not select this option, the key will remain available only for the current browser session.
            </p>

            {error && (
              <p
                className="feedback feedback-error"
                aria-live="assertive"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={testing}
            >
              {testing
                ? 'Checking connection…'
                : 'Verify and connect'}
            </button>

            <p className="api-key-warning">
              The key will not be saved in the database or included in the Lifeform export. A browser-based application, however, cannot protect it with the same security as a backend.
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}
