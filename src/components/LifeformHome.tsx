import type {
  Lifeform,
  Profile,
  SupportedLanguage,
} from '../types/lifeform'

type LifeformHomeProps = {
  profile: Profile
  lifeform: Lifeform
  signingOut: boolean
  onSignOut: () => Promise<void>
}

const LANGUAGE_LABELS: Record<
  SupportedLanguage,
  string
> = {
  it: 'Italiano',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
}

export function LifeformHome({
  profile,
  lifeform,
  signingOut,
  onSignOut,
}: LifeformHomeProps) {
  return (
    <main className="app-shell">
      <section className="lifeform-home">
        <header className="lifeform-home-header">
          <div>
            <p className="eyebrow">Connessione attiva</p>
            <h1>{lifeform.name}</h1>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() => void onSignOut()}
            disabled={signingOut}
          >
            {signingOut ? 'Disconnessione…' : 'Esci'}
          </button>
        </header>

        <div className="lifeform-home-content">
          <section className="lifeform-visual-panel">
            <div className="lifeform-placeholder">
              <span />
            </div>

            <p className="emotion-label">
              {lifeform.current_emotion}
            </p>

            <p className="emotion-intensity">
              Intensità: {lifeform.emotion_intensity}
            </p>
          </section>

          <section className="lifeform-status-panel">
            <p className="eyebrow">Prima attivazione completata</p>

            <h2>
              Ciao {profile.display_name ?? 'utente'}.
            </h2>

            <p>
              La Lifeform è stata salvata correttamente nel
              database. Nel prossimo passaggio costruiremo la chat
              e collegheremo Gemini.
            </p>

            <dl className="lifeform-details">
              <div>
                <dt>Nome</dt>
                <dd>{lifeform.name}</dd>
              </div>

              <div>
                <dt>Lingua</dt>
                <dd>{LANGUAGE_LABELS[lifeform.language]}</dd>
              </div>

              <div>
                <dt>Emozione</dt>
                <dd>{lifeform.current_emotion}</dd>
              </div>

              <div>
                <dt>Lifeform ID</dt>
                <dd>{lifeform.id}</dd>
              </div>
            </dl>
          </section>
        </div>
      </section>
    </main>
  )
}