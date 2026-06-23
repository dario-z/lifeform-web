import { useState } from 'react'
import type { FormEvent } from 'react'
import type {
  OnboardingData,
  SupportedLanguage,
} from '../types/lifeform'

type LifeformOnboardingProps = {
  userEmail: string
  submitting: boolean
  serverError: string | null
  onCreate: (data: OnboardingData) => Promise<void>
  onSignOut: () => Promise<void>
}

const LANGUAGE_OPTIONS: Array<{
  value: SupportedLanguage
  label: string
}> = [
  { value: 'it', label: 'Italiano' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
]

export function LifeformOnboarding({
  userEmail,
  submitting,
  serverError,
  onCreate,
  onSignOut,
}: LifeformOnboardingProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [displayName, setDisplayName] = useState('')
  const [lifeformName, setLifeformName] = useState('')
  const [language, setLanguage] =
    useState<SupportedLanguage>('it')
  const [validationError, setValidationError] =
    useState<string | null>(null)

  const validateCurrentStep = (): boolean => {
    setValidationError(null)

    if (step === 1) {
      const cleanName = displayName.trim()

      if (cleanName.length < 2 || cleanName.length > 40) {
        setValidationError(
          'Your name deve contenere da 2 a 40 caratteri.',
        )
        return false
      }
    }

    if (step === 2) {
      const cleanLifeformName = lifeformName.trim()

      if (
        cleanLifeformName.length < 1 ||
        cleanLifeformName.length > 40
      ) {
        setValidationError(
          'Il nome della Lifeform deve contenere da 1 a 40 caratteri.',
        )
        return false
      }
    }

    return true
  }

  const goForward = () => {
    if (!validateCurrentStep()) {
      return
    }

    if (step === 1) {
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  const goBack = () => {
    setValidationError(null)

    if (step === 3) {
      setStep(2)
    } else if (step === 2) {
      setStep(1)
    }
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (step < 3) {
      goForward()
      return
    }

    await onCreate({
      displayName: displayName.trim(),
      lifeformName: lifeformName.trim(),
      language,
    })
  }

  const visibleError = serverError ?? validationError

  return (
    <main className="app-shell">
      <section className="onboarding-card">
        <header className="onboarding-topbar">
          <div>
            <p className="eyebrow">Prima connessione</p>
            <p className="onboarding-account">{userEmail}</p>
          </div>

          <button
            type="button"
            className="text-button"
            onClick={() => void onSignOut()}
            disabled={submitting}
          >
            Sign out
          </button>
        </header>

        <div
          className="onboarding-progress"
          aria-label={`Passaggio ${step} di 3`}
        >
          {[1, 2, 3].map((progressStep) => (
            <span
              key={progressStep}
              className={
                progressStep <= step ? 'progress-active' : ''
              }
            />
          ))}
        </div>

        <form
          className="onboarding-form"
          onSubmit={handleSubmit}
        >
          {step === 1 && (
            <section className="onboarding-step">
              <p className="step-number">01 / 03</p>

              <h1>How should you be called?</h1>

              <p className="step-description">
                Questo sarà il nome normalmente utilizzato dalla
                Lifeform quando si rivolgerà a te.
              </p>

              <label htmlFor="display-name">
                Your name o soprannome
              </label>

              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(event) =>
                  setDisplayName(event.target.value)
                }
                placeholder="Dario"
                minLength={2}
                maxLength={40}
                autoFocus
                disabled={submitting}
              />
            </section>
          )}

          {step === 2 && (
            <section className="onboarding-step">
              <p className="step-number">02 / 03</p>

              <h1>Dalle un nome.</h1>

              <p className="step-description">
                Il nome appartiene alla tua Lifeform e potrà essere
                modificato successivamente dalle impostazioni.
              </p>

              <label htmlFor="lifeform-name">
                Lifeform name
              </label>

              <input
                id="lifeform-name"
                type="text"
                value={lifeformName}
                onChange={(event) =>
                  setLifeformName(event.target.value)
                }
                placeholder="Esempio: Aiko"
                minLength={1}
                maxLength={40}
                autoFocus
                disabled={submitting}
              />

              <label htmlFor="lifeform-language">
                Lingua principale
              </label>

              <select
                id="lifeform-language"
                value={language}
                onChange={(event) =>
                  setLanguage(
                    event.target.value as SupportedLanguage,
                  )
                }
                disabled={submitting}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </section>
          )}

          {step === 3 && (
            <section className="onboarding-step">
              <p className="step-number">03 / 03</p>

              <h1>Pronta per emergere.</h1>

              <p className="step-description">
                Verrà creata una sola Lifeform associata
                permanentemente a questo account.
              </p>

              <dl className="onboarding-summary">
                <div>
                  <dt>Utente</dt>
                  <dd>{displayName}</dd>
                </div>

                <div>
                  <dt>Lifeform</dt>
                  <dd>{lifeformName}</dd>
                </div>

                <div>
                  <dt>Lingua</dt>
                  <dd>
                    {
                      LANGUAGE_OPTIONS.find(
                        (option) => option.value === language,
                      )?.label
                    }
                  </dd>
                </div>

                <div>
                  <dt>Stato iniziale</dt>
                  <dd>Neutral</dd>
                </div>
              </dl>
            </section>
          )}

          {visibleError && (
            <p
              className="feedback feedback-error"
              aria-live="polite"
            >
              {visibleError}
            </p>
          )}

          <footer className="wizard-actions">
            {step > 1 ? (
              <button
                type="button"
                className="secondary-button"
                onClick={goBack}
                disabled={submitting}
              >
                Indietro
              </button>
            ) : (
              <span />
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={submitting}
            >
              {submitting
                ? 'Creazione…'
                : step === 3
                  ? 'Crea la Lifeform'
                  : 'Continua'}
            </button>
          </footer>
        </form>
      </section>
    </main>
  )
}