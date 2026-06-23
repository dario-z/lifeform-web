export const SUPPORTED_LANGUAGES = [
'it',
'en',
'fr',
'de',
'es',
] as const

export type SupportedLanguage =
(typeof SUPPORTED_LANGUAGES)[number]

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
}
