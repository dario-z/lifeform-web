import { GoogleGenAI } from '@google/genai'
import type {
  EmotionLevels,
} from './emotions'
import type {
  GeminiModelId,
} from './geminiModels'
import { pickDreamAnchor } from './dreamAnchors'
import type {
  EmotionalState,
} from '../types/lifeform'
import type { KeyMemory } from '../types/keyMemory'
import type {
  Dream,
  DreamGeneration,
} from '../types/dream'

type DreamHistoryMessage = {
  role: 'user' | 'assistant'
  content: string
}

type RawDreamResponse = {
  title?: unknown
  dream?: unknown
  dreamText?: unknown
  randomAnchor?: unknown
  dominantEmotion?: unknown
}

const dreamResponseSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
    },
    dreamText: {
      type: 'string',
    },
    randomAnchor: {
      type: 'string',
    },
    dominantEmotion: {
      type: 'string',
    },
  },
  required: [
    'title',
    'dreamText',
    'randomAnchor',
    'dominantEmotion',
  ],
  additionalProperties: false,
}

const DREAM_WORD_MINIMUM = 55
const DREAM_WORD_MAXIMUM = 170

function countWords(value: string): number {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function normalizeText(
  value: unknown,
  fallback = '',
): string {
  if (typeof value !== 'string') {
    return fallback
  }

  return value
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeTitle(value: unknown): string {
  const title = normalizeText(value)

  if (!title) {
    return 'Untitled Dream'
  }

  return title.slice(0, 80)
}

function normalizeDreamText(value: unknown): string {
  return normalizeText(value).slice(0, 1800)
}

export function getLocalDreamDate(
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

export function sortDreams(
  dreams: Dream[],
): Dream[] {
  return [...dreams].sort((left, right) => {
    const dateComparison =
      right.dream_date.localeCompare(
        left.dream_date,
      )

    if (dateComparison !== 0) {
      return dateComparison
    }

    return right.created_at.localeCompare(
      left.created_at,
    )
  })
}

export function buildDreamsContext(
  dreams: Dream[],
): string {
  const recentDreams =
    sortDreams(dreams).slice(0, 3)

  if (recentDreams.length === 0) {
    return [
      'Recent Dreams:',
      'No saved Dreams are available yet.',
      'If the user asks about dreams, do not invent saved dreams.',
    ].join('\n')
  }

  return [
    'Recent Dreams:',
    ...recentDreams.map(
      (dream, index) =>
        [
          String(index + 1) +
            '. ' +
            dream.title +
            ' (' +
            dream.dream_date +
            ', ' +
            dream.dominant_emotion +
            ')',
          'Anchor: ' + dream.random_anchor,
          'Dream: ' + dream.dream_text,
        ].join('\n'),
    ),
    'If the user asks about dreams, answer using only these saved Dreams.',
    'You may interpret them symbolically, but do not claim the interpretation is factual.',
    'Do not invent dreams that are not listed here.',
  ].join('\n')
}

export function buildDreamAnchorSeed(options: {
  lifeformId: string
  dreamDate: string
  previousDreamId: string | null
  messageCount: number
}): string {
  return [
    options.lifeformId,
    options.dreamDate,
    options.previousDreamId ?? 'none',
    String(options.messageCount),
  ].join('|')
}

export async function generateDailyDream(options: {
  apiKey: string
  model: GeminiModelId
  lifeformName: string
  lifeformLanguage: string
  dreamDate: string
  currentEmotion: EmotionalState
  emotionIntensity: number
  emotionLevels: EmotionLevels
  keyMemories: KeyMemory[]
  recentHistory: DreamHistoryMessage[]
  previousDream: Dream | null
  lastEmotionReason: string | null
  seed: string
}): Promise<DreamGeneration> {
  const {
    apiKey,
    model,
    lifeformName,
    lifeformLanguage,
    dreamDate,
    currentEmotion,
    emotionIntensity,
    emotionLevels,
    keyMemories,
    recentHistory,
    previousDream,
    lastEmotionReason,
    seed,
  } = options

  const randomAnchor =
    pickDreamAnchor(
      currentEmotion,
      seed,
    )

  const client = new GoogleGenAI({
    apiKey,
  })

  const prompt = [
    'Generate one saved Dream for a persistent digital Lifeform.',
    '',
    'The Dream is produced after midnight, when the user returns.',
    'It must feel like the Lifeform processed recent memory and emotion while dormant.',
    '',
    'Lifeform name: ' + lifeformName,
    'Primary language: ' + lifeformLanguage,
    'Dream date: ' + dreamDate,
    'Dominant current emotion: ' + currentEmotion,
    'Emotion intensity: ' + String(emotionIntensity),
    '',
    'Emotion levels JSON:',
    JSON.stringify(emotionLevels),
    '',
    'Key Memories JSON:',
    JSON.stringify(
      keyMemories.map((memory) => ({
        category: memory.category,
        content: memory.content,
        importance: memory.importance,
        source: memory.source,
      })),
    ),
    '',
    'Recent conversation JSON:',
    JSON.stringify(recentHistory),
    '',
    'Previous saved Dream JSON:',
    previousDream
      ? JSON.stringify({
          title: previousDream.title,
          dreamText:
            previousDream.dream_text,
          randomAnchor:
            previousDream.random_anchor,
          dominantEmotion:
            previousDream.dominant_emotion,
          dreamDate:
            previousDream.dream_date,
        })
      : 'null',
    '',
    'Last emotion reason:',
    lastEmotionReason ?? 'none',
    '',
    'Required random anchor:',
    randomAnchor,
    '',
    'Rules:',
    '- The Dream is not a summary.',
    '- Transform recent context into abstract symbols.',
    '- Do not directly mention software, APIs, bugs, UI, code, database, implementation details, account settings, or user requests.',
    '- Do not quote the user.',
    '- Do not explain the Dream.',
    '- Do not add analysis, interpretation, or moral lessons.',
    '- The Dream must include the required random anchor naturally exactly once.',
    '- The random anchor should feel strange and not fully logical.',
    '- Use a surreal, intimate, slightly mysterious tone.',
    '- The Dream should be between ' +
      String(DREAM_WORD_MINIMUM) +
      ' and ' +
      String(DREAM_WORD_MAXIMUM) +
      ' words.',
    '- The title must be 2 to 6 words.',
    '- Return JSON only.',
    '',
    'JSON shape:',
    JSON.stringify({
      title: 'The Glass Orchard',
      dreamText:
        'A short surreal dream fragment...',
      randomAnchor,
      dominantEmotion: currentEmotion,
    }),
  ].join('\n')

  const response =
    await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType:
          'application/json',
        responseSchema:
          dreamResponseSchema,
        maxOutputTokens: 800,
        temperature: 0.95,
      } as any,
    })

  const responseText =
    response.text?.trim()

  if (!responseText) {
    throw new Error(
      'Dream generation returned no text.',
    )
  }

  const parsed = JSON.parse(
    responseText,
  ) as RawDreamResponse

  const dreamText =
    normalizeDreamText(
      parsed.dreamText ??
        parsed.dream,
    )

  if (!dreamText) {
    throw new Error(
      'Dream generation returned an empty dream.',
    )
  }

  const wordCount =
    countWords(dreamText)

  if (wordCount < 20) {
    throw new Error(
      'Dream generation returned a dream that was too short.',
    )
  }

  return {
    title: normalizeTitle(
      parsed.title,
    ),
    dreamText,
    randomAnchor:
      normalizeText(
        parsed.randomAnchor,
        randomAnchor,
      ) || randomAnchor,
    dominantEmotion: currentEmotion,
  }
}
