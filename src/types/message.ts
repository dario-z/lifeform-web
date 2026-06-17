export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  user_id: string
  lifeform_id: string
  role: MessageRole
  content: string
  metadata: Record<string, unknown>
  created_at: string
}