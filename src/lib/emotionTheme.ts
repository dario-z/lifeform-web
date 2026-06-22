import type { CSSProperties } from 'react'
import type { EmotionalState } from '../types/lifeform'

export type EmotionTheme = {
  accent: string
  tint: string
  border: string
}

export type MoodscapeEmotion = {
  emotion: EmotionalState
  score: number
}

type CustomCssProperties = CSSProperties &
  Record<
    `--${string}`,
    string | number | undefined
  >

export const EMOTION_THEME: Record<
  EmotionalState,
  EmotionTheme
> = {
  afraid: {
    accent: '#8A6BC1',
    tint: '#EEE7F8',
    border: '#D8C9EE',
  },
  amused: {
    accent: '#D69A3D',
    tint: '#FBF0D9',
    border: '#EDD8AD',
  },
  angry: {
    accent: '#D95C5C',
    tint: '#F9E1E1',
    border: '#EFC4C4',
  },
  concerned: {
    accent: '#C6845A',
    tint: '#F7E8DE',
    border: '#EDD1BF',
  },
  curious: {
    accent: '#33B5B0',
    tint: '#DDF6F4',
    border: '#BDEAE6',
  },
  dormant: {
    accent: '#8F8898',
    tint: '#F1EEF4',
    border: '#DDD8E4',
  },
  engaged: {
    accent: '#4E9BD8',
    tint: '#E5F1FA',
    border: '#C5DEF0',
  },
  happy: {
    accent: '#E6A23C',
    tint: '#FCEFD3',
    border: '#F3D9A6',
  },
  horny: {
    accent: '#D96A9A',
    tint: '#F9E2EC',
    border: '#F0C5D8',
  },
  irritated: {
    accent: '#D87847',
    tint: '#F9E8DE',
    border: '#EDCCBA',
  },
  lonely: {
    accent: '#7E8BC0',
    tint: '#EAEDF9',
    border: '#D0D7EF',
  },
  neutral: {
    accent: '#8B8175',
    tint: '#F5F1EC',
    border: '#E1D9D0',
  },
  reflective: {
    accent: '#6E7DB2',
    tint: '#E9EDF8',
    border: '#CDD4EA',
  },
  sad: {
    accent: '#5B84C4',
    tint: '#E7EFFB',
    border: '#C9D8F1',
  },
  thinking: {
    accent: '#7B86B6',
    tint: '#EAEDF8',
    border: '#D3D9EB',
  },
  tired: {
    accent: '#978A7A',
    tint: '#F2EEE8',
    border: '#DDD5CB',
  },
  wary: {
    accent: '#759777',
    tint: '#E8F1E6',
    border: '#CFE0CD',
  },
}

function clampOpacity(opacity: number): number {
  return Math.min(1, Math.max(0, opacity))
}

function withAlpha(
  hex: string,
  opacity: number,
): string {
  const normalized = hex
    .replace('#', '')
    .trim()

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return hex
  }

  const alpha = Math.round(
    clampOpacity(opacity) * 255,
  )
    .toString(16)
    .padStart(2, '0')

  return '#' + normalized + alpha
}

export function getEmotionTheme(
  emotion: EmotionalState | null | undefined,
): EmotionTheme {
  return (
    EMOTION_THEME[emotion ?? 'neutral'] ??
    EMOTION_THEME.neutral
  )
}

function getUniqueTopEmotions(
  topEmotions: MoodscapeEmotion[],
): MoodscapeEmotion[] {
  const seen = new Set<EmotionalState>()

  return topEmotions
    .filter(({ emotion, score }) => {
      if (
        !Number.isFinite(score) ||
        score < 0 ||
        seen.has(emotion)
      ) {
        return false
      }

      seen.add(emotion)
      return true
    })
    .slice(0, 3)
}

export function getEmotionChipStyle(
  emotion: EmotionalState,
  rank: number,
): CustomCssProperties {
  const theme = getEmotionTheme(emotion)

  return {
    '--emotion-chip-accent': theme.accent,
    '--emotion-chip-tint': theme.tint,
    '--emotion-chip-border': theme.border,
    '--emotion-chip-shadow': withAlpha(
      theme.accent,
      rank === 0 ? 0.15 : 0.09,
    ),
  }
}

export function buildMoodscapeStyle(options: {
  topEmotions: MoodscapeEmotion[]
  dreamEmotion: EmotionalState | null
}): CustomCssProperties {
  const selected =
    getUniqueTopEmotions(options.topEmotions)

  const dreamTheme = getEmotionTheme(
    options.dreamEmotion,
  )

  const primaryTheme = getEmotionTheme(
    selected[0]?.emotion ??
      options.dreamEmotion ??
      'neutral',
  )

  const secondaryTheme = getEmotionTheme(
    selected[1]?.emotion ??
      selected[0]?.emotion ??
      options.dreamEmotion ??
      'neutral',
  )

  const tertiaryTheme = getEmotionTheme(
    selected[2]?.emotion ??
      selected[1]?.emotion ??
      selected[0]?.emotion ??
      options.dreamEmotion ??
      'neutral',
  )

  return {
    '--moodscape-base': '#FFF9F4',
    '--moodscape-primary': withAlpha(
      primaryTheme.accent,
      0.24,
    ),
    '--moodscape-secondary': withAlpha(
      secondaryTheme.accent,
      0.18,
    ),
    '--moodscape-tertiary': withAlpha(
      tertiaryTheme.accent,
      0.13,
    ),
    '--moodscape-dream-overlay': withAlpha(
      dreamTheme.tint,
      options.dreamEmotion ? 0.74 : 0.42,
    ),
    '--moodscape-mist': withAlpha(
      dreamTheme.accent,
      options.dreamEmotion ? 0.07 : 0.03,
    ),
    '--moodscape-floor': withAlpha(
      primaryTheme.accent,
      0.16,
    ),
    '--moodscape-vignette':
      'rgba(117, 96, 77, 0.055)',
  }
}