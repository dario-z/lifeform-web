import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { EMOTION_LABELS } from '../lib/sprites'
import {
  buildMoodscapeStyle,
  type MoodscapeEmotion,
} from '../lib/emotionTheme'
import type { EmotionalState } from '../types/lifeform'
import './LifeformSprite.css'

type EmotionLevelsLike = Partial<
  Record<string, number>
>

type LifeformSpriteProps = {
  emotion: EmotionalState
  lifeformName: string
  emotionLevels?: EmotionLevelsLike
  topEmotions?: MoodscapeEmotion[]
  dreamEmotion?: EmotionalState | null
}

const SPRITE_CYCLE_INTERVAL_MS = 3000

const STATIC_SPRITE_FILES: Partial<
  Record<EmotionalState, string[]>
> = {
  afraid: ['afraid.png'],
  amused: [
    'amused_1.png',
    'amused_2.png',
    'amused_3.png',
  ],
  angry: ['angry.png'],
  concerned: ['concerned.png'],
  curious: [
    'curious_1.png',
    'curious_2.png',
    'curious_3.png',
  ],
  dormant: ['dormant.png'],
  happy: [
    'happy_1.png',
    'happy_2.png',
  ],
  horny: [
    'horny_1.png',
    'horny_2.png',
    'horny_3.png',
    'horny_4.png',
  ],
  irritated: ['irritated.png'],
  lonely: ['sad_2.png', 'sad_1.png'],
  neutral: ['neutral.png'],
  reflective: ['reflective.png'],
  sad: ['sad_1.png', 'sad_2.png'],
  tired: ['tired.png'],
  wary: ['wary.png'],
}

function getBaseUrl(): string {
  const baseUrl =
    import.meta.env.BASE_URL || '/'

  return baseUrl.endsWith('/')
    ? baseUrl
    : baseUrl + '/'
}

function getSpriteUrl(
  fileName: string,
): string {
  return (
    getBaseUrl() +
    'sprites/emotions/' +
    fileName
  )
}

const POSITIVE_OVERLAY_EMOTIONS = new Set([
  'happy',
  'amused',
  'horny',
])

const CONCERNED_OVERLAY_EMOTIONS =
  new Set([
    'afraid',
    'angry',
    'concerned',
    'irritated',
    'reflective',
    'sad',
    'wary',
  ])

function getSortedEmotions(
  levels: EmotionLevelsLike | undefined,
): Array<{
  emotion: string
  score: number
}> {
  if (!levels) {
    return []
  }

  return Object.entries(levels)
    .map(([emotion, score]) => ({
      emotion,
      score:
        typeof score === 'number' &&
        Number.isFinite(score)
          ? score
          : 0,
    }))
    .sort((left, right) => {
      return right.score - left.score
    })
}

function getSecondHighestEmotion(
  levels: EmotionLevelsLike | undefined,
): string | null {
  const sorted = getSortedEmotions(levels)

  if (sorted.length < 2) {
    return null
  }

  return sorted[1]?.emotion ?? null
}

function getHighestSupportEmotion(
  levels: EmotionLevelsLike | undefined,
  excludedEmotion: string,
): string | null {
  const sorted = getSortedEmotions(levels)

  const candidate = sorted.find(
    ({ emotion }) =>
      emotion !== excludedEmotion &&
      emotion !== 'neutral' &&
      emotion !== 'dormant',
  )

  return candidate?.emotion ?? null
}

function chooseEngagedFile(
  levels: EmotionLevelsLike | undefined,
): string {
  const secondEmotion =
    getSecondHighestEmotion(levels)

  if (!secondEmotion) {
    return 'engaged_neutral.png'
  }

  if (
    POSITIVE_OVERLAY_EMOTIONS.has(
      secondEmotion,
    )
  ) {
    return 'engaged_happy.png'
  }

  if (
    CONCERNED_OVERLAY_EMOTIONS.has(
      secondEmotion,
    )
  ) {
    return 'engaged_concerned.png'
  }

  return 'engaged_neutral.png'
}

function chooseThinkingFile(
  levels: EmotionLevelsLike | undefined,
): string {
  const strongestSupportEmotion =
    getHighestSupportEmotion(
      levels,
      'thinking',
    )

  if (!strongestSupportEmotion) {
    return 'thinking.neutral.png'
  }

  if (
    POSITIVE_OVERLAY_EMOTIONS.has(
      strongestSupportEmotion,
    )
  ) {
    return 'thinking.happy.png'
  }

  if (
    CONCERNED_OVERLAY_EMOTIONS.has(
      strongestSupportEmotion,
    )
  ) {
    return 'thinking.angry.png'
  }

  return 'thinking.neutral.png'
}

function getEmotionSpriteFiles(
  emotion: EmotionalState,
  levels: EmotionLevelsLike | undefined,
): string[] {
  if (emotion === 'engaged') {
    return [chooseEngagedFile(levels)]
  }

  if (emotion === 'thinking') {
    return [chooseThinkingFile(levels)]
  }

  return (
    STATIC_SPRITE_FILES[emotion] ??
    ['neutral.png']
  )
}

function loadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    let completed = false

    const resolveOnce = () => {
      if (completed) {
        return
      }

      completed = true
      resolve()
    }

    const rejectOnce = () => {
      if (completed) {
        return
      }

      completed = true
      reject(
        new Error(
          'Impossibile caricare lo sprite: ' +
            url,
        ),
      )
    }

    image.onload = resolveOnce
    image.onerror = rejectOnce
    image.src = url

    if (image.complete) {
      queueMicrotask(() => {
        if (image.naturalWidth > 0) {
          resolveOnce()
        } else {
          rejectOnce()
        }
      })
    }
  })
}

async function loadFirstAvailable(
  urls: string[],
): Promise<{
  url: string
  index: number
} | null> {
  for (
    let index = 0;
    index < urls.length;
    index += 1
  ) {
    const url = urls[index]

    try {
      await loadImage(url)

      return { url, index }
    } catch {
      // Try the next candidate.
    }
  }

  return null
}

export function LifeformSprite({
  emotion,
  lifeformName,
  emotionLevels,
  topEmotions = [],
  dreamEmotion = null,
}: LifeformSpriteProps) {
  const spriteFiles = useMemo(
    () =>
      getEmotionSpriteFiles(
        emotion,
        emotionLevels,
      ),
    [
      emotion,
      emotionLevels?.angry,
      emotionLevels?.concerned,
      emotionLevels?.happy,
    ],
  )

  const spriteUrls = useMemo(
    () => spriteFiles.map(getSpriteUrl),
    [spriteFiles],
  )

  const spriteUrlsKey =
    spriteUrls.join('|')

  const initialUrl =
    spriteUrls[0] ??
    getSpriteUrl('neutral.png')

const moodscapeStyle = useMemo(
    () =>
      buildMoodscapeStyle({
        topEmotions,
        dreamEmotion,
      }),
    [dreamEmotion, topEmotions],
  )

  const [visibleUrl, setVisibleUrl] =
    useState(initialUrl)
  const [
    visibleEmotion,
    setVisibleEmotion,
  ] = useState<EmotionalState>(emotion)
  const [
    hasVisibleSprite,
    setHasVisibleSprite,
  ] = useState(false)
  const [
    switchingSprite,
    setSwitchingSprite,
  ] = useState(false)

  const currentVariantIndexRef =
    useRef(0)

  const hasMultipleVariants =
    spriteUrls.length > 1

  const cycleToNextSprite =
    useCallback(async () => {
      if (spriteUrls.length <= 1) {
        return
      }

      for (
        let attempt = 0;
        attempt < spriteUrls.length;
        attempt += 1
      ) {
        const nextIndex =
          (currentVariantIndexRef
            .current +
            1 +
            attempt) %
          spriteUrls.length
        const nextUrl =
          spriteUrls[nextIndex]

        try {
          await loadImage(nextUrl)

          currentVariantIndexRef.current =
            nextIndex
          setVisibleUrl(nextUrl)
          setVisibleEmotion(emotion)
          setHasVisibleSprite(true)
          return
        } catch {
          // Try the following variant.
        }
      }
    }, [emotion, spriteUrls])

  const handleSpriteActivation =
    useCallback(() => {
      void cycleToNextSprite()
    }, [cycleToNextSprite])

  const handleSpriteKeyDown =
    useCallback(
      (
        event:
          React.KeyboardEvent<HTMLDivElement>,
      ) => {
        if (
          event.key !== 'Enter' &&
          event.key !== ' '
        ) {
          return
        }

        event.preventDefault()
        void cycleToNextSprite()
      },
      [cycleToNextSprite],
    )

  useEffect(() => {
    let cancelled = false

    const updateSprite = async () => {
      setSwitchingSprite(true)

      const firstAvailable =
        await loadFirstAvailable(
          spriteUrls,
        )

      if (cancelled) {
        return
      }

      if (firstAvailable) {
        currentVariantIndexRef.current =
          firstAvailable.index
        setVisibleUrl(firstAvailable.url)
        setVisibleEmotion(emotion)
        setHasVisibleSprite(true)
        setSwitchingSprite(false)
        return
      }

      const neutralUrl =
        getSpriteUrl('neutral.png')

      try {
        await loadImage(neutralUrl)

        if (cancelled) {
          return
        }

        currentVariantIndexRef.current = 0
        setVisibleUrl(neutralUrl)
        setVisibleEmotion('neutral')
        setHasVisibleSprite(true)
      } catch {
        if (!cancelled) {
          setHasVisibleSprite(false)
        }
      } finally {
        if (!cancelled) {
          setSwitchingSprite(false)
        }
      }
    }

    void updateSprite()

    return () => {
      cancelled = true
    }
  }, [emotion, spriteUrlsKey])

  useEffect(() => {
    if (spriteUrls.length <= 1) {
      return
    }

    const intervalId =
      window.setInterval(() => {
        void cycleToNextSprite()
      }, SPRITE_CYCLE_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [cycleToNextSprite, spriteUrls.length])

  const classNames = [
    'chat-avatar',
    hasMultipleVariants
      ? 'chat-avatar-interactive'
      : '',
    'emotion-' + visibleEmotion,
    hasVisibleSprite
      ? 'sprite-loaded'
      : 'sprite-loading',
    switchingSprite
      ? 'sprite-switching'
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  const emotionLabel =
    EMOTION_LABELS[visibleEmotion]

  return (
    <div
  className={classNames}
  style={moodscapeStyle}
  role={
        hasMultipleVariants
          ? 'button'
          : undefined
      }
      tabIndex={
        hasMultipleVariants ? 0 : undefined
      }
      aria-label={
        hasMultipleVariants
          ? lifeformName +
            ': ' +
            emotionLabel +
            '. Tocca per cambiare variante dello sprite.'
          : lifeformName + ': ' + emotionLabel
      }
      aria-busy={switchingSprite}
      onClick={
        hasMultipleVariants
          ? handleSpriteActivation
          : undefined
      }
      onKeyDown={
        hasMultipleVariants
          ? handleSpriteKeyDown
          : undefined
      }
    >
      <img
        src={visibleUrl}
        alt={
          lifeformName +
          ', stato ' +
          emotionLabel
        }
        draggable={false}
      />

      {!hasVisibleSprite && (
        <div
          className="sprite-loading-indicator"
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  )
}
