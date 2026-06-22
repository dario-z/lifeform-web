export const VOICE_MODES = [
  'off',
  'manual',
  'auto',
] as const

export type VoiceMode =
  (typeof VOICE_MODES)[number]

export type NativeVoiceSettings = {
  mode: VoiceMode
  voiceUri: string
  rate: number
}

export const DEFAULT_NATIVE_VOICE_SETTINGS: NativeVoiceSettings =
  {
    mode: 'manual',
    voiceUri: '',
    rate: 0.95,
  }

const MIN_VOICE_RATE = 0.85
const MAX_VOICE_RATE = 1.15
const VOICE_RATE_STEP = 0.05
const NATIVE_VOICE_STORAGE_PREFIX =
  'lifeform.native-voice.'

function getStorageKey(
  lifeformId: string,
): string {
  return (
    NATIVE_VOICE_STORAGE_PREFIX +
    lifeformId
  )
}

function isVoiceMode(
  value: unknown,
): value is VoiceMode {
  return (
    typeof value === 'string' &&
    VOICE_MODES.includes(
      value as VoiceMode,
    )
  )
}

export function normalizeVoiceRate(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_NATIVE_VOICE_SETTINGS.rate
  }

  const clamped = Math.min(
    MAX_VOICE_RATE,
    Math.max(MIN_VOICE_RATE, value),
  )

  return Math.round(
    clamped / VOICE_RATE_STEP,
  ) * VOICE_RATE_STEP
}

export function normalizeNativeVoiceSettings(
  value: Partial<NativeVoiceSettings>,
): NativeVoiceSettings {
  return {
    mode: isVoiceMode(value.mode)
      ? value.mode
      : DEFAULT_NATIVE_VOICE_SETTINGS.mode,
    voiceUri:
      typeof value.voiceUri === 'string'
        ? value.voiceUri
        : '',
    rate: normalizeVoiceRate(
      typeof value.rate === 'number'
        ? value.rate
        : DEFAULT_NATIVE_VOICE_SETTINGS.rate,
    ),
  }
}

export function loadNativeVoiceSettings(
  lifeformId: string,
): NativeVoiceSettings {
  if (typeof window === 'undefined') {
    return {
      ...DEFAULT_NATIVE_VOICE_SETTINGS,
    }
  }

  try {
    const stored = window.localStorage.getItem(
      getStorageKey(lifeformId),
    )

    if (!stored) {
      return {
        ...DEFAULT_NATIVE_VOICE_SETTINGS,
      }
    }

    return normalizeNativeVoiceSettings(
      JSON.parse(stored) as Partial<NativeVoiceSettings>,
    )
  } catch {
    return {
      ...DEFAULT_NATIVE_VOICE_SETTINGS,
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

export function getSpeechLanguageTag(
  language: string,
): string {
  const languageTags: Record<string, string> = {
    it: 'it-IT',
    en: 'en-US',
    fr: 'fr-FR',
    de: 'de-DE',
    es: 'es-ES',
  }

  return (
    languageTags[language] ??
    languageTags.en
  )
}

function getLanguagePrefix(
  language: string,
): string {
  return getSpeechLanguageTag(language)
    .split('-')[0]
    .toLocaleLowerCase()
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
  language: string,
): SpeechSynthesisVoice[] {
  const prefix =
    getLanguagePrefix(language)

  return getNativeVoices().filter(
    (voice) =>
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

  speechSynthesis.addEventListener(
    'voiceschanged',
    listener,
  )

  return () => {
    speechSynthesis.removeEventListener(
      'voiceschanged',
      listener,
    )
  }
}

export function getVoiceModeLabel(
  mode: VoiceMode,
): string {
  const labels: Record<VoiceMode, string> = {
    off: 'Off',
    manual: 'Manual',
    auto: 'Auto',
  }

  return labels[mode]
}

function chooseVoice(options: {
  language: string
  voiceUri: string
}): SpeechSynthesisVoice | null {
  const {
    language,
    voiceUri,
  } = options

  const compatibleVoices =
    getCompatibleNativeVoices(language)

  if (compatibleVoices.length === 0) {
    return null
  }

  return (
    compatibleVoices.find(
      (voice) =>
        voice.voiceURI === voiceUri,
    ) ??
    compatibleVoices.find(
      (voice) => voice.default,
    ) ??
    compatibleVoices[0]
  )
}

export function stopNativeVoice(): void {
  const speechSynthesis =
    getSpeechSynthesis()

  speechSynthesis?.cancel()
}

type SpeakNativeVoiceOptions = {
  text: string
  language: string
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

  const utterance =
    new SpeechSynthesisUtterance(text)

  utterance.lang = getSpeechLanguageTag(
    options.language,
  )
  utterance.rate = normalizeVoiceRate(
    options.settings.rate,
  )

  const voice = chooseVoice({
    language: options.language,
    voiceUri: options.settings.voiceUri,
  })

  if (voice) {
    utterance.voice = voice
  }

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
