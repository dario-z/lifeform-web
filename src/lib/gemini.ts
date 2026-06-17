import {
  GoogleGenAI,
  type Content,
} from '@google/genai'

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'

const SESSION_STORAGE_KEY =
  'lifeform.gemini-api-key.session'

const LOCAL_STORAGE_KEY =
  'lifeform.gemini-api-key.local'

export type GeminiHistoryMessage = {
  role: 'user' | 'assistant'
  content: string
}

export function getStoredGeminiApiKey(): string {
  return (
    sessionStorage.getItem(SESSION_STORAGE_KEY) ??
    localStorage.getItem(LOCAL_STORAGE_KEY) ??
    ''
  )
}

export function saveGeminiApiKey(
  apiKey: string,
  rememberOnDevice: boolean,
): void {
  clearGeminiApiKey()

  if (rememberOnDevice) {
    localStorage.setItem(LOCAL_STORAGE_KEY, apiKey)
  } else {
    sessionStorage.setItem(SESSION_STORAGE_KEY, apiKey)
  }
}

export function clearGeminiApiKey(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY)
  localStorage.removeItem(LOCAL_STORAGE_KEY)
}

export async function verifyGeminiApiKey(
  apiKey: string,
): Promise<void> {
  const client = new GoogleGenAI({
    apiKey,
  })

  const response = await client.models.generateContent({
    model: DEFAULT_GEMINI_MODEL,
    contents:
      'This is a connection test. Reply with exactly the word OK.',
  })

  const responseText = response.text?.trim()

  if (!responseText) {
    throw new Error(
      'Gemini ha risposto senza restituire alcun testo.',
    )
  }
}

function buildGeminiContents(
  messages: GeminiHistoryMessage[],
): Content[] {
  const normalized: Array<{
    role: 'user' | 'model'
    text: string
  }> = []

  for (const message of messages) {
    const cleanText = message.content.trim()

    if (!cleanText) {
      continue
    }

    const role =
      message.role === 'assistant' ? 'model' : 'user'

    const previous = normalized.at(-1)

    if (previous?.role === role) {
      previous.text = `${previous.text}\n\n${cleanText}`
      continue
    }

    normalized.push({
      role,
      text: cleanText,
    })
  }

  while (normalized[0]?.role === 'model') {
    normalized.shift()
  }

  return normalized.map((message) => ({
    role: message.role,
    parts: [
      {
        text: message.text,
      },
    ],
  }))
}

type StreamGeminiReplyOptions = {
  apiKey: string
  history: GeminiHistoryMessage[]
  prompt: string
  systemInstruction: string
  onText: (completeText: string) => void
}

export async function streamGeminiReply({
  apiKey,
  history,
  prompt,
  systemInstruction,
  onText,
}: StreamGeminiReplyOptions): Promise<string> {
  const client = new GoogleGenAI({
    apiKey,
  })

  const contents = buildGeminiContents([
    ...history,
    {
      role: 'user',
      content: prompt,
    },
  ])

  const stream =
    await client.models.generateContentStream({
      model: DEFAULT_GEMINI_MODEL,
      contents,
      config: {
        systemInstruction,
        maxOutputTokens: 4096,
      },
    })

  let completeText = ''

  for await (const chunk of stream) {
    const chunkText = chunk.text ?? ''

    if (!chunkText) {
      continue
    }

    completeText += chunkText
    onText(completeText)
  }

  const cleanResponse = completeText.trim()

  if (!cleanResponse) {
    throw new Error(
      'Gemini non ha restituito una risposta testuale.',
    )
  }

  return cleanResponse
}