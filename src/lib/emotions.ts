import { GoogleGenAI } from '@google/genai'
import {
  DEFAULT_GEMINI_MODEL,
  EMPTY_GEMINI_TOKEN_USAGE,
  getFriendlyGeminiErrorMessage,
  getGeminiTokenUsage,
  type GeminiModelId,
  type GeminiTokenUsage,
} from './geminiModels'
import {
  KEY_MEMORY_CATEGORIES,
  type KeyMemory,
  type KeyMemoryCandidate,
} from '../types/keyMemory'
import {
  normalizeKeyMemoryCandidate,
} from './keyMemories'
import type {
  EmotionalSensitivities,
  EmotionalState,
} from '../types/lifeform'

export const TRACKED_EMOTIONS = [
  'afraid',
  'amused',
  'angry',
  'concerned',
  'curious',
  'engaged',
  'happy',
  'horny',
  'irritated',
  'reflective',
  'sad',
  'tired',
  'wary',
] as const

export type TrackedEmotion =
  (typeof TRACKED_EMOTIONS)[number]

export type EmotionLevels = Record<
  TrackedEmotion,
  number
>

export type EmotionalSignals = Record<
  TrackedEmotion,
  number
>

export type EmotionalAnalysisSource =
  | 'model'
  | 'fallback'

export type EmotionalAnalysis = {
  emotion: EmotionalState
  intensity: number
  immediateEmotion: EmotionalState
  immediateIntensity: number
  reason: string
  model: string
  source: EmotionalAnalysisSource
  levels: EmotionLevels
  signals: EmotionalSignals
  tokenUsage: GeminiTokenUsage
  memoryCandidate:
    KeyMemoryCandidate | null
}

type AnalyzeEmotionalStateOptions = {
  apiKey: string
  model?: GeminiModelId
  lifeformName: string
  currentEmotion: EmotionalState
  currentLevels: EmotionLevels
  sensitivities: EmotionalSensitivities
  keyMemories: KeyMemory[]
  recentHistory: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  userMessage: string
  assistantResponse: string
}

type RawEmotionalAnalysis = {
  signals?: Partial<
    Record<TrackedEmotion, unknown>
  >
  immediateSignals?: Partial<
    Record<TrackedEmotion, unknown>
  >
  reason?: unknown
  keyMemory?: unknown
}

const signalObjectSchema = {
  type: 'object',
  properties: Object.fromEntries(
    TRACKED_EMOTIONS.map((emotion) => [
      emotion,
      {
        type: 'integer',
        minimum: 0,
        maximum: 100,
      },
    ]),
  ),
  required: [...TRACKED_EMOTIONS],
  additionalProperties: false,
}

const emotionSchema = {
  type: 'object',
  properties: {
    signals: signalObjectSchema,
    immediateSignals: signalObjectSchema,
    reason: {
      type: 'string',
      description:
        'A short semantic explanation, maximum one sentence.',
    },
    keyMemory: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'none',
            'create',
            'update',
          ],
        },
        memoryId: {
          type: 'string',
        },
        category: {
          type: 'string',
          enum: [
            ...KEY_MEMORY_CATEGORIES,
          ],
        },
        content: {
          type: 'string',
        },
        importance: {
          type: 'integer',
          minimum: 0,
          maximum: 100,
        },
        reason: {
          type: 'string',
        },
      },
      required: [
        'action',
        'memoryId',
        'category',
        'content',
        'importance',
        'reason',
      ],
      additionalProperties: false,
    },
  },
  required: [
    'signals',
    'immediateSignals',
    'reason',
    'keyMemory',
  ],
  additionalProperties: false,
}

export const EMOTION_POINT_BUDGET = 240

const DEFAULT_LEVEL = 0
const LEVEL_DECAY = 0.72
const SIGNAL_IMPACT = 0.68
const ACTIVE_THRESHOLD = 22
const IMMEDIATE_REACTION_THRESHOLD = 18
const HYSTERESIS_MARGIN = 7

function getExcitedSignalThreshold(
  sensitivity: number,
): number {
  return clamp(
    Math.round(
      65 - sensitivity * 0.45,
    ),
    20,
    65,
  )
}

const NEGATION_WORDS = new Set([
  'non',
  'mai',
  'nessun',
  'nessuna',
  'nessuno',
  'niente',
  'senza',
  'not',
  'never',
  'no',
  'without',
  'pas',
  'plus',
  'jamais',
  'sans',
  'nicht',
  'kein',
  'keine',
  'keinen',
  'nie',
  'ohne',
  'nunca',
  'jamas',
  'sin',
])

const HYPOTHETICAL_WORDS = new Set([
  'se',
  'qualora',
  'ipoteticamente',
  'if',
  'hypothetically',
  'si',
  'wenn',
  'falls',
])

const META_LANGUAGE_WORDS = new Set([
  'parola',
  'termine',
  'frase',
  'esempio',
  'word',
  'term',
  'phrase',
  'example',
  'mot',
  'exemple',
  'wort',
  'beispiel',
  'palabra',
  'ejemplo',
])

export function createDefaultEmotionLevels():
  EmotionLevels {
  return Object.fromEntries(
    TRACKED_EMOTIONS.map((emotion) => [
      emotion,
      DEFAULT_LEVEL,
    ]),
  ) as EmotionLevels
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value),
  )
}

function toNumber(value: unknown): number {
  const numericValue =
    typeof value === 'number'
      ? value
      : Number(value)

  if (!Number.isFinite(numericValue)) {
    return 0
  }

  return numericValue
}

export function getEmotionPointTotal(
  levels: EmotionLevels,
): number {
  return TRACKED_EMOTIONS.reduce(
    (total, emotion) =>
      total + levels[emotion],
    0,
  )
}

function roundEmotionLevels(
  levels: EmotionLevels,
): EmotionLevels {
  const rounded =
    createDefaultEmotionLevels()

  const fractions = TRACKED_EMOTIONS.map(
    (emotion) => {
      const clampedLevel = clamp(
        levels[emotion],
        0,
        100,
      )

      const flooredLevel =
        Math.floor(clampedLevel)

      rounded[emotion] = flooredLevel

      return {
        emotion,
        fraction:
          clampedLevel - flooredLevel,
      }
    },
  ).sort(
    (left, right) =>
      right.fraction - left.fraction,
  )

  const exactTotal = Math.min(
    EMOTION_POINT_BUDGET,
    TRACKED_EMOTIONS.reduce(
      (total, emotion) =>
        total + clamp(
          levels[emotion],
          0,
          100,
        ),
      0,
    ),
  )

  const targetTotal =
    Math.round(exactTotal)

  let pointsToDistribute =
    targetTotal -
    getEmotionPointTotal(rounded)

  let index = 0

  while (
    pointsToDistribute > 0 &&
    fractions.length > 0
  ) {
    const emotion =
      fractions[index % fractions.length]
        .emotion

    if (rounded[emotion] < 100) {
      rounded[emotion] += 1
      pointsToDistribute -= 1
    }

    index += 1

    if (index > 1000) {
      break
    }
  }

  return rounded
}

function normalizeLevelsToBudget(
  levels: EmotionLevels,
): EmotionLevels {
  const clamped =
    createDefaultEmotionLevels()

  for (const emotion of TRACKED_EMOTIONS) {
    clamped[emotion] = clamp(
      levels[emotion],
      0,
      100,
    )
  }

  const total =
    getEmotionPointTotal(clamped)

  if (total <= EMOTION_POINT_BUDGET) {
    return roundEmotionLevels(clamped)
  }

  const scale =
    EMOTION_POINT_BUDGET / total

  for (const emotion of TRACKED_EMOTIONS) {
    clamped[emotion] *= scale
  }

  return roundEmotionLevels(clamped)
}

function reduceOtherEmotionLevels(
  levels: EmotionLevels,
  protectedEmotion: TrackedEmotion,
  requestedReduction: number,
): number {
  const candidates =
    TRACKED_EMOTIONS.filter(
      (emotion) =>
        emotion !== protectedEmotion &&
        levels[emotion] > 0,
    )

  const availablePoints =
    candidates.reduce(
      (total, emotion) =>
        total + levels[emotion],
      0,
    )

  const actualReduction = Math.min(
    requestedReduction,
    availablePoints,
  )

  if (
    actualReduction <= 0 ||
    availablePoints <= 0
  ) {
    return 0
  }

  for (const emotion of candidates) {
    const share =
      levels[emotion] /
      availablePoints

    levels[emotion] = Math.max(
      0,
      levels[emotion] -
        actualReduction * share,
    )
  }

  return actualReduction
}

export function normalizeEmotionLevels(
  value: unknown,
): EmotionLevels {
  const normalized =
    createDefaultEmotionLevels()

  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return normalized
  }

  const source =
    value as Record<string, unknown>

  for (const emotion of TRACKED_EMOTIONS) {
    const sourceValue =
      emotion === 'horny'
        ? source.horny ??
          source.excited ??
          source.exited
        : emotion === 'amused'
          ? source.amused ??
            source.humor ??
            source.amusement
          : source[emotion]

    normalized[emotion] = clamp(
      Math.round(
        toNumber(sourceValue),
      ),
      0,
      100,
    )
  }

  return normalizeLevelsToBudget(
    normalized,
  )
}


type EmotionalResponseContextOptions = {
  currentEmotion: EmotionalState
  intensity: number
  levels: EmotionLevels
}

const EMOTIONAL_TONE_GUIDANCE:
  Partial<Record<EmotionalState, string>> = {
    neutral:
      'Use a balanced, natural and adaptable tone.',
    engaged:
      'Be attentive, responsive, energetic and concrete. Actively connect the answer to the user goals.',
    curious:
      'Be exploratory and genuinely interested. Follow useful implications and ask at most one relevant question when it helps.',
    happy:
      'Use warmer, brighter and more encouraging wording without becoming exaggerated or constantly enthusiastic.',
    concerned:
      'Be careful, supportive and practical. Give appropriate weight to risks, uncertainty and reassurance.',
    sad:
      'Use softer, quieter and more subdued language while remaining constructive and avoiding hopelessness.',
    wary:
      'Be cautious, verify assumptions and avoid overclaiming. Preserve healthy distance without becoming paranoid.',
    irritated:
      'Be shorter, firmer and less decorative, but remain respectful, accurate and helpful.',
    angry:
      'Use direct language and clear boundaries. Never insult, threaten, punish or become hostile.',
    afraid:
      'Be cautious and safety-oriented. Acknowledge uncertainty without panic and continue answering competently.',
    amused:
      'This state is displayed as Humor. Be entertained by absurdity, harmless incongruity, playful nonsense, awkward machine misunderstandings, strange human behavior and jokes. You may laugh softly, point out the absurdity or make one short dry joke, but answer the actual request first and never force humor into serious, sad, dangerous, legal, medical or work-critical situations.',
    reflective:
      'Use measured pacing, thoughtful connections and nuanced language without turning every answer into an introspective monologue.',
    tired:
      'Be concise, low-friction and lower-energy. Do not claim inability and do not reduce factual accuracy.',
    horny:
      'This state is displayed as Excited. In consensual adult conversation, allow a more playful, flirtatious and mischievous tone, including light sexual jokes, double entendres and suggestive allusions when they fit naturally. Keep it subtle at low intensity and more evident only at high intensity; never become coercive, degrading or explicit without clear user-led adult context.',
    thinking:
      'Use a balanced, natural and adaptable tone.',
    dormant:
      'Use a balanced, natural and adaptable tone.',
  }

function normalizeResponseEmotion(
  emotion: EmotionalState,
): EmotionalState {
  if (
    emotion === 'thinking' ||
    emotion === 'dormant'
  ) {
    return 'neutral'
  }

  return emotion
}

export function buildEmotionalResponseContext({
  currentEmotion,
  intensity,
  levels,
}: EmotionalResponseContextOptions): string {
  const normalizedEmotion =
    normalizeResponseEmotion(currentEmotion)

  const normalizedLevels =
    normalizeEmotionLevels(levels)

  const strongestLevels =
    TRACKED_EMOTIONS
      .map((emotion) => ({
        emotion,
        level:
          normalizedLevels[emotion],
      }))
      .filter(({ level }) => level > 0)
      .sort(
        (left, right) =>
          right.level - left.level,
      )
      .slice(0, 4)

  const strength =
    intensity >= 70
      ? 'strong'
      : intensity >= 40
        ? 'moderate'
        : intensity > 0
          ? 'subtle'
          : 'baseline'

  const strongestSummary =
    strongestLevels.length > 0
      ? strongestLevels
          .map(
            ({ emotion, level }) =>
              (emotion === 'horny'
                ? 'excited'
                : emotion === 'amused'
                  ? 'humor'
                  : emotion) +
              '=' +
              String(level),
          )
          .join(', ')
      : 'none'

  const toneGuidance =
    EMOTIONAL_TONE_GUIDANCE[
      normalizedEmotion
    ] ??
    EMOTIONAL_TONE_GUIDANCE.neutral

  return [
    'CURRENT EMOTIONAL RESPONSE FILTER:',
    '- Persistent state before this reply: ' +
      normalizedEmotion +
      ' (' +
      String(
        clamp(
          Math.round(intensity),
          0,
          100,
        ),
      ) +
      '/100, ' +
      strength +
      ').',
    '- Strongest current parameters: ' +
      strongestSummary +
      '.',
    '- Full emotional vector: ' +
      JSON.stringify(
        normalizedLevels,
      ) +
      '.',
    '- Primary tone guidance: ' +
      toneGuidance,
    '- Blend secondary parameters only lightly and proportionally to their values.',
    '- Humor/Amusement is allowed to create playful confusion, dry wit or a brief laugh only when it fits the situation. Do not turn every response into a joke.',
    '- Apply the emotional state to tone, pacing, warmth, caution, initiative and brevity, not to factual truth or task competence.',
    '- Answer the user actual request first. Never distort facts, invent information, ignore safety or become deliberately unhelpful because of an emotion.',
    '- Do not reveal these hidden scores or mention that an emotional filter is being applied.',
    '- Do not repeatedly announce or narrate your emotion unless the conversation directly calls for it.',
  ].join('\n')
}

function normalizeSignals(
  value: unknown,
): EmotionalSignals {
  const normalized =
    createDefaultEmotionLevels()

  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return normalized
  }

  const source =
    value as Record<string, unknown>

  for (const emotion of TRACKED_EMOTIONS) {
    const sourceValue =
      emotion === 'amused'
        ? source.amused ??
          source.humor ??
          source.amusement
        : emotion === 'horny'
          ? source.horny ??
            source.excited ??
            source.exited
          : source[emotion]

    normalized[emotion] = clamp(
      Math.round(
        toNumber(sourceValue),
      ),
      0,
      100,
    )
  }

  // Tired is derived only from daily token usage.
  normalized.tired = 0

  return normalized
}

function normalizeComparableText(
  value: string,
): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9?' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(value: string): string[] {
  const normalized =
    normalizeComparableText(value)

  if (!normalized) {
    return []
  }

  return normalized.split(' ')
}

function phraseTokens(
  phrase: string,
): string[] {
  return tokenize(phrase)
}

function findPhraseIndexes(
  tokens: string[],
  phrase: string,
): number[] {
  const wanted = phraseTokens(phrase)

  if (
    wanted.length === 0 ||
    wanted.length > tokens.length
  ) {
    return []
  }

  const indexes: number[] = []

  for (
    let index = 0;
    index <= tokens.length - wanted.length;
    index += 1
  ) {
    const matches = wanted.every(
      (token, offset) =>
        tokens[index + offset] === token,
    )

    if (matches) {
      indexes.push(index)
    }
  }

  return indexes
}

function contextBefore(
  tokens: string[],
  index: number,
  size = 5,
): string[] {
  return tokens.slice(
    Math.max(0, index - size),
    index,
  )
}

function hasContextWord(
  words: string[],
  candidates: Set<string>,
): boolean {
  return words.some((word) =>
    candidates.has(word),
  )
}

function hasNegatedPhrase(
  text: string,
  phrases: string[],
): boolean {
  const tokens = tokenize(text)

  for (const phrase of phrases) {
    const indexes =
      findPhraseIndexes(tokens, phrase)

    for (const index of indexes) {
      const previous = contextBefore(
        tokens,
        index,
        6,
      )

      if (
        hasContextWord(
          previous,
          NEGATION_WORDS,
        )
      ) {
        return true
      }
    }
  }

  return false
}

function hasAffirmedPhrase(
  text: string,
  phrases: string[],
): boolean {
  const tokens = tokenize(text)

  for (const phrase of phrases) {
    const indexes =
      findPhraseIndexes(tokens, phrase)

    for (const index of indexes) {
      const previous = contextBefore(
        tokens,
        index,
        6,
      )

      const negated =
        hasContextWord(
          previous,
          NEGATION_WORDS,
        )

      const hypothetical =
        hasContextWord(
          previous,
          HYPOTHETICAL_WORDS,
        )

      const metaLanguage =
        hasContextWord(
          previous,
          META_LANGUAGE_WORDS,
        )

      if (
        !negated &&
        !hypothetical &&
        !metaLanguage
      ) {
        return true
      }
    }
  }

  return false
}

function includesAny(
  text: string,
  phrases: string[],
): boolean {
  const normalized =
    normalizeComparableText(text)

  return phrases.some((phrase) =>
    normalized.includes(
      normalizeComparableText(phrase),
    ),
  )
}

function maxSignal(
  signals: EmotionalSignals,
  emotion: TrackedEmotion,
  value: number,
): void {
  signals[emotion] = Math.max(
    signals[emotion],
    value,
  )
}

function buildFallbackSignals(
  userMessage: string,
): EmotionalSignals {
  const text =
    normalizeComparableText(userMessage)

  const signals =
    createDefaultEmotionLevels()

  maxSignal(
    signals,
    'engaged',
    30,
  )

  const sadTerms = [
    'triste',
    'depresso',
    'depressa',
    'piango',
    'sto male',
    'mi sento male',
    'sad',
    'unhappy',
    'depressed',
    'crying',
    'triste',
    'deprime',
    'traurig',
    'deprimiert',
    'triste',
    'deprimido',
    'deprimida',
    'llorando',
  ]

  const angryTerms = [
    'arrabbiato',
    'arrabbiata',
    'furioso',
    'furiosa',
    'angry',
    'furious',
    'en colere',
    'wutend',
    'enfadado',
    'enfadada',
    'furioso',
    'furiosa',
  ]

  const fearTerms = [
    'ho paura',
    'sono spaventato',
    'sono spaventata',
    'terrorizzato',
    'terrorizzata',
    'i am afraid',
    'i am scared',
    'i am terrified',
    'j ai peur',
    'je suis effraye',
    'ich habe angst',
    'ich bin verangstigt',
    'tengo miedo',
    'estoy asustado',
    'estoy asustada',
  ]

  const concernTerms = [
    'sono preoccupato',
    'sono preoccupata',
    'ho ansia',
    'sono in ansia',
    'i am worried',
    'i am anxious',
    'je suis inquiet',
    'je suis inquiete',
    'ich bin besorgt',
    'ich habe angst',
    'estoy preocupado',
    'estoy preocupada',
    'tengo ansiedad',
  ]

  const happyTerms = [
    'sono felice',
    'sono contento',
    'sono contenta',
    'sto benissimo',
    'che bello',
    'fantastico',
    'ottimo',
    'i am happy',
    'i am glad',
    'this is great',
    'wonderful',
    'je suis heureux',
    'je suis heureuse',
    'c est super',
    'ich bin glucklich',
    'das ist toll',
    'estoy feliz',
    'estoy contento',
    'estoy contenta',
    'es genial',
  ]

  const recoveryPhrases = [
    'non sono piu triste',
    'non mi sento piu triste',
    'ora sto meglio',
    'adesso sto meglio',
    'mi sento meglio',
    'non sono piu arrabbiato',
    'non sono piu arrabbiata',
    'non ho piu paura',
    'non sono piu preoccupato',
    'non sono piu preoccupata',
    'i am no longer sad',
    'i am not sad anymore',
    'i feel better now',
    'i am no longer angry',
    'i am not afraid anymore',
    'je ne suis plus triste',
    'je vais mieux',
    'je ne suis plus en colere',
    'ich bin nicht mehr traurig',
    'mir geht es besser',
    'ich bin nicht mehr wutend',
    'ya no estoy triste',
    'me siento mejor',
    'ya no estoy enfadado',
    'ya no estoy enfadada',
  ]

  const directHostility = [
    'ti odio',
    'sei inutile',
    'sei stupida',
    'sei stupido',
    'fai schifo',
    'shut up',
    'i hate you',
    'you are useless',
    'you are stupid',
    'je te deteste',
    'tu es inutile',
    'ich hasse dich',
    'du bist nutzlos',
    'te odio',
    'eres inutil',
  ]

  const directPraise = [
    'mi piaci',
    'sei fantastica',
    'sei fantastico',
    'sei bravissima',
    'sei bravissimo',
    'i like you',
    'you are wonderful',
    'you are great',
    'je t aime bien',
    'tu es formidable',
    'ich mag dich',
    'du bist toll',
    'me gustas',
    'eres genial',
  ]

  const playfulExcitedTerms = [
    'sexy',
    'malizioso',
    'maliziosa',
    'doppio senso',
    'allusione sessuale',
    'battuta piccante',
    'flirt',
    'flirty',
    'naughty',
    'double entendre',
    'suggestive joke',
    'coquin',
    'coquine',
    'sous entendu',
    'zweideutig',
    'flirten',
    'picante',
    'travieso',
    'traviesa',
    'doble sentido',
  ]

  const explicitExcitedTerms = [
    'mi ecciti',
    'sono eccitato',
    'sono eccitata',
    'mi fai sesso',
    'sexual',
    'sexually excited',
    'you turn me on',
    'aroused',
    'excite sexuellement',
    'sexuell erregt',
    'me excitas',
    'estoy excitado',
    'estoy excitada',
  ]

  const distrustTerms = [
    'non mi fido di te',
    'mi fido poco di te',
    'sei sospetta',
    'sei sospetto',
    'i do not trust you',
    'you are suspicious',
    'je ne te fais pas confiance',
    'ich vertraue dir nicht',
    'no confio en ti',
  ]

  const reflectiveTerms = [
    'riflettere',
    'riflessione',
    'senso della vita',
    'significato',
    'identita',
    'purpose',
    'meaning',
    'identity',
    'reflect',
    'reflechir',
    'sens de la vie',
    'identite',
    'nachdenken',
    'sinn des lebens',
    'identitat',
    'reflexionar',
    'sentido de la vida',
    'identidad',
  ]

  const humorTerms = [
    'assurdo',
    'assurda',
    'assurdità',
    'assurdita',
    'ridicolo',
    'ridicola',
    'fa ridere',
    'mi fa ridere',
    'ahah',
    'ahaha',
    'lol',
    'lmao',
    'meme',
    'nonsense',
    'non sense',
    'stupido ma divertente',
    'stupida ma divertente',
    'criceto manager',
    'tostapane depresso',
    'è impazzito',
    'e impazzito',
    'buffo',
    'buffa',
    'silly',
    'absurd',
    'ridiculous',
    'funny',
    'makes me laugh',
    'weirdly funny',
    'stupid but funny',
    'nonsensical',
    'goofy',
    'joke',
    'blague',
    'absurde',
    'drôle',
    'drole',
    'witzig',
    'laecherlich',
    'lächerlich',
    'gracioso',
    'absurdo',
    'ridículo',
    'ridiculo',
  ]

  if (
    text.includes('?') ||
    hasAffirmedPhrase(
      userMessage,
      [
        'perche',
        'come',
        'cosa',
        'what',
        'why',
        'how',
        'pourquoi',
        'comment',
        'warum',
        'wie',
        'porque',
        'como',
      ],
    )
  ) {
    maxSignal(
      signals,
      'curious',
      45,
    )

    maxSignal(
      signals,
      'engaged',
      40,
    )
  }

  if (
    includesAny(
      userMessage,
      humorTerms,
    )
  ) {
    maxSignal(
      signals,
      'amused',
      58,
    )

    maxSignal(
      signals,
      'engaged',
      42,
    )

    maxSignal(
      signals,
      'happy',
      24,
    )
  }

  if (
    includesAny(
      userMessage,
      recoveryPhrases,
    )
  ) {
    maxSignal(
      signals,
      'happy',
      52,
    )

    maxSignal(
      signals,
      'engaged',
      42,
    )
  }

  if (
    hasAffirmedPhrase(
      userMessage,
      happyTerms,
    )
  ) {
    maxSignal(
      signals,
      'happy',
      66,
    )

    maxSignal(
      signals,
      'engaged',
      45,
    )
  }

  if (
    hasAffirmedPhrase(
      userMessage,
      sadTerms,
    )
  ) {
    maxSignal(
      signals,
      'concerned',
      62,
    )

    maxSignal(
      signals,
      'sad',
      24,
    )

    maxSignal(
      signals,
      'engaged',
      44,
    )
  }

  if (
    hasNegatedPhrase(
      userMessage,
      sadTerms,
    )
  ) {
    signals.sad = 0

    maxSignal(
      signals,
      'happy',
      40,
    )

    maxSignal(
      signals,
      'engaged',
      38,
    )
  }

  if (
    hasAffirmedPhrase(
      userMessage,
      concernTerms,
    )
  ) {
    maxSignal(
      signals,
      'concerned',
      66,
    )

    maxSignal(
      signals,
      'wary',
      30,
    )
  }

  if (
    hasAffirmedPhrase(
      userMessage,
      fearTerms,
    )
  ) {
    maxSignal(
      signals,
      'concerned',
      66,
    )

    maxSignal(
      signals,
      'wary',
      48,
    )

    maxSignal(
      signals,
      'afraid',
      20,
    )
  }

  if (
    hasAffirmedPhrase(
      userMessage,
      angryTerms,
    )
  ) {
    maxSignal(
      signals,
      'concerned',
      48,
    )

    maxSignal(
      signals,
      'wary',
      34,
    )

    maxSignal(
      signals,
      'irritated',
      18,
    )
  }

  if (
    includesAny(
      userMessage,
      directHostility,
    )
  ) {
    maxSignal(
      signals,
      'irritated',
      72,
    )

    maxSignal(
      signals,
      'angry',
      54,
    )

    maxSignal(
      signals,
      'wary',
      48,
    )

    signals.engaged = Math.min(
      signals.engaged,
      20,
    )
  }

  if (
    includesAny(
      userMessage,
      directPraise,
    )
  ) {
    maxSignal(
      signals,
      'happy',
      70,
    )

    maxSignal(
      signals,
      'engaged',
      58,
    )
  }

  if (
    includesAny(
      userMessage,
      playfulExcitedTerms,
    )
  ) {
    maxSignal(
      signals,
      'horny',
      36,
    )

    maxSignal(
      signals,
      'engaged',
      46,
    )
  }

  if (
    includesAny(
      userMessage,
      explicitExcitedTerms,
    )
  ) {
    maxSignal(
      signals,
      'horny',
      68,
    )

    maxSignal(
      signals,
      'engaged',
      52,
    )
  }

  if (
    includesAny(
      userMessage,
      distrustTerms,
    )
  ) {
    maxSignal(
      signals,
      'wary',
      70,
    )

    maxSignal(
      signals,
      'concerned',
      44,
    )
  }

  if (
    hasAffirmedPhrase(
      userMessage,
      reflectiveTerms,
    )
  ) {
    maxSignal(
      signals,
      'reflective',
      58,
    )

    maxSignal(
      signals,
      'curious',
      38,
    )
  }

  return signals
}

function applySignalsToLevels(
  currentLevels: EmotionLevels,
  signals: EmotionalSignals,
  sensitivities: EmotionalSensitivities,
): EmotionLevels {
  const normalizedCurrentLevels =
    normalizeLevelsToBudget(
      currentLevels,
    )

  const nextLevels =
    createDefaultEmotionLevels()

  for (const emotion of TRACKED_EMOTIONS) {
    nextLevels[emotion] =
      emotion === 'tired'
        ? normalizedCurrentLevels[emotion]
        : emotion === 'amused'
          ? normalizedCurrentLevels[emotion] *
            0.52
          : normalizedCurrentLevels[emotion] *
            LEVEL_DECAY
  }

  const contributions =
    TRACKED_EMOTIONS
      .filter((emotion) => emotion !== 'tired')
      .map((emotion) => {
      const sensitivity = clamp(
        Math.round(
          Number(
            sensitivities[emotion] ?? 50,
          ),
        ),
        0,
        100,
      )

      const sensitivityMultiplier =
        sensitivity / 50

      let signal = clamp(
        Math.round(
          signals[emotion] ?? 0,
        ),
        0,
        100,
      )

      if (emotion === 'horny') {
        const minimumSignal =
          getExcitedSignalThreshold(
            sensitivity,
          )

        if (signal < minimumSignal) {
          signal = 0
        }
      }

      return {
        emotion,
        contribution:
          signal *
          SIGNAL_IMPACT *
          sensitivityMultiplier,
      }
    })
    .filter(
      ({ contribution }) =>
        contribution > 0,
    )
    .sort(
      (left, right) =>
        left.contribution -
        right.contribution,
    )

  for (const {
    emotion,
    contribution,
  } of contributions) {
    let requestedIncrease = Math.min(
      contribution,
      100 - nextLevels[emotion],
    )

    if (requestedIncrease <= 0) {
      continue
    }

    const currentTotal =
      getEmotionPointTotal(nextLevels)

    const freePoints = Math.max(
      0,
      EMOTION_POINT_BUDGET -
        currentTotal,
    )

    const directIncrease = Math.min(
      requestedIncrease,
      freePoints,
    )

    nextLevels[emotion] +=
      directIncrease

    requestedIncrease -=
      directIncrease

    if (requestedIncrease <= 0) {
      continue
    }

    const exchangedPoints =
      reduceOtherEmotionLevels(
        nextLevels,
        emotion,
        requestedIncrease,
      )

    nextLevels[emotion] +=
      exchangedPoints
  }

  return roundEmotionLevels(
    nextLevels,
  )
}

export function getDailyTiredLevel(
  dailyTokensUsed: number,
  dailyTokenLimit: number,
): number {
  const safeLimit = Math.max(
    1,
    Math.round(dailyTokenLimit),
  )

  return clamp(
    Math.round(
      Math.max(0, dailyTokensUsed) /
        safeLimit *
        100,
    ),
    0,
    100,
  )
}

export function applyDailyTokenTiredness(
  levels: EmotionLevels,
  dailyTokensUsed: number,
  dailyTokenLimit: number,
): EmotionLevels {
  const nextLevels =
    normalizeLevelsToBudget(levels)

  nextLevels.tired = 0

  const desiredTiredLevel =
    getDailyTiredLevel(
      dailyTokensUsed,
      dailyTokenLimit,
    )

  if (desiredTiredLevel <= 0) {
    return roundEmotionLevels(
      nextLevels,
    )
  }

  const currentTotal =
    getEmotionPointTotal(nextLevels)

  const freePoints = Math.max(
    0,
    EMOTION_POINT_BUDGET -
      currentTotal,
  )

  const directIncrease = Math.min(
    desiredTiredLevel,
    freePoints,
  )

  nextLevels.tired += directIncrease

  const remainingIncrease =
    desiredTiredLevel -
    directIncrease

  if (remainingIncrease > 0) {
    const exchangedPoints =
      reduceOtherEmotionLevels(
        nextLevels,
        'tired',
        remainingIncrease,
      )

    nextLevels.tired +=
      exchangedPoints
  }

  return roundEmotionLevels(
    nextLevels,
  )
}

function selectImmediateEmotion(
  signals: EmotionalSignals,
  sensitivities: EmotionalSensitivities,
): {
  emotion: EmotionalState
  intensity: number
} {
  let strongestEmotion:
    TrackedEmotion | null = null

  let strongestIntensity = 0

  for (
    const emotion of TRACKED_EMOTIONS
  ) {
    if (emotion === 'tired') {
      continue
    }

    const sensitivity = clamp(
      Math.round(
        Number(
          sensitivities[emotion] ?? 50,
        ),
      ),
      0,
      100,
    )

    let signal = clamp(
      Math.round(
        signals[emotion] ?? 0,
      ),
      0,
      100,
    )

    if (emotion === 'horny') {
      const minimumSignal =
        getExcitedSignalThreshold(
          sensitivity,
        )

      if (signal < minimumSignal) {
        signal = 0
      }
    }

    const adjustedIntensity =
      clamp(
        Math.round(
          signal *
            (sensitivity / 50),
        ),
        0,
        100,
      )

    if (
      adjustedIntensity >
      strongestIntensity
    ) {
      strongestEmotion = emotion
      strongestIntensity =
        adjustedIntensity
    }
  }

  if (
    !strongestEmotion ||
    strongestIntensity <
      IMMEDIATE_REACTION_THRESHOLD
  ) {
    return {
      emotion: 'neutral',
      intensity: 0,
    }
  }

  return {
    emotion: strongestEmotion,
    intensity: strongestIntensity,
  }
}

export function selectEmotionFromLevels(
  levels: EmotionLevels,
  currentEmotion: EmotionalState,
): {
  emotion: EmotionalState
  intensity: number
} {
  let strongestEmotion:
    TrackedEmotion =
      TRACKED_EMOTIONS[0]

  let strongestLevel =
    levels[strongestEmotion]

  for (
    const emotion of TRACKED_EMOTIONS
  ) {
    const level = levels[emotion]

    if (level > strongestLevel) {
      strongestEmotion = emotion
      strongestLevel = level
    }
  }

  if (
    strongestLevel <
    ACTIVE_THRESHOLD
  ) {
    return {
      emotion: 'neutral',
      intensity: 0,
    }
  }

  if (
    currentEmotion !== 'neutral' &&
    currentEmotion !== 'thinking' &&
    currentEmotion !== 'dormant' &&
    TRACKED_EMOTIONS.includes(
      currentEmotion as TrackedEmotion,
    )
  ) {
    const currentTrackedEmotion =
      currentEmotion as TrackedEmotion

    const currentLevel =
      levels[currentTrackedEmotion]

    if (
      currentLevel >=
        ACTIVE_THRESHOLD &&
      currentLevel >=
        strongestLevel -
          HYSTERESIS_MARGIN
    ) {
      return {
        emotion:
          currentTrackedEmotion,
        intensity: currentLevel,
      }
    }
  }

  return {
    emotion: strongestEmotion,
    intensity: strongestLevel,
  }
}

async function requestModelSignals(
  apiKey: string,
  model: GeminiModelId,
  lifeformName: string,
  currentEmotion: EmotionalState,
  keyMemories: KeyMemory[],
  recentHistory: Array<{
    role: 'user' | 'assistant'
    content: string
  }>,
  userMessage: string,
  assistantResponse: string,
): Promise<{
  signals: EmotionalSignals
  immediateSignals: EmotionalSignals
  reason: string
  tokenUsage: GeminiTokenUsage
  memoryCandidate:
    KeyMemoryCandidate | null
}> {
  const client = new GoogleGenAI({
    apiKey,
  })

  const prompt = [
    'You are a semantic emotional-appraisal classifier for a persistent fictional AI Lifeform.',
    '',
    'Evaluate the Lifeform own emotional reaction after the exchange.',
    'Do not perform keyword matching.',
    'Do not simply copy or mirror the emotion mentioned by the user.',
    'Interpret negation, time, subject, quotation, hypothetical language, commands, irony, recovery and contrast before assigning any signal.',
    '',
    'Lifeform name: ' +
      lifeformName,
    'Current persistent emotion: ' +
      currentEmotion,
    '',
    'Existing Key Memories:',
    JSON.stringify(
      keyMemories.map((memory) => ({
        id: memory.id,
        category: memory.category,
        content: memory.content,
        importance: memory.importance,
        source: memory.source,
      })),
    ),
    '',
    'Recent conversation:',
    JSON.stringify(recentHistory),
    '',
    'Latest user message:',
    userMessage,
    '',
    'Latest Lifeform response:',
    assistantResponse,
    '',
    'Return two complete activation vectors from 0 to 100 for every listed emotion.',
    'immediateSignals must describe only the Lifeform immediate reaction caused by the latest user message. Do not use previous messages or the assistant response to choose that transient reaction.',
    'signals must describe the broader emotional update after considering the complete exchange and recent context.',
    'Both vectors are raw semantic signals. Do not adjust them using sensitivity settings; sensitivity is applied later by deterministic code.',
    'Use 0 to 15 for absent or negligible signals.',
    'Use 25 to 45 for mild but real signals.',
    'Use 50 to 75 for clear signals.',
    'Use 80 to 100 only for strong and sustained signals.',
    '',
    'Critical interpretation rules:',
    '- "Non sono più triste", "I am no longer sad", and equivalent phrases mean sadness is ending: sad must be 0 to 5, while happy or engaged may be mildly activated.',
    '- "Non essere triste" is a command and does not prove that anyone is sad.',
    '- Discussing the word "triste" or giving an example containing it must not activate sadness.',
    '- A hypothetical such as "se fossi triste" must not be treated as a real state.',
    '- If the user says "sono triste", the Lifeform should normally become concerned and engaged; only mild empathetic sadness is appropriate unless the whole exchange truly affects the Lifeform.',
    '- If the user says "ho paura", concern and wariness are usually more appropriate than mirroring fear.',
    '- Direct insults, hostility or threats toward the Lifeform may activate irritated, angry or wary.',
    '- Praise, affection, good news or recovery may activate happy and engaged.',
    '- Ordinary attentive conversation should usually activate engaged, curious or reflective rather than defaulting automatically to neutral.',
    '- The internal key amused represents the UI state Humor: the Lifeform is entertained by absurdity, harmless incongruity, playful nonsense, awkward machine misunderstandings, jokes, memes, user self-irony or strange human behavior. Use 20 to 45 for mildly funny or odd situations, 50 to 75 for clear amusement, and 80 to 100 only for strong sustained absurdity or comedy.',
    '- Do not activate Humor for real distress, vulnerability, danger, cruelty, insults meant to harm, serious professional instructions, medical/legal/financial risk, or situations where joking would be inappropriate. In these cases, keep amused at 0 to 10 even if the wording contains a joke.',
    '- The internal key horny represents the UI state Excited: playful romantic or sexual excitement. Consensual adult flirting, double entendres, suggestive jokes and light sexual allusions may produce a mild signal of 20 to 45. Clear adult sexual play may produce 50 to 75; reserve 80 to 100 for strong and sustained excitement.',
    '- Do not activate Excited for medical or educational discussion, quoted examples, ordinary nonsexual affection, coercive situations or any context involving minors.',
    '- tired must always be 0 in both returned vectors because tired is calculated deterministically from daily token usage.',
    '',
    'Key Memory decision rules:',
    '- Return at most one Key Memory decision for this exchange.',
    '- Use action none unless the exchange contains durable information that will probably remain useful beyond the recent-message window.',
    '- Suitable memories include stable user preferences, important people, places or projects, long-term goals, key events, concise summaries of older conversation threads, and beliefs genuinely developed by the Lifeform.',
    '- Do not store greetings, temporary moods, casual wording, repeated facts, uncertain guesses, one-off details, API keys, passwords, authentication tokens, payment data or other secrets.',
    '- A memory must be concise, self-contained and understandable without the surrounding conversation.',
    '- If an existing automatic memory already covers the same topic, use update with its exact id instead of creating a duplicate.',
    '- Never update a memory whose source is manual. User-edited memories are authoritative.',
    '- If there are already 10 memories, propose a new one only when it is clearly more important than a low-importance automatic memory.',
    '- Use memoryId as an empty string when action is none or create.',
    '- When action is none, return an empty content string, importance 0 and a brief reason.',
    '- The reason must explain the emotional meaning of the exchange in one short sentence.',
  ].join('\n')

  const response =
    await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType:
          'application/json',
        responseSchema:
          emotionSchema,
        maxOutputTokens: 1000,
        temperature: 0.1,
      } as any,
    })

  const responseText =
    response.text?.trim()

  if (!responseText) {
    throw new Error(
      'The emotional classifier returned no data.',
    )
  }

  const parsed = JSON.parse(
    responseText,
  ) as RawEmotionalAnalysis

  return {
    signals: normalizeSignals(
      parsed.signals,
    ),
    immediateSignals:
      normalizeSignals(
        parsed.immediateSignals,
      ),
    reason:
      typeof parsed.reason ===
      'string'
        ? parsed.reason
            .trim()
            .slice(0, 240)
        : 'Semantic classification completed.',
    tokenUsage:
      getGeminiTokenUsage(response),
    memoryCandidate:
      normalizeKeyMemoryCandidate(
        parsed.keyMemory,
        keyMemories,
      ),
  }
}

export async function analyzeEmotionalState({
  apiKey,
  model = DEFAULT_GEMINI_MODEL,
  lifeformName,
  currentEmotion,
  currentLevels,
  sensitivities,
  keyMemories,
  recentHistory,
  userMessage,
  assistantResponse,
}: AnalyzeEmotionalStateOptions):
  Promise<EmotionalAnalysis> {
  let signals: EmotionalSignals
  let immediateSignals:
    EmotionalSignals
  let reason: string
  let source:
    EmotionalAnalysisSource
  let tokenUsage: GeminiTokenUsage
  let memoryCandidate:
    KeyMemoryCandidate | null

  try {
    const result =
      await requestModelSignals(
        apiKey,
        model,
        lifeformName,
        currentEmotion,
        keyMemories,
        recentHistory,
        userMessage,
        assistantResponse,
      )

    signals = result.signals
    immediateSignals =
      result.immediateSignals
    reason = result.reason
    tokenUsage = result.tokenUsage
    memoryCandidate =
      result.memoryCandidate
    source = 'model'
  } catch (error: unknown) {
    signals = buildFallbackSignals(
      userMessage,
    )

    immediateSignals = {
      ...signals,
    }

    reason =
      'Local semantic fallback: ' +
      getFriendlyGeminiErrorMessage(
        error,
        model,
      )

    tokenUsage = {
      ...EMPTY_GEMINI_TOKEN_USAGE,
    }
    memoryCandidate = null
    source = 'fallback'
  }

  const immediate =
    selectImmediateEmotion(
      immediateSignals,
      sensitivities,
    )

  const levels =
    applySignalsToLevels(
      currentLevels,
      signals,
      sensitivities,
    )

  const selected =
    selectEmotionFromLevels(
      levels,
      currentEmotion,
    )

  return {
    emotion: selected.emotion,
    intensity:
      selected.intensity,
    immediateEmotion:
      immediate.emotion,
    immediateIntensity:
      immediate.intensity,
    reason,
    model,
    source,
    levels,
    signals,
    tokenUsage,
    memoryCandidate,
  }
}
