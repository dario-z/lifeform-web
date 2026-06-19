import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
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

type SpriteVideoPlayback = {
  emotion: EmotionalState
  url: string
  playKey: number
}

function getEmotionVideoUrl(
  emotion: EmotionalState,
): string {
  const baseUrl =
    import.meta.env.BASE_URL || '/'

  const normalizedBaseUrl =
    baseUrl.endsWith('/')
      ? baseUrl
      : baseUrl + '/'

  return (
    normalizedBaseUrl +
    'sprites/emotions/mp4/' +
    emotion +
    '.mp4'
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

export function LifeformSprite({
  emotion,
  lifeformName,
}: LifeformSpriteProps) {
  const initialUrl =
    getEmotionSpriteUrl(emotion)

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
  const [
    activeVideo,
    setActiveVideo,
  ] = useState<SpriteVideoPlayback | null>(
    null,
  )
  const [videoReady, setVideoReady] =
    useState(false)

  const videoRef =
    useRef<HTMLVideoElement | null>(null)
  const playCounterRef = useRef(0)
  const firstSpriteLoadRef = useRef(true)

  const startVideoForEmotion =
    useCallback(
      (requestedEmotion: EmotionalState) => {
        playCounterRef.current += 1

        setVideoReady(false)
        setActiveVideo({
          emotion: requestedEmotion,
          url: getEmotionVideoUrl(
            requestedEmotion,
          ),
          playKey: playCounterRef.current,
        })
      },
      [],
    )

  const showStillSprite =
    useCallback(
      async (
        requestedEmotion: EmotionalState,
        playbackKey?: number,
      ) => {
        const requestedUrl =
          getEmotionSpriteUrl(
            requestedEmotion,
          )
        const neutralUrl =
          getEmotionSpriteUrl('neutral')

        try {
          await loadImage(requestedUrl)

          setVisibleUrl(requestedUrl)
          setVisibleEmotion(
            requestedEmotion,
          )
          setHasVisibleSprite(true)
        } catch {
          if (
            requestedEmotion ===
            'neutral'
          ) {
            setHasVisibleSprite(false)
          } else {
            try {
              await loadImage(neutralUrl)

              setVisibleUrl(neutralUrl)
              setVisibleEmotion('neutral')
              setHasVisibleSprite(true)
            } catch {
              setHasVisibleSprite(false)
            }
          }
        } finally {
          if (
            typeof playbackKey ===
            'number'
          ) {
            setActiveVideo(
              (currentVideo) =>
                currentVideo?.playKey ===
                playbackKey
                  ? null
                  : currentVideo,
            )
          }

          setVideoReady(false)
        }
      },
      [],
    )

  const finishVideoPlayback =
    useCallback(
      (
        playback:
          | SpriteVideoPlayback
          | null,
      ) => {
        if (!playback) {
          return
        }

        void showStillSprite(
          playback.emotion,
          playback.playKey,
        )
      },
      [showStillSprite],
    )

  const handleSpriteActivation =
    useCallback(() => {
      startVideoForEmotion(
        activeVideo?.emotion ??
          visibleEmotion,
      )
    }, [
      activeVideo?.emotion,
      startVideoForEmotion,
      visibleEmotion,
    ])

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
        handleSpriteActivation()
      },
      [handleSpriteActivation],
    )

  useEffect(() => {
    preloadCriticalSprites()
  }, [])

  useEffect(() => {
    let cancelled = false

    const requestedUrl =
      getEmotionSpriteUrl(emotion)
    const neutralUrl =
      getEmotionSpriteUrl('neutral')

    const updateSprite = async () => {
      setSwitchingSprite(true)

      try {
        await loadImage(requestedUrl)

        if (cancelled) {
          return
        }

        setHasVisibleSprite(true)

        if (firstSpriteLoadRef.current) {
          firstSpriteLoadRef.current =
            false

          setVisibleUrl(requestedUrl)
          setVisibleEmotion(emotion)
        } else {
          startVideoForEmotion(emotion)
        }
      } catch {
        if (cancelled) {
          return
        }

        firstSpriteLoadRef.current =
          false

        if (emotion === 'neutral') {
          setHasVisibleSprite(false)
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
  }, [emotion, startVideoForEmotion])

  useEffect(() => {
    if (!activeVideo || !videoReady) {
      return
    }

    const video = videoRef.current

    if (!video) {
      return
    }

    let cancelled = false

    video.currentTime = 0

    const playbackPromise = video.play()

    if (playbackPromise) {
      playbackPromise.catch(() => {
        if (!cancelled) {
          finishVideoPlayback(
            activeVideo,
          )
        }
      })
    }

    return () => {
      cancelled = true
    }
  }, [
    activeVideo,
    finishVideoPlayback,
    videoReady,
  ])

  const classNames = [
    'chat-avatar',
    'chat-avatar-interactive',
    'emotion-' + visibleEmotion,
    hasVisibleSprite
      ? 'sprite-loaded'
      : 'sprite-loading',
    switchingSprite
      ? 'sprite-switching'
      : '',
    activeVideo
      ? 'sprite-video-playing'
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  const emotionLabel =
    EMOTION_LABELS[visibleEmotion]

  const activeVideoLabel =
    activeVideo
      ? EMOTION_LABELS[
          activeVideo.emotion
        ]
      : emotionLabel

  return (
    <div
      className={classNames}
      role="button"
      tabIndex={0}
      aria-label={
        lifeformName +
        ': ' +
        activeVideoLabel +
        '. Tocca per riprodurre l’animazione.'
      }
      aria-busy={
        switchingSprite ||
        activeVideo !== null
      }
      onClick={handleSpriteActivation}
      onKeyDown={handleSpriteKeyDown}
    >
      <img
        className="chat-avatar-media chat-avatar-still"
        src={visibleUrl}
        alt={
          lifeformName +
          ', stato ' +
          emotionLabel
        }
        draggable={false}
      />

      {activeVideo && (
        <video
          key={activeVideo.playKey}
          ref={videoRef}
          className={
            videoReady
              ? 'chat-avatar-media chat-avatar-video chat-avatar-video-active'
              : 'chat-avatar-media chat-avatar-video'
          }
          src={activeVideo.url}
          poster={getEmotionSpriteUrl(
            activeVideo.emotion,
          )}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          onLoadedData={() =>
            setVideoReady(true)
          }
          onCanPlay={() =>
            setVideoReady(true)
          }
          onEnded={() =>
            finishVideoPlayback(
              activeVideo,
            )
          }
          onError={() =>
            finishVideoPlayback(
              activeVideo,
            )
          }
        />
      )}

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
