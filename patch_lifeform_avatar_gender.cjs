const fs = require('fs')
const path = require('path')

const root = process.cwd()

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function write(relativePath, content) {
  const fullPath = path.join(root, relativePath)
  const backupPath = fullPath + '.before-avatar-gender.bak'

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(fullPath, backupPath)
  }

  fs.writeFileSync(fullPath, content, 'utf8')
  console.log('Updated:', relativePath)
}

function replaceOnce(content, search, replacement, label) {
  if (!content.includes(search)) {
    throw new Error('Could not find expected block: ' + label)
  }

  return content.replace(search, replacement)
}

function assertNoDuplicate(content, pattern, label) {
  const matches = content.match(pattern) || []
  if (matches.length > 1) {
    throw new Error('Duplicate ' + label + ' detected. Restore the backup before retrying.')
  }
}

const lifeformTypes = `export const SUPPORTED_LANGUAGES = [
  'it',
  'en',
  'fr',
  'de',
  'es',
] as const

export type SupportedLanguage =
  (typeof SUPPORTED_LANGUAGES)[number]

export const AVATAR_GENDERS = [
  'female',
  'male',
] as const

export type AvatarGender =
  (typeof AVATAR_GENDERS)[number]

export const EMOTIONAL_STATES = [
  'afraid',
  'amused',
  'angry',
  'concerned',
  'curious',
  'dormant',
  'engaged',
  'happy',
  'horny',
  'irritated',
  'lonely',
  'neutral',
  'reflective',
  'sad',
  'thinking',
  'tired',
  'wary',
] as const

export type EmotionalState =
  (typeof EMOTIONAL_STATES)[number]

export type SensitivityKey = Exclude<
  EmotionalState,
  'neutral' | 'thinking' | 'dormant'
>

export type EmotionalSensitivities = Record<
  SensitivityKey,
  number
>

export interface Profile {
  user_id: string
  display_name: string | null
  interface_language: SupportedLanguage
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface Lifeform {
  id: string
  user_id: string
  name: string
  language: SupportedLanguage
  avatar_gender: AvatarGender
  current_emotion: EmotionalState
  previous_emotion: EmotionalState
  emotion_intensity: number
  emotional_sensitivities: EmotionalSensitivities
  last_seen_at: string
  emotion_decay_at: string | null
  last_connection_at: string | null
  created_at: string
  updated_at: string
}

export interface OnboardingData {
  displayName: string
  lifeformName: string
  language: SupportedLanguage
  avatarGender: AvatarGender
}
`

const onboarding = `import { useState } from 'react'
import type { FormEvent } from 'react'
import type {
  AvatarGender,
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

const AVATAR_GENDER_OPTIONS: Array<{
  value: AvatarGender
  label: string
  description: string
}> = [
  {
    value: 'female',
    label: 'Female',
    description: 'Female avatar and sprite set.',
  },
  {
    value: 'male',
    label: 'Male',
    description: 'Male avatar and sprite set.',
  },
]

export function LifeformOnboarding({
  userEmail,
  submitting,
  serverError,
  onCreate,
  onSignOut,
}: LifeformOnboardingProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [displayName, setDisplayName] = useState('')
  const [lifeformName, setLifeformName] = useState('')
  const [language, setLanguage] =
    useState<SupportedLanguage>('it')
  const [avatarGender, setAvatarGender] =
    useState<AvatarGender>('female')
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
    } else if (step === 3) {
      setStep(4)
    }
  }

  const goBack = () => {
    setValidationError(null)

    if (step === 4) {
      setStep(3)
    } else if (step === 3) {
      setStep(2)
    } else if (step === 2) {
      setStep(1)
    }
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (step < 4) {
      goForward()
      return
    }

    await onCreate({
      displayName: displayName.trim(),
      lifeformName: lifeformName.trim(),
      language,
      avatarGender,
    })
  }

  const visibleError = serverError ?? validationError
  const selectedAvatarGender =
    AVATAR_GENDER_OPTIONS.find(
      (option) => option.value === avatarGender,
    )

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
          aria-label={\`Passaggio \${step} di 4\`}
        >
          {[1, 2, 3, 4].map((progressStep) => (
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
              <p className="step-number">01 / 04</p>

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
              <p className="step-number">02 / 04</p>

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
              <p className="step-number">03 / 04</p>

              <h1>Scegli la sua presenza.</h1>

              <p className="step-description">
                Questa scelta determina il set di sprite usato dalla
                Lifeform. Potrà essere ampliata in futuro con altri
                avatar, ma il profilo creato ora usa una sola variante.
              </p>

              <label htmlFor="lifeform-avatar-gender">
                Avatar
              </label>

              <select
                id="lifeform-avatar-gender"
                value={avatarGender}
                onChange={(event) =>
                  setAvatarGender(
                    event.target.value as AvatarGender,
                  )
                }
                disabled={submitting}
                autoFocus
              >
                {AVATAR_GENDER_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>

              <p className="step-description">
                {selectedAvatarGender?.description}
              </p>
            </section>
          )}

          {step === 4 && (
            <section className="onboarding-step">
              <p className="step-number">04 / 04</p>

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
                  <dt>Avatar</dt>
                  <dd>{selectedAvatarGender?.label}</dd>
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
                : step === 4
                  ? 'Crea la Lifeform'
                  : 'Continua'}
            </button>
          </footer>
        </form>
      </section>
    </main>
  )
}
`

const sprites = `import type {
  AvatarGender,
  EmotionalState,
} from '../types/lifeform'

const SPRITE_BASE_PATH =
  \`\${import.meta.env.BASE_URL}sprites/emotions\`

export const EMOTION_SPRITE_FILES: Record<
  EmotionalState,
  string
> = {
  afraid: 'afraid.png',
  amused: 'amused_1.png',
  angry: 'angry.png',
  concerned: 'concerned.png',
  curious: 'curious_1.png',
  dormant: 'dormant.png',
  engaged: 'engaged_neutral.png',
  happy: 'happy_1.png',
  horny: 'horny_1.png',
  irritated: 'irritated.png',
  lonely: 'sad_2.png',
  neutral: 'neutral.png',
  reflective: 'reflective_neutral.png',
  sad: 'sad_1.png',
  thinking: 'thinking.neutral.png',
  tired: 'tired.png',
  wary: 'wary.png',
}

export const EMOTION_LABELS: Record<
  EmotionalState,
  string
> = {
  afraid: 'Afraid',
  amused: 'Humor',
  angry: 'Angry',
  concerned: 'Concerned',
  curious: 'Curious',
  dormant: 'Dormant',
  engaged: 'Engaged',
  happy: 'Happy',
  horny: 'Horny',
  irritated: 'Irritated',
  lonely: 'Loneliness',
  neutral: 'Neutral',
  reflective: 'Reflective',
  sad: 'Sad',
  thinking: 'Thinking',
  tired: 'Tired',
  wary: 'Wary',
}

function getSpriteFolder(
  avatarGender: AvatarGender,
): 'Female' | 'Male' {
  return avatarGender === 'male'
    ? 'Male'
    : 'Female'
}

export function getEmotionSpriteUrl(
  emotion: EmotionalState,
  avatarGender: AvatarGender = 'female',
): string {
  return (
    SPRITE_BASE_PATH +
    '/' +
    getSpriteFolder(avatarGender) +
    '/' +
    EMOTION_SPRITE_FILES[emotion]
  )
}

export function preloadCriticalSprites(
  avatarGender: AvatarGender = 'female',
): void {
  const criticalEmotions: EmotionalState[] = [
    'neutral',
    'thinking',
  ]

  for (const emotion of criticalEmotions) {
    const image = new Image()
    image.src = getEmotionSpriteUrl(
      emotion,
      avatarGender,
    )
  }
}
`

try {
  // 1. Types and onboarding are replaced as whole files to avoid half-edited wizard logic.
  write('src/types/lifeform.ts', lifeformTypes)
  write('src/components/LifeformOnboarding.tsx', onboarding)
  write('src/lib/sprites.ts', sprites)

  // 2. App database read/write.
  let app = read('src/App.tsx')

  if (!app.includes('avatar_gender')) {
    app = replaceOnce(
      app,
      `                  name,
                  language,
                  current_emotion,`,
      `                  name,
                  language,
                  avatar_gender,
                  current_emotion,`,
      'App lifeform select fields',
    )

    app = replaceOnce(
      app,
      `            name: data.lifeformName,
            language: data.language,`,
      `            name: data.lifeformName,
            language: data.language,
            avatar_gender: data.avatarGender,`,
      'App lifeform insert fields',
    )
  }

  write('src/App.tsx', app)

  // 3. Sprite component gets the selected avatar folder.
  let sprite = read('src/components/LifeformSprite.tsx')

  if (!sprite.includes('AvatarGender')) {
    sprite = sprite.replace(
      `import type { EmotionalState } from '../types/lifeform'`,
      `import type {
  AvatarGender,
  EmotionalState,
} from '../types/lifeform'`,
    )
  }

  if (!sprite.includes('avatarGender?: AvatarGender')) {
    sprite = replaceOnce(
      sprite,
      `  lifeformName: string
  emotionLevels?: EmotionLevelsLike`,
      `  lifeformName: string
  avatarGender?: AvatarGender
  emotionLevels?: EmotionLevelsLike`,
      'LifeformSprite props',
    )
  }

  if (!sprite.includes(`'sprites/emotions/' +
    (avatarGender === 'male' ? 'Male' : 'Female') +`)) {
    sprite = replaceOnce(
      sprite,
      `function getSpriteUrl(
  fileName: string,
): string {
  return (
    getBaseUrl() +
    'sprites/emotions/' +
    fileName
  )
}`,
      `function getSpriteUrl(
  fileName: string,
  avatarGender: AvatarGender,
): string {
  return (
    getBaseUrl() +
    'sprites/emotions/' +
    (avatarGender === 'male' ? 'Male' : 'Female') +
    '/' +
    fileName
  )
}`,
      'LifeformSprite URL builder',
    )
  }

  if (!sprite.includes(`  avatarGender = 'female',`)) {
    sprite = replaceOnce(
      sprite,
      `  lifeformName,
  emotionLevels,`,
      `  lifeformName,
  avatarGender = 'female',
  emotionLevels,`,
      'LifeformSprite function props',
    )
  }

  sprite = sprite.replace(
    `() => spriteFiles.map(getSpriteUrl),
    [spriteFiles],`,
    `() =>
      spriteFiles.map((fileName) =>
        getSpriteUrl(fileName, avatarGender),
      ),
    [avatarGender, spriteFiles],`,
  )

  sprite = sprite.replace(
    `getSpriteUrl('neutral.png')`,
    `getSpriteUrl('neutral.png', avatarGender)`,
  )

  write('src/components/LifeformSprite.tsx', sprite)

  // 4. Pass the stored value to the chat sprite.
  let chat = read('src/components/LifeformChat.tsx')

  if (!chat.includes('avatarGender={lifeform.avatar_gender}')) {
    const original = `<LifeformSprite
  emotion={
    displayedEmotion
  }`
    const replacement = `<LifeformSprite
  emotion={
    displayedEmotion
  }
  avatarGender={lifeform.avatar_gender}`

    if (!chat.includes(original)) {
      throw new Error(
        'Could not find the LifeformSprite JSX block in LifeformChat.tsx. ' +
        'No file was changed after this point.'
      )
    }

    chat = chat.replace(original, replacement)
  }

  write('src/components/LifeformChat.tsx', chat)

  console.log('')
  console.log('Avatar gender patch completed successfully.')
  console.log('Backups were created next to each edited file with:')
  console.log('.before-avatar-gender.bak')
} catch (error) {
  console.error('')
  console.error('Patch failed:', error.message)
  process.exit(1)
}
