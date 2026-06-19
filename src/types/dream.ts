import type { EmotionalState } from './lifeform'

export type Dream = {
  id: string
  user_id: string
  lifeform_id: string
  dream_date: string
  title: string
  dream_text: string
  random_anchor: string
  dominant_emotion: EmotionalState
  emotion_snapshot:
    | Record<string, unknown>
    | null
  source_context:
    | Record<string, unknown>
    | null
  created_at: string
}

export type DreamGeneration = {
  title: string
  dreamText: string
  randomAnchor: string
  dominantEmotion: EmotionalState
}
