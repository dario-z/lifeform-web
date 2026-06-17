import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
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

  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)

  useEffect(() => {
    let active = true

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession()

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
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setInitializing(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setPassword('')
    setFeedback(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

    setSubmitting(true)
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
            text: 'Account creato. Controlla eventualmente la tua email.',
          })
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
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
      setSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    setSubmitting(true)
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
      setSubmitting(false)
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

  if (session) {
    return (
      <main className="app-shell">
        <section className="authenticated-card">
          <div className="status-orb">
            <span />
          </div>

          <p className="eyebrow">Connessione stabilita</p>

          <h1>Autenticazione riuscita</h1>

          <p className="authenticated-description">
            Il tuo account è collegato correttamente a Supabase. Nel prossimo
            passaggio creeremo la Lifeform associata a questo utente.
          </p>

          <dl className="account-details">
            <div>
              <dt>Email</dt>
              <dd>{session.user.email ?? 'Non disponibile'}</dd>
            </div>

            <div>
              <dt>User ID</dt>
              <dd>{session.user.id}</dd>
            </div>
          </dl>

          {feedback && (
            <p className={`feedback feedback-${feedback.type}`}>
              {feedback.text}
            </p>
          )}

          <button
            className="secondary-button"
            type="button"
            onClick={handleSignOut}
            disabled={submitting}
          >
            {submitting ? 'Disconnessione…' : 'Esci'}
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <section className="auth-layout">
        <div className="intro-panel">
          <div className="avatar-placeholder" aria-hidden="true">
            <span />
          </div>

          <p className="eyebrow">Project Lifeform</p>

          <h1>Give your AI a presence.</h1>

          <p>
            Un’identità visiva e relazionale applicata al modello IA scelto
            dall’utente.
          </p>
        </div>

        <div className="auth-panel">
          <div className="auth-tabs" aria-label="Tipo di accesso">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => changeMode('login')}
            >
              Accedi
            </button>

            <button
              type="button"
              className={mode === 'register' ? 'active' : ''}
              onClick={() => changeMode('register')}
            >
              Registrati
            </button>
          </div>

          <div className="auth-heading">
            <p className="eyebrow">
              {mode === 'login' ? 'Bentornato' : 'Nuova connessione'}
            </p>

            <h2>
              {mode === 'login'
                ? 'Accedi alla tua Lifeform'
                : 'Crea il tuo account'}
            </h2>

            <p>
              {mode === 'login'
                ? 'Riprendi la tua unica sessione personale.'
                : 'Ogni account potrà essere associato a una sola Lifeform.'}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>

            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="nome@esempio.com"
              disabled={submitting}
              required
            />

            <label htmlFor="password">Password</label>

            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={
                mode === 'register' ? 'new-password' : 'current-password'
              }
              placeholder="Almeno 8 caratteri"
              minLength={8}
              disabled={submitting}
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
              disabled={submitting}
            >
              {submitting
                ? 'Attendi…'
                : mode === 'login'
                  ? 'Accedi'
                  : 'Crea account'}
            </button>
          </form>

          <p className="temporary-note">
            Versione di sviluppo: la conferma dell’indirizzo email è
            temporaneamente disattivata.
          </p>
        </div>
      </section>
    </main>
  )
}

export default App