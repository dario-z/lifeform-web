import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { EMOTION_LABELS } from '../lib/sprites'
import type { EmotionalState } from '../types/lifeform'
import './LifeformSprite.css'

type EmotionLevelsLike = Partial<
  Record<string, number>
>

type LifeformSpriteProps = {
  emotion: EmotionalState
  lifeformName: string
  emotionLevels?: EmotionLevelsLike
}

const SPRITE_CYCLE_INTERVAL_MS = 3000

const STATIC_SPRITE_FILES: Partial<
  Record<EmotionalState, string[]>
> = {
  afraid: ['afraid.png'],
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

function getLevel(
  levels: EmotionLevelsLike | undefined,
  key: string,
): number {
  const value = levels?.[key]

  if (typeof value !== 'number') {
    return 0
  }

  return Number.isFinite(value)
    ? value
    : 0
}

function chooseEngagedFile(
  levels: EmotionLevelsLike | undefined,
): string {
  const concerned =
    getLevel(levels, 'concerned')
  const happy = getLevel(levels, 'happy')

  if (
    concerned > 70 ||
    happy > 70
  ) {
    return happy >= concerned
      ? 'engaged_happy.png'
      : 'engaged_concerned.png'
  }

  return 'engaged_neutral.png'
}

function chooseThinkingFile(
  levels: EmotionLevelsLike | undefined,
): string {
  const angry = getLevel(levels, 'angry')
  const happy = getLevel(levels, 'happy')

  if (
    angry > 70 ||
    happy > 70
  ) {
    return happy >= angry
      ? 'thinking.happy.png'
      : 'thinking.angry.png'
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

    let cancelled = false

    const intervalId =
      window.setInterval(() => {
        const cycleToNextSprite =
          async () => {
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

                if (cancelled) {
                  return
                }

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
          }

        void cycleToNextSprite()
      }, SPRITE_CYCLE_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [emotion, spriteUrlsKey, spriteUrls])

  const classNames = [
    'chat-avatar',
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
      aria-label={
        lifeformName + ': ' + emotionLabel
      }
      aria-busy={switchingSprite}
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
