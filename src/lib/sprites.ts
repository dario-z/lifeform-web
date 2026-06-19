import type { EmotionalState } from '../types/lifeform'

const SPRITE_BASE_PATH =
  `${import.meta.env.BASE_URL}sprites/emotions`

export const EMOTION_SPRITE_FILES: Record<
  EmotionalState,
  string
> = {
  afraid: 'afraid.png',
  amused: 'Humor',
  angry: 'angry.png',
  concerned: 'concerned.png',
  curious: 'curious.png',
  dormant: 'dormant.png',
  engaged: 'engaged.png',
  happy: 'happy.png',
  horny: 'horny.png',
  irritated: 'irritated.png',
  neutral: 'neutral.png',
  reflective: 'reflective.png',
  sad: 'sad.png',
  thinking: 'thinking.png',
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
  neutral: 'Neutral',
  reflective: 'Reflective',
  sad: 'Sad',
  thinking: 'Thinking',
  tired: 'Tired',
  wary: 'Wary',
}

export function getEmotionSpriteUrl(
  emotion: EmotionalState,
): string {
  return `${SPRITE_BASE_PATH}/${EMOTION_SPRITE_FILES[emotion]}`
}

export function preloadCriticalSprites(): void {
  const criticalEmotions: EmotionalState[] = [
    'neutral',
    'thinking',
  ]

  for (const emotion of criticalEmotions) {
    const image = new Image()
    image.src = getEmotionSpriteUrl(emotion)
  }
}