export const CURIOSITY_TOPICS = [
  'life_phase',
  'interests',
  'work',
  'creative_practice',
  'relationships',
  'likes_dislikes',
  'routine',
  'challenges',
  'short_term_hopes',
  'long_term_hopes',
] as const

export type CuriosityTopic =
  (typeof CURIOSITY_TOPICS)[number]

export const CURIOSITY_QUESTION_STATUSES = [
  'asked',
  'answered',
  'skipped',
  'expired',
] as const

export type CuriosityQuestionStatus =
  (typeof CURIOSITY_QUESTION_STATUSES)[number]

export type LifeformCuriosityQuestion = {
  id: string
  user_id: string
  lifeform_id: string
  local_date: string
  topic: CuriosityTopic
  question: string
  status: CuriosityQuestionStatus
  asked_at: string
  answered_at: string | null
  assistant_message_id: string | null
  answer_message_id: string | null
  created_at: string
  updated_at: string
}
