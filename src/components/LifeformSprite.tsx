import { useEffect, useState } from 'react'
import {
  EMOTION_LABELS,
  getEmotionSpriteUrl,
  preloadCriticalSprites,
} from '../lib/sprites'
import type { EmotionalState } from '../types/lifeform'
import './LifeformSprite.css'

type LifeformSpriteProps = {
  emotion: EmotionalState
  lifeformName: string
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
        new Error('Impossibile caricare lo sprite: ' + url),
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

export function LifeformSprite({
  emotion,
  lifeformName,
}: LifeformSpriteProps) {
  const initialUrl = getEmotionSpriteUrl(emotion)

  const [visibleUrl, setVisibleUrl] = useState(initialUrl)
  const [visibleEmotion, setVisibleEmotion] =
    useState<EmotionalState>(emotion)
  const [hasVisibleSprite, setHasVisibleSprite] =
    useState(false)
  const [switchingSprite, setSwitchingSprite] =
    useState(false)

  useEffect(() => {
    preloadCriticalSprites()
  }, [])

  useEffect(() => {
    let cancelled = false

    const requestedUrl = getEmotionSpriteUrl(emotion)
    const neutralUrl = getEmotionSpriteUrl('neutral')

    const updateSprite = async () => {
      setSwitchingSprite(true)

      try {
        await loadImage(requestedUrl)

        if (cancelled) {
          return
        }

        setVisibleUrl(requestedUrl)
        setVisibleEmotion(emotion)
        setHasVisibleSprite(true)
      } catch {
        if (emotion === 'neutral') {
          if (!cancelled) {
            setHasVisibleSprite(false)
          }

          return
        }

        try {
          await loadImage(neutralUrl)

          if (cancelled) {
            return
          }

          setVisibleUrl(neutralUrl)
          setVisibleEmotion('neutral')
          setHasVisibleSprite(true)
        } catch {
          if (!cancelled) {
            setHasVisibleSprite(false)
          }
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
  }, [emotion])

  const classNames = [
    'chat-avatar',
    'emotion-' + visibleEmotion,
    hasVisibleSprite ? 'sprite-loaded' : 'sprite-loading',
    switchingSprite ? 'sprite-switching' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const emotionLabel = EMOTION_LABELS[visibleEmotion]

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
          lifeformName + ', stato ' + emotionLabel
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
