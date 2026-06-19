import {
  GoogleGenAI,
  type Content,
} from '@google/genai'

export const GEMINI_MODEL_OPTIONS = [
  {
    id: 'gemini-flash-lite-latest',
    label: 'Gemini Flash-Lite Latest',
    note: 'Default and recommended',
  },
  {
    id: 'gemini-3.1-flash-lite',
    label: 'Gemini 3.1 Flash-Lite',
    note: 'Current stable version',
  },
  {
    id: 'gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash-Lite',
    note: 'Previous stable version',
  },
] as const

export type GeminiModelId =
  (typeof GEMINI_MODEL_OPTIONS)[number]['id']

export const DEFAULT_GEMINI_MODEL:
  GeminiModelId = 'gemini-flash-lite-latest'

export const DEFAULT_DAILY_TOKEN_LIMIT = 200000
export const MIN_DAILY_TOKEN_LIMIT = 1000
export const MAX_DAILY_TOKEN_LIMIT = 100000000

export type GeminiTokenUsage = {
  promptTokens: number
  outputTokens: number
  thinkingTokens: number
  totalTokens: number
}

export const EMPTY_GEMINI_TOKEN_USAGE:
  GeminiTokenUsage = {
    promptTokens: 0,
    outputTokens: 0,
    thinkingTokens: 0,
    totalTokens: 0,
  }

const SESSION_STORAGE_KEY =
  'lifeform.gemini-api-key.session'

const LOCAL_STORAGE_KEY =
  'lifeform.gemini-api-key.local'

const MODEL_STORAGE_KEY =
  'lifeform.gemini-model'

const LEGACY_MODEL_STORAGE_KEY =
  'digital-lifeform.gemini-model'

const DAILY_TOKEN_LIMIT_STORAGE_KEY =
  'lifeform.daily-token-limit'

export type GeminiHistoryMessage = {
  role: 'user' | 'assistant'
  content: string
}

type StreamGeminiReplyOptions = {
  apiKey: string
  model?: GeminiModelId
  history: GeminiHistoryMessage[]
  prompt: string
  systemInstruction: string
  onText: (completeText: string) => void
  onUsage?: (usage: GeminiTokenUsage) => void
}

export function isGeminiModelId(
  value: string,
): value is GeminiModelId {
  return GEMINI_MODEL_OPTIONS.some(
    (option) => option.id === value,
  )
}

export function normalizeGeminiModelId(
  value: string | null | undefined,
): GeminiModelId {
  if (
    value &&
    isGeminiModelId(value)
  ) {
    return value
  }

  return DEFAULT_GEMINI_MODEL
}

export function getStoredGeminiModel():
  GeminiModelId {
  if (typeof window === 'undefined') {
    return DEFAULT_GEMINI_MODEL
  }

  const storedModel =
    window.localStorage.getItem(
      MODEL_STORAGE_KEY,
    ) ??
    window.localStorage.getItem(
      LEGACY_MODEL_STORAGE_KEY,
    )

  return normalizeGeminiModelId(
    storedModel,
  )
}

export function saveGeminiModel(
  model: GeminiModelId,
): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    MODEL_STORAGE_KEY,
    model,
  )

  window.localStorage.removeItem(
    LEGACY_MODEL_STORAGE_KEY,
  )
}

export function normalizeDailyTokenLimit(
  value: unknown,
): number {
  const numericValue =
    typeof value === 'number'
      ? value
      : Number(value)

  if (!Number.isFinite(numericValue)) {
    return DEFAULT_DAILY_TOKEN_LIMIT
  }

  return Math.min(
    MAX_DAILY_TOKEN_LIMIT,
    Math.max(
      MIN_DAILY_TOKEN_LIMIT,
      Math.round(numericValue),
    ),
  )
}

export function getStoredDailyTokenLimit():
  number {
  if (typeof window === 'undefined') {
    return DEFAULT_DAILY_TOKEN_LIMIT
  }

  return normalizeDailyTokenLimit(
    window.localStorage.getItem(
      DAILY_TOKEN_LIMIT_STORAGE_KEY,
    ),
  )
}

export function saveDailyTokenLimit(
  value: number,
): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    DAILY_TOKEN_LIMIT_STORAGE_KEY,
    String(
      normalizeDailyTokenLimit(value),
    ),
  )
}

export function getLocalTokenUsageDate(
  date = new Date(),
): string {
  const year = date.getFullYear()
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0')
  const day = String(
    date.getDate(),
  ).padStart(2, '0')

  return year + '-' + month + '-' + day
}

function normalizeTokenCount(
  value: unknown,
): number {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return 0
  }

  return Math.max(
    0,
    Math.round(numericValue),
  )
}

export function getGeminiTokenUsage(
  response: {
    usageMetadata?: unknown
  },
): GeminiTokenUsage {
  const metadata =
    response.usageMetadata &&
    typeof response.usageMetadata === 'object'
      ? response.usageMetadata as
          Record<string, unknown>
      : {}

  const promptTokens =
    normalizeTokenCount(
      metadata.promptTokenCount,
    )

  const outputTokens =
    normalizeTokenCount(
      metadata.candidatesTokenCount,
    )

  const thinkingTokens =
    normalizeTokenCount(
      metadata.thoughtsTokenCount,
    )

  const reportedTotal =
    normalizeTokenCount(
      metadata.totalTokenCount,
    )

  return {
    promptTokens,
    outputTokens,
    thinkingTokens,
    totalTokens: Math.max(
      reportedTotal,
      promptTokens +
        outputTokens +
        thinkingTokens,
    ),
  }
}

export function mergeGeminiTokenUsage(
  left: GeminiTokenUsage,
  right: GeminiTokenUsage,
): GeminiTokenUsage {
  return {
    promptTokens: Math.max(
      left.promptTokens,
      right.promptTokens,
    ),
    outputTokens: Math.max(
      left.outputTokens,
      right.outputTokens,
    ),
    thinkingTokens: Math.max(
      left.thinkingTokens,
      right.thinkingTokens,
    ),
    totalTokens: Math.max(
      left.totalTokens,
      right.totalTokens,
    ),
  }
}

export function addGeminiTokenUsage(
  ...usages: GeminiTokenUsage[]
): GeminiTokenUsage {
  return usages.reduce<GeminiTokenUsage>(
    (total, usage) => ({
      promptTokens:
        total.promptTokens +
        usage.promptTokens,
      outputTokens:
        total.outputTokens +
        usage.outputTokens,
      thinkingTokens:
        total.thinkingTokens +
        usage.thinkingTokens,
      totalTokens:
        total.totalTokens +
        usage.totalTokens,
    }),
    { ...EMPTY_GEMINI_TOKEN_USAGE },
  )
}

export function getGeminiModelLabel(
  model: GeminiModelId,
): string {
  return (
    GEMINI_MODEL_OPTIONS.find(
      (option) => option.id === model,
    )?.label ?? model
  )
}

export function getStoredGeminiApiKey(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  return (
    window.sessionStorage.getItem(
      SESSION_STORAGE_KEY,
    ) ??
    window.localStorage.getItem(
      LOCAL_STORAGE_KEY,
    ) ??
    ''
  )
}

export function saveGeminiApiKey(
  apiKey: string,
  rememberOnDevice: boolean,
): void {
  clearGeminiApiKey()

  if (rememberOnDevice) {
    window.localStorage.setItem(
      LOCAL_STORAGE_KEY,
      apiKey,
    )
  } else {
    window.sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      apiKey,
    )
  }
}

export function clearGeminiApiKey(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(
    SESSION_STORAGE_KEY,
  )

  window.localStorage.removeItem(
    LOCAL_STORAGE_KEY,
  )
}

function serializeUnknownError(
  error: unknown,
): string {
  if (error instanceof Error) {
    return (
      error.name + ': ' + error.message
    )
  }

  if (typeof error === 'string') {
    return error
  }

  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

export function getFriendlyGeminiErrorMessage(
  error: unknown,
  model: GeminiModelId =
    DEFAULT_GEMINI_MODEL,
): string {
  const raw =
    serializeUnknownError(error)

  const comparable =
    raw.toLowerCase()

  const modelLabel =
    getGeminiModelLabel(model)

  if (
    comparable.includes('429') ||
    comparable.includes(
      'resource_exhausted',
    ) ||
    comparable.includes('quota') ||
    comparable.includes('rate limit')
  ) {
    return (
      'The available quota for ' +
      modelLabel +
      ' is temporarily exhausted. ' +
      'Select another model or try again after the quota resets.'
    )
  }

  if (
    comparable.includes('404') ||
    comparable.includes('not found') ||
    comparable.includes(
      'is not supported',
    )
  ) {
    return (
      modelLabel +
      ' is not available for this API key or region. Select another model.'
    )
  }

  if (
    comparable.includes('401') ||
    comparable.includes('403') ||
    comparable.includes('api key') ||
    comparable.includes(
      'permission_denied',
    )
  ) {
    return (
      'The Google key is not authorized to use ' +
      modelLabel +
      '. Check the key or select another model.'
    )
  }

  if (
    comparable.includes('503') ||
    comparable.includes('unavailable') ||
    comparable.includes('overloaded')
  ) {
    return (
      modelLabel +
      ' is temporarily overloaded. Try again shortly or select another model.'
    )
  }

  if (
    comparable.includes('failed to fetch') ||
    comparable.includes('network')
  ) {
    return (
      'Gemini could not be reached. Check your connection and try again.'
    )
  }

  return (
    'Gemini did not complete the request with ' +
    modelLabel +
    '. Try again or select another model.'
  )
}

export async function verifyGeminiApiKey(
  apiKey: string,
  model: GeminiModelId =
    getStoredGeminiModel(),
): Promise<void> {
  const client = new GoogleGenAI({
    apiKey,
  })

  try {
    const response =
      await client.models.generateContent({
        model,
        contents:
          'This is a connection test. Reply with exactly the word OK.',
        config: {
          maxOutputTokens: 8,
        },
      })

    const responseText =
      response.text?.trim()

    if (!responseText) {
      throw new Error(
        'Gemini replied without returning text.',
      )
    }
  } catch (error: unknown) {
    throw new Error(
      getFriendlyGeminiErrorMessage(
        error,
        model,
      ),
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
    const cleanText =
      message.content.trim()

    if (!cleanText) {
      continue
    }

    const role =
      message.role === 'assistant'
        ? 'model'
        : 'user'

    const previous =
      normalized.at(-1)

    if (previous?.role === role) {
      previous.text =
        previous.text +
        '\n\n' +
        cleanText

      continue
    }

    normalized.push({
      role,
      text: cleanText,
    })
  }

  while (
    normalized[0]?.role === 'model'
  ) {
    normalized.shift()
  }

  return normalized.map(
    (message) => ({
      role: message.role,
      parts: [
        {
          text: message.text,
        },
      ],
    }),
  )
}

export async function streamGeminiReply({
  apiKey,
  model = getStoredGeminiModel(),
  history,
  prompt,
  systemInstruction,
  onText,
  onUsage,
}: StreamGeminiReplyOptions):
  Promise<string> {
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

  let completeText = ''
  let tokenUsage = {
    ...EMPTY_GEMINI_TOKEN_USAGE,
  }

  try {
    const stream =
      await client.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction,
          maxOutputTokens: 4096,
          temperature: 0.8,
          topP: 0.95,
        },
      })

    for await (const chunk of stream) {
      tokenUsage =
        mergeGeminiTokenUsage(
          tokenUsage,
          getGeminiTokenUsage(chunk),
        )

      const chunkText =
        chunk.text ?? ''

      if (!chunkText) {
        continue
      }

      completeText += chunkText
      onText(completeText)
    }
  } catch (error: unknown) {
    throw new Error(
      getFriendlyGeminiErrorMessage(
        error,
        model,
      ),
    )
  }

  onUsage?.(tokenUsage)

  const cleanResponse =
    completeText.trim()

  if (!cleanResponse) {
    throw new Error(
      getGeminiModelLabel(model) +
        ' non ha restituito una risposta testuale.',
    )
  }

  return cleanResponse
}
