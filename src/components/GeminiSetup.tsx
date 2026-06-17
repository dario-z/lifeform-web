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

type GeminiSetupProps = {
  lifeformName: string
  onConnected: (apiKey: string) => void
  onSignOut: () => Promise<void>
}

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Non è stato possibile verificare la chiave API.'
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
        'La chiave inserita non sembra essere una chiave Gemini valida.',
      )
      return
    }

    setTesting(true)
    setError(null)

    try {
      await verifyGeminiApiKey(
        cleanApiKey,
        selectedModel,
      )

      saveGeminiModel(selectedModel)
      saveDailyTokenLimit(
        dailyTokenLimit,
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
              Modello IA
            </p>

            <h1>
              Connetti {lifeformName}.
            </h1>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() => void onSignOut()}
            disabled={testing}
          >
            Esci
          </button>
        </header>

        <div className="gemini-setup-content">
          <div className="gemini-description">
            <p>
              La Lifeform utilizzerà la tua chiave Gemini per generare le risposte e aggiornare il proprio stato emotivo.
            </p>

            <dl className="gemini-details">
              <div>
                <dt>Provider</dt>
                <dd>Google Gemini</dd>
              </div>

              <div>
                <dt>Modello selezionato</dt>
                <dd>{selectedModel}</dd>
              </div>

              <div>
                <dt>Token giornalieri</dt>
                <dd>
                  {dailyTokenLimit.toLocaleString('it-IT')}
                </dd>
              </div>

              <div>
                <dt>Salvataggio cloud</dt>
                <dd>Disattivato</dd>
              </div>
            </dl>

            <a
              className="external-link"
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
            >
              Crea o gestisci la chiave in Google AI Studio
            </a>
          </div>

          <form
            className="gemini-key-form"
            onSubmit={handleSubmit}
          >
            <label htmlFor="gemini-model">
              Modello Gemini
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
              Gemini Flash-Lite Latest è il modello predefinito. La scelta viene ricordata nel browser e verrà usata sia per la chat sia per l’analisi emotiva.
            </p>

            <label htmlFor="daily-token-limit">
              Soglia token giornaliera
            </label>

            <input
              id="daily-token-limit"
              className="gemini-token-limit-input"
              type="number"
              min="1000"
              max="100000000"
              step="1000"
              value={dailyTokenLimit}
              onChange={(event) =>
                setDailyTokenLimit(
                  normalizeDailyTokenLimit(
                    event.target.valueAsNumber,
                  ),
                )
              }
              disabled={testing}
              required
            />

            <p className="gemini-model-explanation">
              Valore standard: {DEFAULT_DAILY_TOKEN_LIMIT.toLocaleString('it-IT')}. Il parametro Tired crescerà dallo 0 al 100 in proporzione ai token realmente usati ogni giorno da chat e classificatore emotivo.
            </p>

            <label htmlFor="gemini-api-key">
              Chiave API Gemini
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
                placeholder="Incolla qui la chiave API"
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
                  ? 'Nascondi'
                  : 'Mostra'}
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
                Ricorda la chiave su questo dispositivo
              </span>
            </label>

            <p className="storage-explanation">
              Se non selezioni questa opzione, la chiave rimarrà disponibile soltanto nella sessione corrente del browser.
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
                ? 'Verifica della connessione…'
                : 'Verifica e connetti'}
            </button>

            <p className="api-key-warning">
              La chiave non verrà salvata nel database né inclusa nell’esportazione della Lifeform. Un’applicazione eseguita nel browser non può però proteggerla con la stessa sicurezza di un backend.
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}
