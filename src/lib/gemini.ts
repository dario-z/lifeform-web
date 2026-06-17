import { GoogleGenAI } from '@google/genai'

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'

const SESSION_STORAGE_KEY =
  'lifeform.gemini-api-key.session'

const LOCAL_STORAGE_KEY =
  'lifeform.gemini-api-key.local'

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