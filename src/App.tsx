import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { GeminiGate } from './components/GeminiGate'
import { LifeformOnboarding } from './components/LifeformOnboarding'
import { supabase } from './lib/supabase'
import type {
  Lifeform,
  OnboardingData,
  Profile,
} from './types/lifeform'
import './App.css'

type AuthMode = 'login' | 'register'

type Feedback = {
  type: 'success' | 'error'
  text: string
} | null

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Si è verificato un errore imprevisto.'
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [initializing, setInitializing] = useState(true)

  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [lifeform, setLifeform] = useState<Lifeform | null>(null)
  const [accountLoading, setAccountLoading] = useState(false)
  const [accountError, setAccountError] = useState<string | null>(
    null,
  )
  const [creatingLifeform, setCreatingLifeform] =
    useState(false)

  const loadAccountData = useCallback(
    async (activeSession: Session) => {
      setAccountLoading(true)
      setAccountError(null)

      try {
        const userId = activeSession.user.id

        const [profileResponse, lifeformResponse] =
          await Promise.all([
            supabase
              .from('profiles')
              .select(
                `
                  user_id,
                  display_name,
                  interface_language,
                  onboarding_completed,
                  created_at,
                  updated_at
                `,
              )
              .eq('user_id', userId)
              .maybeSingle(),

            supabase
              .from('lifeforms')
              .select(
                `
                  id,
                  user_id,
                  name,
                  language,
                  current_emotion,
                  previous_emotion,
                  emotion_intensity,
                  emotional_sensitivities,
                  last_seen_at,
                  created_at,
                  updated_at
                `,
              )
              .eq('user_id', userId)
              .maybeSingle(),
          ])

        if (profileResponse.error) {
          throw profileResponse.error
        }

        if (lifeformResponse.error) {
          throw lifeformResponse.error
        }

        if (!profileResponse.data) {
          throw new Error(
            'Il profilo dell’utente non è stato trovato.',
          )
        }

        setProfile(profileResponse.data as Profile)
        setLifeform(
          lifeformResponse.data
            ? (lifeformResponse.data as Lifeform)
            : null,
        )
      } catch (error: unknown) {
        setAccountError(getErrorMessage(error))
        setProfile(null)
        setLifeform(null)
      } finally {
        setAccountLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    let active = true

    const loadSession = async () => {
      const { data, error } =
        await supabase.auth.getSession()

      if (!active) {
        return
      }

      if (error) {
        setFeedback({
          type: 'error',
          text: error.message,
        })
      }

      setSession(data.session)
      setInitializing(false)
    }

    void loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession)
        setInitializing(false)
      },
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session) {
      setProfile(null)
      setLifeform(null)
      setAccountError(null)
      setAccountLoading(false)
      return
    }

    void loadAccountData(session)
  }, [session, loadAccountData])

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setPassword('')
    setFeedback(null)
  }

  const handleAuthSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      setFeedback({
        type: 'error',
        text: 'Inserisci un indirizzo email.',
      })
      return
    }

    if (password.length < 8) {
      setFeedback({
        type: 'error',
        text: 'La password deve contenere almeno 8 caratteri.',
      })
      return
    }

    setAuthSubmitting(true)
    setFeedback(null)

    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        })

        if (error) {
          throw error
        }

        if (!data.session) {
          setFeedback({
            type: 'success',
            text: 'Account created. Controlla eventualmente la tua email.',
          })
        }
      } else {
        const { error } =
          await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          })

        if (error) {
          throw error
        }
      }

      setPassword('')
    } catch (error: unknown) {
      setFeedback({
        type: 'error',
        text: getErrorMessage(error),
      })
    } finally {
      setAuthSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    setAuthSubmitting(true)
    setFeedback(null)

    try {
      const { error } = await supabase.auth.signOut({
        scope: 'local',
      })

      if (error) {
        throw error
      }
    } catch (error: unknown) {
      setFeedback({
        type: 'error',
        text: getErrorMessage(error),
      })
    } finally {
      setAuthSubmitting(false)
    }
  }

  const handleCreateLifeform = async (
    data: OnboardingData,
  ) => {
    if (!session) {
      setAccountError('Sessione utente non disponibile.')
      return
    }

    setCreatingLifeform(true)
    setAccountError(null)

    let createdLifeform: Lifeform | null = null

    try {
      const { data: insertedData, error: insertError } =
        await supabase
          .from('lifeforms')
          .insert({
            user_id: session.user.id,
            name: data.lifeformName,
            language: data.language,
          })
          .select()
          .single()

      if (insertError) {
        throw insertError
      }

      if (!insertedData) {
        throw new Error(
          'La Lifeform è stata creata ma non restituita dal database.',
        )
      }

      createdLifeform = insertedData as Lifeform

      const { data: updatedProfile, error: profileError } =
        await supabase
          .from('profiles')
          .update({
            display_name: data.displayName,
            interface_language: data.language,
            onboarding_completed: true,
          })
          .eq('user_id', session.user.id)
          .select()
          .single()

      if (profileError) {
        await supabase
          .from('lifeforms')
          .delete()
          .eq('id', createdLifeform.id)

        throw profileError
      }

      if (!updatedProfile) {
        throw new Error(
          'Il profilo aggiornato non è stato restituito.',
        )
      }

      setProfile(updatedProfile as Profile)
      setLifeform(createdLifeform)
    } catch (error: unknown) {
      setAccountError(getErrorMessage(error))
    } finally {
      setCreatingLifeform(false)
    }
  }

  if (initializing) {
    return (
      <main className="app-shell">
        <section className="loading-card" aria-live="polite">
          <div className="loading-orb" />
          <p>Inizializzazione…</p>
        </section>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="app-shell">
        <section className="auth-layout">
          <div className="intro-panel">
            <div
              className="avatar-placeholder"
              aria-hidden="true"
            >
              <span />
            </div>

            <p className="eyebrow"></p>

            <h1>Give your AI a presence.</h1>

            <p>
              Un’identità visiva e relazionale applicata al
              modello IA scelto dall’utente.
            </p>
          </div>

          <div className="auth-panel">
            <div
              className="auth-tabs"
              aria-label="Tipo di accesso"
            >
              <button
                type="button"
                className={mode === 'login' ? 'active' : ''}
                onClick={() => changeMode('login')}
              >
                Sign in
              </button>

              <button
                type="button"
                className={
                  mode === 'register' ? 'active' : ''
                }
                onClick={() => changeMode('register')}
              >
                Register
              </button>
            </div>

            <div className="auth-heading">
              <p className="eyebrow">
                {mode === 'login'
                  ? 'Welcome back'
                  : 'Nuova connessione'}
              </p>

              <h2>
                {mode === 'login'
                  ? 'Sign in alla tua Lifeform'
                  : 'Crea il tuo account'}
              </h2>

              <p>
                {mode === 'login'
                  ? 'Resume your unique personal session.'
                  : 'Ogni account potrà essere associato a una sola Lifeform.'}
              </p>
            </div>

            <form
              className="auth-form"
              onSubmit={handleAuthSubmit}
            >
              <label htmlFor="email">Email</label>

              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="email"
                placeholder="nome@esempio.com"
                disabled={authSubmitting}
                required
              />

              <label htmlFor="password">Password</label>

              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete={
                  mode === 'register'
                    ? 'new-password'
                    : 'current-password'
                }
                placeholder="Almeno 8 caratteri"
                minLength={8}
                disabled={authSubmitting}
                required
              />

              {feedback && (
                <p
                  className={`feedback feedback-${feedback.type}`}
                  aria-live="polite"
                >
                  {feedback.text}
                </p>
              )}

              <button
                className="primary-button"
                type="submit"
                disabled={authSubmitting}
              >
                {authSubmitting
                  ? 'Attendi…'
                  : mode === 'login'
                    ? 'Sign in'
                    : 'Create account'}
              </button>
            </form>

            <p className="temporary-note">
              Versione di sviluppo: la conferma
              dell’indirizzo email è temporaneamente
              disattivata.
            </p>
          </div>
        </section>
      </main>
    )
  }

  if (accountLoading) {
    return (
      <main className="app-shell">
        <section className="loading-card" aria-live="polite">
          <div className="loading-orb" />
          <p>Recupero della Lifeform…</p>
        </section>
      </main>
    )
  }

  if (accountError && !profile) {
    return (
      <main className="app-shell">
        <section className="authenticated-card">
          <p className="eyebrow">Errore di connessione</p>
          <h1>Dati non disponibili</h1>

          <p className="feedback feedback-error">
            {accountError}
          </p>

          <div className="error-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => void loadAccountData(session)}
            >
              Riprova
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => void handleSignOut()}
            >
              Sign out
            </button>
          </div>
        </section>
      </main>
    )
  }

  if (!profile) {
    return null
  }

  if (!lifeform) {
    return (
      <LifeformOnboarding
        userEmail={session.user.email ?? 'Email non disponibile'}
        submitting={creatingLifeform || authSubmitting}
        serverError={accountError}
        onCreate={handleCreateLifeform}
        onSignOut={handleSignOut}
      />
    )
  }

  return (
    <GeminiGate
      profile={profile}
      lifeform={lifeform}
      signingOut={authSubmitting}
      onSignOut={handleSignOut}
    />
  )
}

export default App