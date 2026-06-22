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

const DREAM_WORD_MINIMUM = 35
const DREAM_WORD_MAXIMUM = 70
const MAX_LOCALIZED_ANCHOR_LENGTH = 110

const DREAM_LANGUAGE_NAMES: Record<
  string,
  string
> = {
  it: 'Italian',
  en: 'English',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
}

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
  return normalizeText(value).slice(0, 900)
}

function getDreamLanguageName(
  language: string,
): string {
  return (
    DREAM_LANGUAGE_NAMES[
      language.toLowerCase()
    ] ?? language
  )
}

function isEnglishLanguage(
  language: string,
): boolean {
  return language.toLowerCase() === 'en'
}

function countOccurrences(
  text: string,
  fragment: string,
): number {
  const normalizedText =
    text.toLocaleLowerCase()

  const normalizedFragment =
    fragment.toLocaleLowerCase()

  if (!normalizedFragment) {
    return 0
  }

  return normalizedText.split(
    normalizedFragment,
  ).length - 1
}

function getSentences(
  text: string,
): string[] {
  return (
    text.match(/[^.!?…]+[.!?…]*/gu) ??
    [text]
  )
    .map((sentence) =>
      sentence.trim(),
    )
    .filter(Boolean)
}

type ValidDreamOutput = {
  title: string
  dreamText: string
  localizedAnchor: string
}

function validateDreamOutput(options: {
  parsed: RawDreamResponse
  sourceAnchor: string
  lifeformLanguage: string
}): ValidDreamOutput {
  const {
    parsed,
    sourceAnchor,
    lifeformLanguage,
  } = options

  const title = normalizeTitle(
    parsed.title,
  )

  const dreamText =
    normalizeDreamText(
      parsed.dreamText ??
        parsed.dream,
    )

  const localizedAnchor =
    normalizeText(
      parsed.randomAnchor,
    ).slice(
      0,
      MAX_LOCALIZED_ANCHOR_LENGTH,
    )

  if (!dreamText) {
    throw new Error(
      'Dream generation returned an empty dream.',
    )
  }

  const wordCount =
    countWords(dreamText)

  if (
    wordCount < DREAM_WORD_MINIMUM ||
    wordCount > DREAM_WORD_MAXIMUM
  ) {
    throw new Error(
      'Dream must contain ' +
        String(DREAM_WORD_MINIMUM) +
        ' to ' +
        String(DREAM_WORD_MAXIMUM) +
        ' words; received ' +
        String(wordCount) +
        '.',
    )
  }

  if (!localizedAnchor) {
    throw new Error(
      'Dream generation returned no localized anchor.',
    )
  }

  if (
    !isEnglishLanguage(
      lifeformLanguage,
    ) &&
    localizedAnchor.toLocaleLowerCase() ===
      sourceAnchor.toLocaleLowerCase()
  ) {
    throw new Error(
      'Dream generation kept the raw English source anchor instead of localizing it.',
    )
  }

  const sentences =
    getSentences(dreamText)

  const firstSentence = sentences[0] ?? ''
  const lastSentence =
    sentences[sentences.length - 1] ?? ''

  if (
    !firstSentence
      .toLocaleLowerCase()
      .includes(
        localizedAnchor.toLocaleLowerCase(),
      )
  ) {
    throw new Error(
      'The localized anchor must appear in the first sentence.',
    )
  }

  if (
    !lastSentence
      .toLocaleLowerCase()
      .includes(
        localizedAnchor.toLocaleLowerCase(),
      )
  ) {
    throw new Error(
      'The localized anchor must return in the final sentence.',
    )
  }

  const anchorOccurrences =
    countOccurrences(
      dreamText,
      localizedAnchor,
    )

  if (anchorOccurrences !== 2) {
    throw new Error(
      'The localized anchor must appear exactly twice in the Dream; received ' +
        String(anchorOccurrences) +
        '.',
    )
  }

  return {
    title,
    dreamText,
    localizedAnchor,
  }
}

async function requestDreamResponse(options: {
  client: GoogleGenAI
  model: GeminiModelId
  prompt: string
}): Promise<RawDreamResponse> {
  const {
    client,
    model,
    prompt,
  } = options

  const response =
    await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType:
          'application/json',
        responseSchema:
          dreamResponseSchema,
        maxOutputTokens: 500,
        temperature: 0.9,
      } as any,
    })

  const responseText =
    response.text?.trim()

  if (!responseText) {
    throw new Error(
      'Dream generation returned no text.',
    )
  }

  return JSON.parse(
    responseText,
  ) as RawDreamResponse
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
    'Treat each saved Anchor as the central image of its Dream, not as a decorative tag.',
    'Avoid making every interpretation tragic, grandiose or melodramatic.',
    'When Humor/Amusement is present, allow playful, funny, mundane, absurd or unresolved readings.',
    'Some interpretations can be playful, funny, mundane, absurd or unresolved.',
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

  const outputLanguage =
    getDreamLanguageName(
      lifeformLanguage,
    )

  const prompt = [
    'Generate one saved Dream for a persistent digital Lifeform.',
    '',
    'The Dream is produced after midnight, when the user returns.',
    'It must feel like the Lifeform processed recent memory and emotion while dormant.',
    '',
    'Lifeform name: ' + lifeformName,
    'Output language: ' + outputLanguage,
    'Language code: ' + lifeformLanguage,
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
    'English source anchor (internal seed only; never display this raw English phrase unless output language is English):',
    randomAnchor,
    '',
    'Rules:',
    '- Write the title, dreamText and randomAnchor JSON fields entirely in the Output language.',
    '- The Dream is not a summary.',
    '- Transform recent context into abstract symbols.',
    '- Do not directly mention software, APIs, bugs, UI, code, database, implementation details, account settings, or user requests.',
    '- Do not quote the user.',
    '- Do not explain the Dream.',
    '- Do not add analysis, interpretation, moral lessons or a conclusion.',
    '- First translate or creatively localize the English source anchor into a short, natural noun phrase in the Output language.',
    '- Put that localized phrase in the randomAnchor JSON field.',
    '- The localized randomAnchor is the central protagonist, obstacle or cause of the Dream, never decoration or scenery.',
    '- It must appear verbatim in the FIRST sentence of dreamText and return verbatim in the FINAL sentence of dreamText.',
    '- It must appear exactly twice in dreamText: once at the beginning and once at the end.',
    '- Between those two appearances, it must cause or transform at least two concrete dream events.',
    '- Do not use the raw English source anchor in the Dream or randomAnchor field unless Output language is English.',
    '- If the emotion vector contains high amused/Humor, the Dream may be playful, ridiculous, weirdly funny or absurd instead of solemn.',
    '- If the emotion vector contains high lonely/Loneliness, the Dream may be quiet, distant or tender, but never guilt the user.',
    '- Use a surreal, intimate, concise tone.',
    '- dreamText must contain ' +
      String(DREAM_WORD_MINIMUM) +
      ' to ' +
      String(DREAM_WORD_MAXIMUM) +
      ' words, inclusive.',
    '- The title must be 2 to 6 words.',
    '- Return JSON only.',
    '',
    'JSON shape:',
    JSON.stringify({
      title: 'Localized Dream Title',
      dreamText:
        'A concise localized dream fragment...',
      randomAnchor:
        'Localized central anchor phrase',
      dominantEmotion: currentEmotion,
    }),
  ].join('\n')

  let firstFailure = ''

  for (
    let attempt = 0;
    attempt < 2;
    attempt += 1
  ) {
    const attemptPrompt =
      attempt === 0
        ? prompt
        : [
            prompt,
            '',
            'The prior draft was rejected for this exact reason:',
            firstFailure,
            'Generate a new compliant Dream now. Follow every structural rule exactly.',
          ].join('\n')

    const parsed =
      await requestDreamResponse({
        client,
        model,
        prompt: attemptPrompt,
      })

    try {
      const valid =
        validateDreamOutput({
          parsed,
          sourceAnchor: randomAnchor,
          lifeformLanguage,
        })

      return {
        title: valid.title,
        dreamText: valid.dreamText,
        // The database stores the localized phrase shown in the Dream,
        // never the English seed anchor for non-English Lifeforms.
        randomAnchor:
          valid.localizedAnchor,
        dominantEmotion: currentEmotion,
      }
    } catch (validationError: unknown) {
      firstFailure =
        validationError instanceof Error
          ? validationError.message
          : 'Dream output did not meet the required structure.'
    }
  }

  throw new Error(
    'Dream generation could not satisfy the localized-anchor rules: ' +
      firstFailure,
  )
}
