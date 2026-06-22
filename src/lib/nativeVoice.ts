export const VOICE_LANGUAGES = [
  'it',
  'en',
  'fr',
  'de',
  'es',
  'ja',
] as const

export type VoiceLanguage =
  (typeof VOICE_LANGUAGES)[number]

export const VOICE_GENDER_PREFERENCES = [
  'female',
  'male',
] as const

export type VoiceGenderPreference =
  (typeof VOICE_GENDER_PREFERENCES)[number]

export type NativeVoiceSettings = {
  voiceEnabled: boolean
  voiceLanguage: VoiceLanguage
  voiceGenderPreference: VoiceGenderPreference
  voiceURI: string
  voiceName: string
  voiceLang: string
}

export const DEFAULT_NATIVE_VOICE_SETTINGS: NativeVoiceSettings =
  {
    voiceEnabled: false,
    voiceLanguage: 'it',
    voiceGenderPreference: 'female',
    voiceURI: '',
    voiceName: '',
    voiceLang: '',
  }

export const VOICE_LANGUAGE_LABELS: Record<
  VoiceLanguage,
  string
> = {
  it: 'Italiano',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  ja: '日本語',
}

export const VOICE_TEST_PHRASES: Record<
  VoiceLanguage,
  string
> = {
  it: 'Ciao. Questa è la voce della tua Lifeform.',
  en: "Hello. This is your Lifeform's voice.",
  fr: 'Bonjour. Voici la voix de votre Lifeform.',
  de: 'Hallo. Dies ist die Stimme deiner Lifeform.',
  es: 'Hola. Esta es la voz de tu Lifeform.',
  ja: 'こんにちは。これはあなたのライフフォームの声です。',
}

const NATIVE_VOICE_STORAGE_PREFIX =
  'lifeform.native-voice.'

const FEMALE_VOICE_NAME_HINTS = [
  'female',
  'alice',
  'amelie',
  'anna',
  'aria',
  'audrey',
  'ava',
  'ayumi',
  'catherine',
  'denise',
  'elsa',
  'emma',
  'federica',
  'fiona',
  'haruka',
  'hazel',
  'hedda',
  'helena',
  'hortense',
  'isabella',
  'joanna',
  'julie',
  'karen',
  'katja',
  'kendra',
  'kimberly',
  'kyoko',
  'laura',
  'linda',
  'marlene',
  'michelle',
  'moira',
  'monica',
  'nanami',
  'olivia',
  'paulina',
  'sabina',
  'salli',
  'samantha',
  'susan',
  'sylvie',
  'tessa',
  'victoria',
  'zira',
]

const MALE_VOICE_NAME_HINTS = [
  'male',
  'alex',
  'conrad',
  'daniel',
  'david',
  'diego',
  'enrique',
  'fred',
  'george',
  'guy',
  'hans',
  'henri',
  'ichiro',
  'jorge',
  'keita',
  'klaus',
  'luca',
  'mark',
  'markus',
  'nicolas',
  'otoya',
  'pablo',
  'paul',
  'ralph',
  'stefan',
  'thomas',
  'tom',
]

function getStorageKey(
  lifeformId: string,
): string {
  return (
    NATIVE_VOICE_STORAGE_PREFIX +
    lifeformId
  )
}

function isVoiceLanguage(
  value: unknown,
): value is VoiceLanguage {
  return (
    typeof value === 'string' &&
    VOICE_LANGUAGES.includes(
      value as VoiceLanguage,
    )
  )
}

function isVoiceGenderPreference(
  value: unknown,
): value is VoiceGenderPreference {
  return (
    typeof value === 'string' &&
    VOICE_GENDER_PREFERENCES.includes(
      value as VoiceGenderPreference,
    )
  )
}

export function normalizeVoiceLanguage(
  value: unknown,
  fallback: VoiceLanguage = DEFAULT_NATIVE_VOICE_SETTINGS.voiceLanguage,
): VoiceLanguage {
  return isVoiceLanguage(value)
    ? value
    : fallback
}

export function normalizeVoiceGenderPreference(
  value: unknown,
): VoiceGenderPreference {
  return isVoiceGenderPreference(value)
    ? value
    : DEFAULT_NATIVE_VOICE_SETTINGS.voiceGenderPreference
}

export function normalizeNativeVoiceSettings(
  value: Partial<NativeVoiceSettings> & {
    mode?: unknown
    gender?: unknown
    voiceUri?: unknown
  },
  fallbackLanguage: VoiceLanguage = DEFAULT_NATIVE_VOICE_SETTINGS.voiceLanguage,
): NativeVoiceSettings {
  const storedMode =
    typeof value.mode === 'string'
      ? value.mode
      : null

  return {
    voiceEnabled:
      typeof value.voiceEnabled === 'boolean'
        ? value.voiceEnabled
        : storedMode
          ? storedMode !== 'off'
          : DEFAULT_NATIVE_VOICE_SETTINGS.voiceEnabled,
    voiceLanguage: normalizeVoiceLanguage(
      value.voiceLanguage,
      fallbackLanguage,
    ),
    voiceGenderPreference:
      normalizeVoiceGenderPreference(
        value.voiceGenderPreference ??
          value.gender,
      ),
    voiceURI:
      typeof value.voiceURI === 'string'
        ? value.voiceURI
        : typeof value.voiceUri === 'string'
          ? value.voiceUri
          : '',
    voiceName:
      typeof value.voiceName === 'string'
        ? value.voiceName
        : '',
    voiceLang:
      typeof value.voiceLang === 'string'
        ? value.voiceLang
        : '',
  }
}

export function loadNativeVoiceSettings(
  lifeformId: string,
  fallbackLanguage?: string,
): NativeVoiceSettings {
  const normalizedFallbackLanguage =
    normalizeVoiceLanguage(fallbackLanguage)

  if (typeof window === 'undefined') {
    return {
      ...DEFAULT_NATIVE_VOICE_SETTINGS,
      voiceLanguage:
        normalizedFallbackLanguage,
    }
  }

  try {
    const stored = window.localStorage.getItem(
      getStorageKey(lifeformId),
    )

    if (!stored) {
      return {
        ...DEFAULT_NATIVE_VOICE_SETTINGS,
        voiceLanguage:
          normalizedFallbackLanguage,
      }
    }

    return normalizeNativeVoiceSettings(
      JSON.parse(stored) as Partial<NativeVoiceSettings>,
      normalizedFallbackLanguage,
    )
  } catch {
    return {
      ...DEFAULT_NATIVE_VOICE_SETTINGS,
      voiceLanguage:
        normalizedFallbackLanguage,
    }
  }
}

export function saveNativeVoiceSettings(
  lifeformId: string,
  settings: NativeVoiceSettings,
): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      getStorageKey(lifeformId),
      JSON.stringify(
        normalizeNativeVoiceSettings(
          settings,
          settings.voiceLanguage,
        ),
      ),
    )
  } catch {
    // Voice preferences are optional local UI state.
  }
}

export function isNativeVoiceSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  )
}

function getSpeechSynthesis(): SpeechSynthesis | null {
  if (!isNativeVoiceSupported()) {
    return null
  }

  return window.speechSynthesis
}

export function getNativeVoices(): SpeechSynthesisVoice[] {
  const speechSynthesis =
    getSpeechSynthesis()

  if (!speechSynthesis) {
    return []
  }

  return speechSynthesis
    .getVoices()
    .slice()
    .sort((left, right) => {
      const languageComparison =
        left.lang.localeCompare(right.lang)

      if (languageComparison !== 0) {
        return languageComparison
      }

      return left.name.localeCompare(right.name)
    })
}

export function getCompatibleNativeVoices(
  language: VoiceLanguage,
  voices: SpeechSynthesisVoice[] = getNativeVoices(),
): SpeechSynthesisVoice[] {
  const prefix =
    language.toLocaleLowerCase()

  return voices.filter((voice) =>
    voice.lang
      .toLocaleLowerCase()
      .startsWith(prefix),
  )
}

export function subscribeToNativeVoiceChanges(
  listener: () => void,
): () => void {
  const speechSynthesis =
    getSpeechSynthesis()

  if (!speechSynthesis) {
    return () => undefined
  }

  const previousHandler =
    speechSynthesis.onvoiceschanged

  speechSynthesis.onvoiceschanged = (event) => {
    if (typeof previousHandler === 'function') {
      previousHandler.call(
        speechSynthesis,
        event,
      )
    }

    listener()
  }

  return () => {
    speechSynthesis.onvoiceschanged =
      previousHandler
  }
}

function hasNameHint(
  name: string,
  hints: string[],
): boolean {
  const normalizedName =
    name.toLocaleLowerCase()

  return hints.some((hint) => {
    const pattern = new RegExp(
      '(^|[^a-z])' +
        hint.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&',
        ) +
        '($|[^a-z])',
      'i',
    )

    return pattern.test(normalizedName)
  })
}

export function detectVoiceGenderPreference(
  voice: SpeechSynthesisVoice,
): VoiceGenderPreference | null {
  const female =
    hasNameHint(
      voice.name,
      FEMALE_VOICE_NAME_HINTS,
    )
  const male =
    hasNameHint(
      voice.name,
      MALE_VOICE_NAME_HINTS,
    )

  if (female === male) {
    return null
  }

  return female ? 'female' : 'male'
}

function getPreferredVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  return (
    voices.find((voice) => voice.default) ??
    voices[0] ??
    null
  )
}

export function chooseNativeVoice(
  voices: SpeechSynthesisVoice[],
  settings: NativeVoiceSettings,
): SpeechSynthesisVoice | null {
  const compatibleVoices =
    getCompatibleNativeVoices(
      settings.voiceLanguage,
      voices,
    )

  if (compatibleVoices.length === 0) {
    return null
  }

  const preferredVoices =
    compatibleVoices.filter(
      (voice) =>
        detectVoiceGenderPreference(
          voice,
        ) ===
        settings.voiceGenderPreference,
    )

  const savedVoice =
    compatibleVoices.find(
      (voice) =>
        voice.voiceURI === settings.voiceURI,
    ) ?? null
  const savedVoiceGender = savedVoice
    ? detectVoiceGenderPreference(
        savedVoice,
      )
    : null

  if (
    savedVoice &&
    (savedVoiceGender ===
      settings.voiceGenderPreference ||
      (preferredVoices.length === 0 &&
        savedVoiceGender !== null))
  ) {
    return savedVoice
  }

  const preferredVoice =
    getPreferredVoice(preferredVoices)

  if (preferredVoice) {
    return preferredVoice
  }

  const otherProfileVoices =
    compatibleVoices.filter((voice) => {
      const detectedGender =
        detectVoiceGenderPreference(voice)

      return (
        detectedGender !== null &&
        detectedGender !==
          settings.voiceGenderPreference
      )
    })

  return getPreferredVoice(
    otherProfileVoices,
  )
}

export function createVoiceSettingsForVoice(
  settings: NativeVoiceSettings,
  voice: SpeechSynthesisVoice | null,
): NativeVoiceSettings {
  return {
    ...settings,
    voiceURI: voice?.voiceURI ?? '',
    voiceName: voice?.name ?? '',
    voiceLang: voice?.lang ?? '',
  }
}

export function getVoiceEnabledLabel(
  voiceEnabled: boolean,
): string {
  return voiceEnabled ? 'On' : 'Off'
}

export function getVoiceGenderPreferenceLabel(
  preference: VoiceGenderPreference,
): string {
  return preference === 'female'
    ? 'Female'
    : 'Male'
}

export function stopNativeVoice(): void {
  const speechSynthesis =
    getSpeechSynthesis()

  speechSynthesis?.cancel()
}

type SpeakNativeVoiceOptions = {
  text: string
  settings: NativeVoiceSettings
  onStart?: () => void
  onEnd?: () => void
  onError?: (message: string) => void
}

export function speakNativeVoice(
  options: SpeakNativeVoiceOptions,
): boolean {
  const speechSynthesis =
    getSpeechSynthesis()

  const text = options.text.trim()

  if (!speechSynthesis || !text) {
    return false
  }

  const voice = chooseNativeVoice(
    getNativeVoices(),
    options.settings,
  )

  if (!voice) {
    return false
  }

  const utterance =
    new SpeechSynthesisUtterance(text)

  utterance.voice = voice
  utterance.lang = voice.lang

  utterance.onstart = () => {
    options.onStart?.()
  }

  utterance.onend = () => {
    options.onEnd?.()
  }

  utterance.onerror = (event) => {
    const reason = event.error

    if (
      reason === 'interrupted' ||
      reason === 'canceled'
    ) {
      return
    }

    options.onError?.(
      'Voice playback failed: ' + reason,
    )
  }

  try {
    speechSynthesis.cancel()
    speechSynthesis.speak(utterance)
    return true
  } catch {
    options.onError?.(
      'Voice playback is not available in this browser.',
    )
    return false
  }
}
