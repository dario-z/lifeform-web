import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import type {
  CSSProperties,
  FormEvent,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'
import { EmotionMonitor } from './EmotionMonitor'
import { KeyMemoriesPanel } from './KeyMemoriesPanel'
import { LifeformSprite } from './LifeformSprite'
import {
  analyzeEmotionalState,
  applyDailyTokenTiredness,
  buildEmotionalResponseContext,
  createDefaultEmotionLevels,
  normalizeEmotionLevels,
  selectEmotionFromLevels,
  type EmotionalAnalysis,
  type EmotionalAnalysisSource,
  type EmotionLevels,
  type TrackedEmotion,
} from '../lib/emotions'
import {
  AUTO_MEMORY_REPLACEMENT_MARGIN,
  MAX_KEY_MEMORIES,
  buildKeyMemoriesContext,
  findSimilarKeyMemory,
  normalizeKeyMemoryInput,
} from '../lib/keyMemories'
import {
  EMPTY_GEMINI_TOKEN_USAGE,
  GEMINI_MODEL_OPTIONS,
  addGeminiTokenUsage,
  getGeminiModelLabel,
  getLocalTokenUsageDate,
  loadStoredDailyTokenLimit,
  loadStoredGeminiModel,
  normalizeDailyTokenLimit,
  normalizeGeminiModelId,
  saveStoredDailyTokenLimit,
  saveStoredGeminiModel,
  streamGeminiReplyWithModel,
  type GeminiModelId,
  type GeminiTokenUsage,
} from '../lib/geminiModels'
import { EMOTION_LABELS } from '../lib/sprites'
import { supabase } from '../lib/supabase'
import type {
  EmotionalSensitivities,
  EmotionalState,
  Lifeform,
  Profile,
} from '../types/lifeform'
import type { ChatMessage } from '../types/message'
import type {
  KeyMemory,
  KeyMemoryCandidate,
  KeyMemoryInput,
} from '../types/keyMemory'
import './GeminiModelSelect.css'
import './MobileChatLayout.css'
import './IvoryGlassTheme.css'

const MESSAGE_PAGE_SIZE = 50
const GEMINI_CONTEXT_SIZE = 24
const EMOTION_CONTEXT_SIZE = 8
const IMMEDIATE_REACTION_DURATION_MS = 2000
const SENSITIVITY_SAVE_DELAY_MS = 450
const TOKEN_SETTINGS_SAVE_DELAY_MS = 450
const MAX_MESSAGE_LENGTH = 20000

const MOBILE_SPRITE_SHARE_STORAGE_KEY =
  'lifeform.mobile-sprite-share'
const DEFAULT_MOBILE_SPRITE_SHARE = 50
const MIN_MOBILE_SPRITE_SHARE = 24
const MAX_MOBILE_SPRITE_SHARE = 96
const MOBILE_SPRITE_SHARE_STEP = 2

type LifeformChatProps = {
  profile: Profile
  lifeform: Lifeform
  apiKey: string
  signingOut: boolean
  onSignOut: () => Promise<void>
  onDisconnectGemini: () => void
}

type EmotionStateRow = {
  current_emotion: EmotionalState
  emotion_intensity: number
  emotion_levels: unknown
  emotional_sensitivities:
    EmotionalSensitivities
  daily_token_limit: number
  daily_tokens_used: number
  token_usage_date: string
}

function clampMobileSpriteShare(
  value: number,
): number {
  return Math.min(
    MAX_MOBILE_SPRITE_SHARE,
    Math.max(
      MIN_MOBILE_SPRITE_SHARE,
      Math.round(value),
    ),
  )
}

function loadMobileSpriteShare(): number {
  if (typeof window === 'undefined') {
    return DEFAULT_MOBILE_SPRITE_SHARE
  }

  const storedValue =
    window.localStorage.getItem(
      MOBILE_SPRITE_SHARE_STORAGE_KEY,
    )

  if (!storedValue) {
    return DEFAULT_MOBILE_SPRITE_SHARE
  }

  const numericValue =
    Number(storedValue)

  if (!Number.isFinite(numericValue)) {
    return DEFAULT_MOBILE_SPRITE_SHARE
  }

  return clampMobileSpriteShare(
    numericValue,
  )
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Si è verificato un errore imprevisto.'
}

function getLocale(language: string): string {
  const locales: Record<string, string> = {
    it: 'it-IT',
    en: 'en-US',
    fr: 'fr-FR',
    de: 'de-DE',
    es: 'es-ES',
  }

  return locales[language] ?? 'it-IT'
}

function normalizeStoredEmotion(
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

function getEmotionUiLabel(
  emotion: EmotionalState,
): string {
  if (emotion === 'horny') {
    return 'Excited'
  }

  return EMOTION_LABELS[emotion]
}

function sortKeyMemories(
  memories: KeyMemory[],
): KeyMemory[] {
  return [...memories].sort(
    (left, right) => {
      const importanceDifference =
        right.importance -
        left.importance

      if (importanceDifference !== 0) {
        return importanceDifference
      }

      return (
        new Date(
          right.updated_at,
        ).getTime() -
        new Date(
          left.updated_at,
        ).getTime()
      )
    },
  )
}

export function LifeformChat({
  profile,
  lifeform,
  apiKey,
  signingOut,
  onSignOut,
  onDisconnectGemini,
}: LifeformChatProps) {
  const [messages, setMessages] =
    useState<ChatMessage[]>([])

  const [keyMemories, setKeyMemories] =
    useState<KeyMemory[]>([])

  const [loadingKeyMemories, setLoadingKeyMemories] =
    useState(true)

  const [savingKeyMemory, setSavingKeyMemory] =
    useState(false)

  const [keyMemoryError, setKeyMemoryError] =
    useState<string | null>(null)

  const [draft, setDraft] = useState('')
  const [loadingMessages, setLoadingMessages] =
    useState(true)
  const [loadingOlder, setLoadingOlder] =
    useState(false)
  const [hasOlderMessages, setHasOlderMessages] =
    useState(false)
  const [sending, setSending] = useState(false)
  const [streamingText, setStreamingText] =
    useState('')
  const [error, setError] =
    useState<string | null>(null)
  const [clearingChat, setClearingChat] =
    useState(false)

  const [selectedModel, setSelectedModel] =
    useState<GeminiModelId>(() =>
      loadStoredGeminiModel(),
    )

  const [dailyTokenLimit, setDailyTokenLimit] =
    useState(() =>
      loadStoredDailyTokenLimit(),
    )

  const [dailyTokensUsed, setDailyTokensUsed] =
    useState(0)

  const [tokenUsageDate, setTokenUsageDate] =
    useState(() =>
      getLocalTokenUsageDate(),
    )

  const [
    savingTokenSettings,
    setSavingTokenSettings,
  ] = useState(false)

  const [
    tokenSettingsSaveError,
    setTokenSettingsSaveError,
  ] = useState<string | null>(null)

  const [settledEmotion, setSettledEmotion] =
    useState<EmotionalState>(() =>
      normalizeStoredEmotion(
        lifeform.current_emotion,
      ),
    )

  const [emotionIntensity, setEmotionIntensity] =
    useState(lifeform.emotion_intensity)

  const [emotionLevels, setEmotionLevels] =
    useState<EmotionLevels>(() =>
      createDefaultEmotionLevels(),
    )

  const [
    emotionalSensitivities,
    setEmotionalSensitivities,
  ] = useState<EmotionalSensitivities>(
    () => ({
      ...lifeform
        .emotional_sensitivities,
    }),
  )

  const [
    transientEmotion,
    setTransientEmotion,
  ] = useState<EmotionalState | null>(
    null,
  )

  const [
    transientEmotionIntensity,
    setTransientEmotionIntensity,
  ] = useState(0)

  const [
    savingSensitivities,
    setSavingSensitivities,
  ] = useState(false)

  const [
    sensitivitySaveError,
    setSensitivitySaveError,
  ] = useState<string | null>(null)

  const [emotionPanelOpen, setEmotionPanelOpen] =
    useState(false)

  const [keyMemoryPanelOpen, setKeyMemoryPanelOpen] =
    useState(false)

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false)

  const [
    mobileSpriteShare,
    setMobileSpriteShare,
  ] = useState(
    loadMobileSpriteShare,
  )

  const [
    resizingMobileStage,
    setResizingMobileStage,
  ] = useState(false)

  const [analyzingEmotion, setAnalyzingEmotion] =
    useState(false)

  const [lastEmotionReason, setLastEmotionReason] =
    useState<string | null>(null)

  const [
    emotionAnalysisSource,
    setEmotionAnalysisSource,
  ] = useState<EmotionalAnalysisSource | null>(
    null,
  )

  const chatBodyRef =
    useRef<HTMLDivElement | null>(null)

  const messageListRef =
    useRef<HTMLDivElement | null>(null)

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(null)

  const stickToBottomRef = useRef(true)

  const keyMemoriesRef =
    useRef<KeyMemory[]>([])

  const transientEmotionTimerRef =
    useRef<number | null>(null)

  const sensitivitySaveTimerRef =
    useRef<number | null>(null)

  const tokenSettingsSaveTimerRef =
    useRef<number | null>(null)

  const emotionalSensitivitiesRef =
    useRef<EmotionalSensitivities>({
      ...lifeform
        .emotional_sensitivities,
    })

  const dailyTokenLimitRef =
    useRef(dailyTokenLimit)

  const dailyTokensUsedRef =
    useRef(0)

  const tokenUsageDateRef =
    useRef(tokenUsageDate)

  const emotionLevelsRef =
    useRef<EmotionLevels>(
      createDefaultEmotionLevels(),
    )

  const settledEmotionRef =
    useRef<EmotionalState>(
      normalizeStoredEmotion(
        lifeform.current_emotion,
      ),
    )

  const locale = getLocale(
    profile.interface_language,
  )

  useEffect(() => {
    window.localStorage.setItem(
      MOBILE_SPRITE_SHARE_STORAGE_KEY,
      String(mobileSpriteShare),
    )
  }, [mobileSpriteShare])

  useEffect(() => {
    keyMemoriesRef.current =
      keyMemories
  }, [keyMemories])

  useEffect(() => {
    if (!mobileMenuOpen) {
      return
    }

    const handleKeyDown = (
      event: globalThis.KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    dailyTokenLimitRef.current =
      dailyTokenLimit
  }, [dailyTokenLimit])

  useEffect(() => {
    dailyTokensUsedRef.current =
      dailyTokensUsed
  }, [dailyTokensUsed])

  useEffect(() => {
    tokenUsageDateRef.current =
      tokenUsageDate
  }, [tokenUsageDate])

  useEffect(() => {
    emotionLevelsRef.current =
      emotionLevels
  }, [emotionLevels])

  useEffect(() => {
    settledEmotionRef.current =
      settledEmotion
  }, [settledEmotion])

  useEffect(() => {
    setSettledEmotion(
      normalizeStoredEmotion(
        lifeform.current_emotion,
      ),
    )

    setEmotionIntensity(
      lifeform.emotion_intensity,
    )
  }, [
    lifeform.current_emotion,
    lifeform.emotion_intensity,
  ])

  useEffect(() => {
    return () => {
      if (
        transientEmotionTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          transientEmotionTimerRef.current,
        )
      }

      if (
        sensitivitySaveTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          sensitivitySaveTimerRef.current,
        )
      }

      if (
        tokenSettingsSaveTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          tokenSettingsSaveTimerRef.current,
        )
      }
    }
  }, [])

  const loadEmotionState = useCallback(
    async () => {
      const { data, error: queryError } =
        await supabase
          .from('lifeforms')
          .select(
            'current_emotion,emotion_intensity,emotion_levels,emotional_sensitivities,daily_token_limit,daily_tokens_used,token_usage_date',
          )
          .eq('id', lifeform.id)
          .single()

      if (queryError) {
        console.warn(
          'Impossibile caricare i livelli emotivi:',
          queryError,
        )
        return
      }

      const row = data as EmotionStateRow
      const today = getLocalTokenUsageDate()
      const configuredLimit =
        loadStoredDailyTokenLimit()
      const usedToday =
        row.token_usage_date === today
          ? Math.max(
              0,
              Math.round(
                row.daily_tokens_used ?? 0,
              ),
            )
          : 0

      const baseLevels =
        normalizeEmotionLevels(
          row.emotion_levels,
        )

      const nextLevels =
        applyDailyTokenTiredness(
          baseLevels,
          usedToday,
          configuredLimit,
        )

      const selected =
        selectEmotionFromLevels(
          nextLevels,
          normalizeStoredEmotion(
            row.current_emotion,
          ),
        )

      setSettledEmotion(
        selected.emotion,
      )
      settledEmotionRef.current =
        selected.emotion

      setEmotionIntensity(
        selected.intensity,
      )

      setEmotionLevels(nextLevels)
      emotionLevelsRef.current =
        nextLevels

      setDailyTokenLimit(
        configuredLimit,
      )
      dailyTokenLimitRef.current =
        configuredLimit

      setDailyTokensUsed(usedToday)
      dailyTokensUsedRef.current =
        usedToday

      setTokenUsageDate(today)
      tokenUsageDateRef.current = today

      const nextSensitivities = {
        ...row.emotional_sensitivities,
      }

      emotionalSensitivitiesRef.current =
        nextSensitivities

      setEmotionalSensitivities(
        nextSensitivities,
      )

      const { error: syncError } =
        await supabase
          .from('lifeforms')
          .update({
            current_emotion:
              selected.emotion,
            emotion_intensity:
              selected.intensity,
            emotion_levels:
              nextLevels,
            daily_token_limit:
              configuredLimit,
            daily_tokens_used:
              usedToday,
            token_usage_date: today,
          })
          .eq('id', lifeform.id)

      if (syncError) {
        console.warn(
          'Impossibile sincronizzare il consumo token:',
          syncError,
        )
      }
    },
    [lifeform.id],
  )

  const loadKeyMemories = useCallback(
    async () => {
      setLoadingKeyMemories(true)
      setKeyMemoryError(null)

      try {
        const {
          data,
          error: queryError,
        } = await supabase
          .from('key_memories')
          .select(
            'id,user_id,lifeform_id,category,content,importance,source,created_at,updated_at',
          )
          .eq('lifeform_id', lifeform.id)
          .order('importance', {
            ascending: false,
          })
          .order('updated_at', {
            ascending: false,
          })
          .limit(MAX_KEY_MEMORIES)

        if (queryError) {
          throw queryError
        }

        const loadedMemories =
          sortKeyMemories(
            (data ?? []) as KeyMemory[],
          )

        keyMemoriesRef.current =
          loadedMemories

        setKeyMemories(
          loadedMemories,
        )
      } catch (loadError: unknown) {
        setKeyMemoryError(
          getErrorMessage(loadError),
        )
      } finally {
        setLoadingKeyMemories(false)
      }
    },
    [lifeform.id],
  )

  const loadInitialMessages = useCallback(
    async () => {
      setLoadingMessages(true)
      setError(null)

      try {
        const {
          data,
          error: queryError,
        } = await supabase
          .from('messages')
          .select(
            'id,user_id,lifeform_id,role,content,metadata,created_at',
          )
          .eq('lifeform_id', lifeform.id)
          .order('created_at', {
            ascending: false,
          })
          .limit(MESSAGE_PAGE_SIZE)

        if (queryError) {
          throw queryError
        }

        const rows =
          (data ?? []) as ChatMessage[]

        const orderedRows =
          [...rows].reverse()

        setMessages(orderedRows)

        setHasOlderMessages(
          rows.length === MESSAGE_PAGE_SIZE,
        )

        stickToBottomRef.current = true

        requestAnimationFrame(() => {
          const container =
            messageListRef.current

          if (container) {
            container.scrollTop =
              container.scrollHeight
          }
        })
      } catch (loadError: unknown) {
        setError(
          getErrorMessage(loadError),
        )
      } finally {
        setLoadingMessages(false)
      }
    },
    [lifeform.id],
  )

  useEffect(() => {
    void loadInitialMessages()
    void loadEmotionState()
    void loadKeyMemories()
  }, [
    loadInitialMessages,
    loadEmotionState,
    loadKeyMemories,
  ])

  useEffect(() => {
    if (!stickToBottomRef.current) {
      return
    }

    const container =
      messageListRef.current

    if (!container) {
      return
    }

    requestAnimationFrame(() => {
      container.scrollTop =
        container.scrollHeight
    })
  }, [messages, streamingText])

  const handleMessageListScroll = () => {
    const container =
      messageListRef.current

    if (!container) {
      return
    }

    const distanceFromBottom =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight

    stickToBottomRef.current =
      distanceFromBottom < 100
  }

  const loadOlderMessages = async () => {
    const oldestMessage = messages[0]

    if (
      !oldestMessage ||
      loadingOlder ||
      !hasOlderMessages
    ) {
      return
    }

    setLoadingOlder(true)
    setError(null)

    const container =
      messageListRef.current

    const previousScrollHeight =
      container?.scrollHeight ?? 0

    try {
      const {
        data,
        error: queryError,
      } = await supabase
        .from('messages')
        .select(
          'id,user_id,lifeform_id,role,content,metadata,created_at',
        )
        .eq('lifeform_id', lifeform.id)
        .lt(
          'created_at',
          oldestMessage.created_at,
        )
        .order('created_at', {
          ascending: false,
        })
        .limit(MESSAGE_PAGE_SIZE)

      if (queryError) {
        throw queryError
      }

      const rows =
        (data ?? []) as ChatMessage[]

      const orderedRows =
        [...rows].reverse()

      setMessages(
        (currentMessages) => [
          ...orderedRows,
          ...currentMessages,
        ],
      )

      setHasOlderMessages(
        rows.length === MESSAGE_PAGE_SIZE,
      )

      requestAnimationFrame(() => {
        if (!container) {
          return
        }

        const newScrollHeight =
          container.scrollHeight

        container.scrollTop =
          newScrollHeight -
          previousScrollHeight
      })
    } catch (loadError: unknown) {
      setError(
        getErrorMessage(loadError),
      )
    } finally {
      setLoadingOlder(false)
    }
  }

  const commitKeyMemories = (
    nextMemories: KeyMemory[],
  ) => {
    const orderedMemories =
      sortKeyMemories(
        nextMemories,
      ).slice(0, MAX_KEY_MEMORIES)

    keyMemoriesRef.current =
      orderedMemories

    setKeyMemories(
      orderedMemories,
    )
  }

  const handleCreateKeyMemory = async (
    input: KeyMemoryInput,
  ) => {
    if (
      keyMemoriesRef.current.length >=
      MAX_KEY_MEMORIES
    ) {
      setKeyMemoryError(
        'Il limite di 10 Key Memories è già stato raggiunto.',
      )
      return
    }

    const normalized =
      normalizeKeyMemoryInput(input)

    if (!normalized.content) {
      setKeyMemoryError(
        'La memoria non può essere vuota.',
      )
      return
    }

    setSavingKeyMemory(true)
    setKeyMemoryError(null)

    try {
      const {
        data,
        error: insertError,
      } = await supabase
        .from('key_memories')
        .insert({
          user_id: lifeform.user_id,
          lifeform_id: lifeform.id,
          category: normalized.category,
          content: normalized.content,
          importance:
            normalized.importance,
          source: 'manual',
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      if (!data) {
        throw new Error(
          'La memoria non è stata restituita dal database.',
        )
      }

      commitKeyMemories([
        ...keyMemoriesRef.current,
        data as KeyMemory,
      ])
    } catch (saveError: unknown) {
      setKeyMemoryError(
        getErrorMessage(saveError),
      )
      throw saveError
    } finally {
      setSavingKeyMemory(false)
    }
  }

  const handleUpdateKeyMemory = async (
    id: string,
    input: KeyMemoryInput,
  ) => {
    const normalized =
      normalizeKeyMemoryInput(input)

    if (!normalized.content) {
      setKeyMemoryError(
        'La memoria non può essere vuota.',
      )
      return
    }

    setSavingKeyMemory(true)
    setKeyMemoryError(null)

    try {
      const {
        data,
        error: updateError,
      } = await supabase
        .from('key_memories')
        .update({
          category: normalized.category,
          content: normalized.content,
          importance:
            normalized.importance,
          source: 'manual',
        })
        .eq('id', id)
        .eq('lifeform_id', lifeform.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      if (!data) {
        throw new Error(
          'La memoria aggiornata non è stata restituita dal database.',
        )
      }

      commitKeyMemories([
        ...keyMemoriesRef.current.filter(
          (memory) => memory.id !== id,
        ),
        data as KeyMemory,
      ])
    } catch (saveError: unknown) {
      setKeyMemoryError(
        getErrorMessage(saveError),
      )
      throw saveError
    } finally {
      setSavingKeyMemory(false)
    }
  }

  const handleDeleteKeyMemory = async (
    id: string,
  ) => {
    setSavingKeyMemory(true)
    setKeyMemoryError(null)

    try {
      const { error: deleteError } =
        await supabase
          .from('key_memories')
          .delete()
          .eq('id', id)
          .eq('lifeform_id', lifeform.id)

      if (deleteError) {
        throw deleteError
      }

      commitKeyMemories(
        keyMemoriesRef.current.filter(
          (memory) => memory.id !== id,
        ),
      )
    } catch (deleteMemoryError: unknown) {
      setKeyMemoryError(
        getErrorMessage(
          deleteMemoryError,
        ),
      )
      throw deleteMemoryError
    } finally {
      setSavingKeyMemory(false)
    }
  }

  const updateAutomaticKeyMemory = async (
    memory: KeyMemory,
    candidate: KeyMemoryCandidate,
  ) => {
    const {
      data,
      error: updateError,
    } = await supabase
      .from('key_memories')
      .update({
        category: candidate.category,
        content: candidate.content,
        importance: Math.max(
          memory.importance,
          candidate.importance,
        ),
        source: 'auto',
      })
      .eq('id', memory.id)
      .eq('lifeform_id', lifeform.id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    if (!data) {
      throw new Error(
        'La Key Memory automatica aggiornata non è stata restituita.',
      )
    }

    commitKeyMemories([
      ...keyMemoriesRef.current.filter(
        (currentMemory) =>
          currentMemory.id !== memory.id,
      ),
      data as KeyMemory,
    ])
  }

  const createAutomaticKeyMemory = async (
    candidate: KeyMemoryCandidate,
  ) => {
    const {
      data,
      error: insertError,
    } = await supabase
      .from('key_memories')
      .insert({
        user_id: lifeform.user_id,
        lifeform_id: lifeform.id,
        category: candidate.category,
        content: candidate.content,
        importance:
          candidate.importance,
        source: 'auto',
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    if (!data) {
      throw new Error(
        'La nuova Key Memory automatica non è stata restituita.',
      )
    }

    commitKeyMemories([
      ...keyMemoriesRef.current,
      data as KeyMemory,
    ])
  }

  const applyAutonomousMemoryCandidate =
    async (
      candidate:
        KeyMemoryCandidate | null,
    ) => {
      if (!candidate) {
        return
      }

      const currentMemories =
        keyMemoriesRef.current

      if (
        candidate.action === 'update' &&
        candidate.memoryId
      ) {
        const requestedMemory =
          currentMemories.find(
            (memory) =>
              memory.id ===
              candidate.memoryId,
          )

        if (
          requestedMemory &&
          requestedMemory.source === 'auto'
        ) {
          await updateAutomaticKeyMemory(
            requestedMemory,
            candidate,
          )
        }

        return
      }

      const similarMemory =
        findSimilarKeyMemory(
          currentMemories,
          candidate.content,
        )

      if (similarMemory) {
        if (
          similarMemory.source === 'auto'
        ) {
          await updateAutomaticKeyMemory(
            similarMemory,
            candidate,
          )
        }

        return
      }

      if (
        currentMemories.length <
        MAX_KEY_MEMORIES
      ) {
        await createAutomaticKeyMemory(
          candidate,
        )
        return
      }

      const replaceableMemory = [
        ...currentMemories,
      ]
        .filter(
          (memory) =>
            memory.source === 'auto',
        )
        .sort(
          (left, right) =>
            left.importance -
            right.importance,
        )[0]

      if (
        !replaceableMemory ||
        candidate.importance <
          replaceableMemory.importance +
            AUTO_MEMORY_REPLACEMENT_MARGIN
      ) {
        return
      }

      await updateAutomaticKeyMemory(
        replaceableMemory,
        candidate,
      )
    }

  const clearImmediateReaction =
    () => {
      if (
        transientEmotionTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          transientEmotionTimerRef.current,
        )

        transientEmotionTimerRef.current =
          null
      }

      setTransientEmotion(null)
      setTransientEmotionIntensity(0)
    }

  const showImmediateReaction =
    (
      emotion: EmotionalState,
      intensity: number,
    ) => {
      clearImmediateReaction()

      setTransientEmotion(emotion)
      setTransientEmotionIntensity(
        intensity,
      )

      transientEmotionTimerRef.current =
        window.setTimeout(() => {
          setTransientEmotion(null)
          setTransientEmotionIntensity(0)

          transientEmotionTimerRef.current =
            null
        }, IMMEDIATE_REACTION_DURATION_MS)
    }

  const scheduleSensitivitySave =
    (
      nextSensitivities:
        EmotionalSensitivities,
    ) => {
      if (
        sensitivitySaveTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          sensitivitySaveTimerRef.current,
        )
      }

      if (
        tokenSettingsSaveTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          tokenSettingsSaveTimerRef.current,
        )
      }

      setSavingSensitivities(true)
      setSensitivitySaveError(null)

      sensitivitySaveTimerRef.current =
        window.setTimeout(() => {
          sensitivitySaveTimerRef.current =
            null

          void (async () => {
            const {
              error: updateError,
            } = await supabase
              .from('lifeforms')
              .update({
                emotional_sensitivities:
                  nextSensitivities,
                last_seen_at:
                  new Date().toISOString(),
              })
              .eq('id', lifeform.id)

            if (updateError) {
              setSensitivitySaveError(
                'Impossibile salvare le sensibilità: ' +
                  updateError.message,
              )
            }

            setSavingSensitivities(false)
          })()
        }, SENSITIVITY_SAVE_DELAY_MS)
    }

  const handleSensitivityChange =
    (
      emotion: TrackedEmotion,
      value: number,
    ) => {
      if (emotion === 'tired') {
        return
      }

      const normalizedValue =
        Math.min(
          100,
          Math.max(
            0,
            Math.round(value),
          ),
        )

      const nextSensitivities = {
        ...emotionalSensitivitiesRef.current,
        [emotion]: normalizedValue,
      }

      emotionalSensitivitiesRef.current =
        nextSensitivities

      setEmotionalSensitivities(
        nextSensitivities,
      )

      scheduleSensitivitySave(
        nextSensitivities,
      )
    }

  const scheduleTokenSettingsSave =
    (
      nextLimit: number,
      nextLevels: EmotionLevels,
      nextEmotion: EmotionalState,
      nextIntensity: number,
      previousEmotion: EmotionalState,
    ) => {
      if (
        tokenSettingsSaveTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          tokenSettingsSaveTimerRef.current,
        )
      }

      setSavingTokenSettings(true)
      setTokenSettingsSaveError(null)

      tokenSettingsSaveTimerRef.current =
        window.setTimeout(() => {
          tokenSettingsSaveTimerRef.current =
            null

          void (async () => {
            const { error: updateError } =
              await supabase
                .from('lifeforms')
                .update({
                  previous_emotion:
                    previousEmotion,
                  current_emotion:
                    nextEmotion,
                  emotion_intensity:
                    nextIntensity,
                  emotion_levels:
                    nextLevels,
                  daily_token_limit:
                    nextLimit,
                  daily_tokens_used:
                    dailyTokensUsedRef.current,
                  token_usage_date:
                    tokenUsageDateRef.current,
                  last_seen_at:
                    new Date().toISOString(),
                })
                .eq('id', lifeform.id)

            if (updateError) {
              setTokenSettingsSaveError(
                'Impossibile salvare la soglia token: ' +
                  updateError.message,
              )
            }

            setSavingTokenSettings(false)
          })()
        }, TOKEN_SETTINGS_SAVE_DELAY_MS)
    }

  const handleDailyTokenLimitChange =
    (value: number) => {
      const nextLimit =
        normalizeDailyTokenLimit(value)

      const previousEmotion =
        settledEmotionRef.current

      const nextLevels =
        applyDailyTokenTiredness(
          emotionLevelsRef.current,
          dailyTokensUsedRef.current,
          nextLimit,
        )

      const selected =
        selectEmotionFromLevels(
          nextLevels,
          previousEmotion,
        )

      saveStoredDailyTokenLimit(
        nextLimit,
      )

      setDailyTokenLimit(nextLimit)
      dailyTokenLimitRef.current =
        nextLimit

      setEmotionLevels(nextLevels)
      emotionLevelsRef.current =
        nextLevels

      setSettledEmotion(
        selected.emotion,
      )
      settledEmotionRef.current =
        selected.emotion

      setEmotionIntensity(
        selected.intensity,
      )

      scheduleTokenSettingsSave(
        nextLimit,
        nextLevels,
        selected.emotion,
        selected.intensity,
        previousEmotion,
      )
    }

  const buildSystemInstruction =
    (): string => {
      const userName =
        profile.display_name?.trim() ||
        'the user'

      const emotionalResponseContext =
        buildEmotionalResponseContext({
          currentEmotion:
            settledEmotion,
          intensity:
            emotionIntensity,
          levels:
            emotionLevels,
        })

      const keyMemoryContext =
        buildKeyMemoriesContext(
          keyMemoriesRef.current,
        )

      return [
        'Your name is ' +
          lifeform.name +
          '.',
        'You are the persistent AI presence connected to a user named ' +
          userName +
          '.',
        'Your primary language is "' +
          lifeform.language +
          '". Reply in that language unless the user asks you to use another language.',
        'Preserve the full general capabilities of the underlying Gemini model.',
        'Answer the actual request directly and competently before adding personality.',
        'You may sound natural, warm and recognizable, but do not turn every answer into an introspective monologue.',
        emotionalResponseContext,
        keyMemoryContext,
        'The supplied Key Memories are the only long-term memories currently available. Use them as persistent context, but never invent additional memories.',
        'If a Key Memory conflicts with the latest explicit statement from the user, follow the latest statement and allow the memory system to update afterward.',
        'Do not pretend to have used tools, searched the web, opened files or performed actions unless those tools were actually provided in the request.',
        'Do not repeatedly announce that you are an AI unless it is directly relevant.',
      ].join('\n')
    }

  const updatePersistentEmotion =
    async (
      analysis: EmotionalAnalysis,
      tokenUsage: GeminiTokenUsage,
    ) => {
      const previousEmotion =
        settledEmotionRef.current

      const today =
        getLocalTokenUsageDate()

      const currentDailyTokens =
        tokenUsageDateRef.current === today
          ? dailyTokensUsedRef.current
          : 0

      const nextDailyTokens =
        currentDailyTokens +
        Math.max(
          0,
          tokenUsage.totalTokens,
        )

      const nextLevels =
        applyDailyTokenTiredness(
          analysis.levels,
          nextDailyTokens,
          dailyTokenLimitRef.current,
        )

      const selected =
        selectEmotionFromLevels(
          nextLevels,
          analysis.emotion,
        )

      setSettledEmotion(
        selected.emotion,
      )
      settledEmotionRef.current =
        selected.emotion

      setEmotionIntensity(
        selected.intensity,
      )

      setEmotionLevels(nextLevels)
      emotionLevelsRef.current =
        nextLevels

      setDailyTokensUsed(
        nextDailyTokens,
      )
      dailyTokensUsedRef.current =
        nextDailyTokens

      setTokenUsageDate(today)
      tokenUsageDateRef.current = today

      setLastEmotionReason(
        analysis.reason,
      )

      setEmotionAnalysisSource(
        analysis.source,
      )

      const { error: updateError } =
        await supabase
          .from('lifeforms')
          .update({
            previous_emotion:
              previousEmotion,
            current_emotion:
              selected.emotion,
            emotion_intensity:
              selected.intensity,
            emotion_levels:
              nextLevels,
            daily_token_limit:
              dailyTokenLimitRef.current,
            daily_tokens_used:
              nextDailyTokens,
            token_usage_date: today,
            last_seen_at:
              new Date().toISOString(),
          })
          .eq('id', lifeform.id)

      if (updateError) {
        console.warn(
          'Impossibile salvare lo stato emotivo:',
          updateError,
        )
      }
    }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const cleanMessage =
      draft.trim()

    if (!cleanMessage || sending) {
      return
    }

    if (
      cleanMessage.length >
      MAX_MESSAGE_LENGTH
    ) {
      setError(
        'Il messaggio supera il limite di ' +
          MAX_MESSAGE_LENGTH.toLocaleString(
            locale,
          ) +
          ' caratteri.',
      )
      return
    }

    const previousContext =
      messages
        .slice(-GEMINI_CONTEXT_SIZE)
        .map((message) => ({
          role: message.role,
          content: message.content,
        }))

    let immediateReaction:
      | {
          emotion: EmotionalState
          intensity: number
        }
      | null = null

    let replyTokenUsage: GeminiTokenUsage = {
      ...EMPTY_GEMINI_TOKEN_USAGE,
    }

    clearImmediateReaction()
    setSending(true)
    setError(null)
    setStreamingText('')
    stickToBottomRef.current = true

    try {
      const {
        data: insertedUserMessage,
        error: userInsertError,
      } = await supabase
        .from('messages')
        .insert({
          user_id: lifeform.user_id,
          lifeform_id: lifeform.id,
          role: 'user',
          content: cleanMessage,
          metadata: {},
        })
        .select()
        .single()

      if (userInsertError) {
        throw userInsertError
      }

      if (!insertedUserMessage) {
        throw new Error(
          'Il messaggio non è stato restituito dal database.',
        )
      }

      setMessages(
        (currentMessages) => [
          ...currentMessages,
          insertedUserMessage as ChatMessage,
        ],
      )

      setDraft('')

      const assistantResponse =
        await streamGeminiReplyWithModel({
          apiKey,
          model: selectedModel,
          history: previousContext,
          prompt: cleanMessage,
          systemInstruction:
            buildSystemInstruction(),
          onText: setStreamingText,
          onUsage: (usage) => {
            replyTokenUsage = usage
          },
        })

      const {
        data: insertedAssistantMessage,
        error: assistantInsertError,
      } = await supabase
        .from('messages')
        .insert({
          user_id: lifeform.user_id,
          lifeform_id: lifeform.id,
          role: 'assistant',
          content: assistantResponse,
          metadata: {
            provider: 'google',
            model:
              selectedModel,
            token_usage:
              replyTokenUsage,
          },
        })
        .select()
        .single()

      if (assistantInsertError) {
        throw new Error(
          'La risposta è stata generata ma non è stato possibile salvarla: ' +
            assistantInsertError.message,
        )
      }

      if (
        !insertedAssistantMessage
      ) {
        throw new Error(
          'La risposta è stata generata ma non restituita dal database.',
        )
      }

      setMessages(
        (currentMessages) => [
          ...currentMessages,
          insertedAssistantMessage as ChatMessage,
        ],
      )

      setStreamingText('')
      setAnalyzingEmotion(true)

      try {
        const analysis =
          await analyzeEmotionalState({
            apiKey,
            model: selectedModel,
            lifeformName:
              lifeform.name,
            currentEmotion:
              settledEmotion,
            currentLevels:
              emotionLevels,
            sensitivities:
              emotionalSensitivities,
            keyMemories:
              keyMemoriesRef.current,
            recentHistory:
              previousContext.slice(
                -EMOTION_CONTEXT_SIZE,
              ),
            userMessage:
              cleanMessage,
            assistantResponse,
          })

        const completeTokenUsage =
          addGeminiTokenUsage(
            replyTokenUsage,
            analysis.tokenUsage,
          )

        await updatePersistentEmotion(
          analysis,
          completeTokenUsage,
        )

        try {
          await applyAutonomousMemoryCandidate(
            analysis.memoryCandidate,
          )
        } catch (memoryError: unknown) {
          console.warn(
            'Aggiornamento automatico delle Key Memories non disponibile:',
            memoryError,
          )
        }

        immediateReaction = {
          emotion:
            analysis.immediateEmotion,
          intensity:
            analysis.immediateIntensity,
        }
      } finally {
        setAnalyzingEmotion(false)
      }
    } catch (sendError: unknown) {
      setError(
        getErrorMessage(sendError),
      )
    } finally {
      setSending(false)

      if (immediateReaction) {
        const reaction =
          immediateReaction

        window.setTimeout(() => {
          showImmediateReaction(
            reaction.emotion,
            reaction.intensity,
          )
        }, 0)
      }

      requestAnimationFrame(() => {
        textareaRef.current?.focus()
      })
    }
  }

  const handleTextareaKeyDown = (
    event:
      KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()

      event.currentTarget.form
        ?.requestSubmit()
    }
  }

  const handleClearChat =
    async () => {
      if (
        sending ||
        clearingChat
      ) {
        return
      }

      const confirmed =
        window.confirm(
          'Vuoi eliminare definitivamente tutta la cronologia e azzerare tutti i parametri emotivi? Le Key Memories resteranno conservate. Questa operazione non può essere annullata.',
        )

      if (!confirmed) {
        return
      }

      setClearingChat(true)
      setError(null)

      try {
        const resetLevels =
          createDefaultEmotionLevels()

        const {
          error: deleteError,
        } = await supabase
          .from('messages')
          .delete()
          .eq(
            'lifeform_id',
            lifeform.id,
          )

        if (deleteError) {
          throw deleteError
        }

        const {
          error: resetError,
        } = await supabase
          .from('lifeforms')
          .update({
            previous_emotion:
              'neutral',
            current_emotion:
              'neutral',
            emotion_intensity:
              0,
            emotion_levels:
              resetLevels,
            daily_tokens_used:
              0,
            token_usage_date:
              getLocalTokenUsageDate(),
            last_seen_at:
              new Date().toISOString(),
          })
          .eq('id', lifeform.id)

        if (resetError) {
          throw new Error(
            'La chat è stata eliminata, ma non è stato possibile azzerare i parametri emotivi: ' +
              resetError.message,
          )
        }

        setMessages([])
        setStreamingText('')
        setHasOlderMessages(false)
        setSettledEmotion('neutral')
        setEmotionIntensity(0)
        setEmotionLevels(resetLevels)
        emotionLevelsRef.current =
          resetLevels
        settledEmotionRef.current =
          'neutral'
        setDailyTokensUsed(0)
        dailyTokensUsedRef.current = 0
        const today =
          getLocalTokenUsageDate()
        setTokenUsageDate(today)
        tokenUsageDateRef.current = today
        setLastEmotionReason(null)
        setEmotionAnalysisSource(null)
        setAnalyzingEmotion(false)
        clearImmediateReaction()
      } catch (clearError: unknown) {
        setError(
          getErrorMessage(clearError),
        )
      } finally {
        setClearingChat(false)
      }
    }

  const displayedEmotion:
    EmotionalState = sending
      ? 'thinking'
      : transientEmotion ??
        settledEmotion

  const displayedEmotionIntensity =
    sending
      ? 0
      : transientEmotion !== null
        ? transientEmotionIntensity
        : emotionIntensity

  const updateMobileSpriteShareFromPointer =
    (clientY: number) => {
      const container =
        chatBodyRef.current

      if (!container) {
        return
      }

      const bounds =
        container.getBoundingClientRect()

      if (bounds.height <= 0) {
        return
      }

      const viewportHeight =
        window.visualViewport?.height ??
        window.innerHeight

      if (viewportHeight <= 0) {
        return
      }

      const nextShare =
        ((clientY - bounds.top) /
          viewportHeight) *
        100

      setMobileSpriteShare(
        clampMobileSpriteShare(
          nextShare,
        ),
      )
    }

  const handleMobileDividerPointerDown =
    (
      event:
        ReactPointerEvent<HTMLDivElement>,
    ) => {
      event.preventDefault()

      event.currentTarget.setPointerCapture(
        event.pointerId,
      )

      setResizingMobileStage(true)

      updateMobileSpriteShareFromPointer(
        event.clientY,
      )
    }

  const handleMobileDividerPointerMove =
    (
      event:
        ReactPointerEvent<HTMLDivElement>,
    ) => {
      if (!resizingMobileStage) {
        return
      }

      event.preventDefault()

      updateMobileSpriteShareFromPointer(
        event.clientY,
      )
    }

  const finishMobileDividerResize =
    (
      event:
        ReactPointerEvent<HTMLDivElement>,
    ) => {
      if (
        event.currentTarget.hasPointerCapture(
          event.pointerId,
        )
      ) {
        event.currentTarget.releasePointerCapture(
          event.pointerId,
        )
      }

      setResizingMobileStage(false)
    }

  const handleMobileDividerKeyDown =
    (
      event:
        KeyboardEvent<HTMLDivElement>,
    ) => {
      let nextShare:
        number | null = null

      if (event.key === 'ArrowUp') {
        nextShare =
          mobileSpriteShare -
          MOBILE_SPRITE_SHARE_STEP
      }

      if (event.key === 'ArrowDown') {
        nextShare =
          mobileSpriteShare +
          MOBILE_SPRITE_SHARE_STEP
      }

      if (event.key === 'Home') {
        nextShare =
          MIN_MOBILE_SPRITE_SHARE
      }

      if (event.key === 'End') {
        nextShare =
          MAX_MOBILE_SPRITE_SHARE
      }

      if (
        event.key === 'Enter' ||
        event.key === ' '
      ) {
        nextShare =
          DEFAULT_MOBILE_SPRITE_SHARE
      }

      if (nextShare === null) {
        return
      }

      event.preventDefault()

      setMobileSpriteShare(
        clampMobileSpriteShare(
          nextShare,
        ),
      )
    }

  const mobileStageStyle = {
    '--mobile-sprite-height':
      String(mobileSpriteShare) +
      'dvh',
  } as CSSProperties

  return (
    <main className="chat-page">
      <section className="chat-shell">
        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label="Apri menu"
          aria-controls="lifeform-mobile-menu"
          aria-expanded={mobileMenuOpen}
          onClick={() =>
            setMobileMenuOpen(
              (currentValue) =>
                !currentValue,
            )
          }
        >
          <span />
          <span />
          <span />
        </button>

        <button
          type="button"
          className={
            mobileMenuOpen
              ? 'mobile-menu-backdrop mobile-menu-backdrop-open'
              : 'mobile-menu-backdrop'
          }
          aria-label="Chiudi menu"
          tabIndex={
            mobileMenuOpen ? 0 : -1
          }
          onClick={() =>
            setMobileMenuOpen(false)
          }
        />

        <header
          id="lifeform-mobile-menu"
          className={
            mobileMenuOpen
              ? 'chat-header mobile-menu-open'
              : 'chat-header'
          }
        >
          <button
            type="button"
            className="mobile-menu-close"
            aria-label="Chiudi menu"
            onClick={() =>
              setMobileMenuOpen(false)
            }
          >
            ×
          </button>
          <div className="chat-identity">
            <div
              className="chat-status-dot"
              aria-hidden="true"
            />

            <div>
              <p className="eyebrow">
                Connessione attiva
              </p>

              <h1>
                {lifeform.name}
              </h1>
            </div>
          </div>

          <section
            className="mobile-drawer-meta"
            aria-label="Informazioni della Lifeform"
          >
            <div>
              <span>Stato</span>

              <strong>
                {getEmotionUiLabel(
                  settledEmotion,
                )}

                {settledEmotion !==
                  'neutral' &&
                  ' · ' +
                    emotionIntensity}
              </strong>
            </div>

            <div>
              <span>Modello</span>

              <strong>
                {getGeminiModelLabel(
                  selectedModel,
                )}
              </strong>
            </div>

            <div>
              <span>Token oggi</span>

              <strong>
                {dailyTokensUsed.toLocaleString(
                  locale,
                )}
                {' / '}
                {dailyTokenLimit.toLocaleString(
                  locale,
                )}
              </strong>
            </div>
          </section>

          <div className="chat-header-actions">
            <label className="chat-model-picker">
              <span>Modello</span>

              <select
                value={selectedModel}
                onChange={(event) => {
                  const nextModel =
                    normalizeGeminiModelId(
                      event.target.value,
                    )

                  setSelectedModel(nextModel)
                  saveStoredGeminiModel(
                    nextModel,
                  )
                  setError(null)
                }}
                disabled={sending}
                aria-label="Modello Gemini"
              >
                {GEMINI_MODEL_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.id}
                      value={option.id}
                    >
                      {option.label}
                      {' — '}
                      {option.note}
                    </option>
                  ),
                )}
              </select>
            </label>

            <button
              type="button"
              className="text-button"
              onClick={() => {
                setMobileMenuOpen(false)
                setEmotionPanelOpen(true)
              }}
              aria-expanded={
                emotionPanelOpen
              }
            >
              Emozioni
            </button>

            <button
              type="button"
              className="text-button"
              onClick={() => {
                setMobileMenuOpen(false)
                setKeyMemoryPanelOpen(true)
              }}
              aria-expanded={
                keyMemoryPanelOpen
              }
            >
              Key Memories
              {' '}
              {keyMemories.length}
              {'/'}
              {MAX_KEY_MEMORIES}
            </button>

            <button
              type="button"
              className="text-button"
              onClick={() => {
                setMobileMenuOpen(false)
                void handleClearChat()
              }}
              disabled={
                sending ||
                clearingChat
              }
            >
              {clearingChat
                ? 'Eliminazione…'
                : 'Svuota chat'}
            </button>

            <button
              type="button"
              className="text-button"
              onClick={() => {
                setMobileMenuOpen(false)
                onDisconnectGemini()
              }}
              disabled={sending}
            >
              Cambia API
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setMobileMenuOpen(false)
                void onSignOut()
              }}
              disabled={
                sending || signingOut
              }
            >
              {signingOut
                ? 'Disconnessione…'
                : 'Esci'}
            </button>
          </div>
        </header>

        <div
          ref={chatBodyRef}
          className={
            resizingMobileStage
              ? 'chat-body mobile-stage-resizing'
              : 'chat-body'
          }
          style={mobileStageStyle}
        >
          <aside className="chat-avatar-panel">
            <LifeformSprite
              emotion={
                displayedEmotion
              }
              lifeformName={
                lifeform.name
              }
            />

            <p className="chat-emotion">
              {
                getEmotionUiLabel(
                  displayedEmotion,
                )
              }

              {!sending &&
                displayedEmotion !==
                  'neutral' &&
                ' · ' +
                  displayedEmotionIntensity}

              {!sending &&
                transientEmotion !==
                  null &&
                ' · reazione'}
            </p>

            <p className="chat-provider">
              {getGeminiModelLabel(
                selectedModel,
              )}
            </p>

            <div className="chat-context-info">
              <span>
                Parametri emotivi
              </span>

              <strong>
                Apri “Emozioni” per
                monitorare i livelli
              </strong>
            </div>
          </aside>

          <div
            className="mobile-stage-divider"
            role="separator"
            aria-label="Ridimensiona lo spazio tra sprite e chat"
            aria-orientation="horizontal"
            aria-valuemin={
              MIN_MOBILE_SPRITE_SHARE
            }
            aria-valuemax={
              MAX_MOBILE_SPRITE_SHARE
            }
            aria-valuenow={
              mobileSpriteShare
            }
            aria-valuetext={
              'Sprite ' +
              String(mobileSpriteShare) +
              ' per cento dello schermo. La chat mantiene sempre una schermata intera.'
            }
            tabIndex={0}
            onPointerDown={
              handleMobileDividerPointerDown
            }
            onPointerMove={
              handleMobileDividerPointerMove
            }
            onPointerUp={
              finishMobileDividerResize
            }
            onPointerCancel={
              finishMobileDividerResize
            }
            onKeyDown={
              handleMobileDividerKeyDown
            }
            onDoubleClick={() =>
              setMobileSpriteShare(
                DEFAULT_MOBILE_SPRITE_SHARE,
              )
            }
          >
            <span
              className="mobile-stage-divider-anchor"
              aria-hidden="true"
            />
          </div>

          <section className="chat-conversation">
            <div
              ref={messageListRef}
              className="message-list"
              onScroll={
                handleMessageListScroll
              }
              aria-live="polite"
            >
              {hasOlderMessages && (
                <button
                  type="button"
                  className="load-older-button"
                  onClick={() =>
                    void loadOlderMessages()
                  }
                  disabled={
                    loadingOlder
                  }
                >
                  {loadingOlder
                    ? 'Caricamento…'
                    : 'Carica messaggi precedenti'}
                </button>
              )}

              {loadingMessages ? (
                <div className="chat-loading">
                  <div className="loading-orb" />

                  <p>
                    Caricamento della cronologia…
                  </p>
                </div>
              ) : messages.length ===
                  0 &&
                !streamingText ? (
                <div className="empty-chat">
                  <p className="eyebrow">
                    Prima conversazione
                  </p>

                  <h2>
                    {lifeform.name} è
                    connessa.
                  </h2>

                  <p>
                    Scrivi il primo
                    messaggio per iniziare
                    questa unica cronologia
                    condivisa.
                  </p>
                </div>
              ) : (
                messages.map(
                  (message) => (
                    <article
                      key={message.id}
                      className={
                        'chat-message chat-message-' +
                        message.role
                      }
                    >
                      <div className="message-meta">
                        <span>
                          {message.role ===
                          'user'
                            ? profile
                                .display_name ??
                              'Utente'
                            : lifeform.name}
                        </span>

                        <time
                          dateTime={
                            message.created_at
                          }
                        >
                          {new Intl.DateTimeFormat(
                            locale,
                            {
                              hour:
                                '2-digit',
                              minute:
                                '2-digit',
                              day:
                                '2-digit',
                              month:
                                '2-digit',
                            },
                          ).format(
                            new Date(
                              message.created_at,
                            ),
                          )}
                        </time>
                      </div>

                      <p>
                        {message.content}
                      </p>
                    </article>
                  ),
                )
              )}

              {sending && (
                <article className="chat-message chat-message-assistant chat-message-streaming">
                  <div className="message-meta">
                    <span>
                      {lifeform.name}
                    </span>

                    <span>
                      {analyzingEmotion
                        ? 'sta aggiornando le emozioni'
                        : 'sta rispondendo'}
                    </span>
                  </div>

                  {streamingText ? (
                    <p>
                      {streamingText}
                    </p>
                  ) : analyzingEmotion ? (
                    <p>
                      Analisi emotiva in
                      corso…
                    </p>
                  ) : (
                    <div
                      className="typing-indicator"
                      aria-label="Elaborazione in corso"
                    >
                      <span />
                      <span />
                      <span />
                    </div>
                  )}
                </article>
              )}
            </div>

            {error && (
              <p
                className="feedback feedback-error chat-error"
                aria-live="assertive"
              >
                {error}
              </p>
            )}

            <form
              className="chat-composer"
              onSubmit={handleSubmit}
            >
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(event) =>
                  setDraft(
                    event.target.value,
                  )
                }
                onKeyDown={
                  handleTextareaKeyDown
                }
                placeholder={
                  'Scrivi a ' +
                  lifeform.name +
                  '…'
                }
                maxLength={
                  MAX_MESSAGE_LENGTH
                }
                rows={2}
                disabled={
                  sending ||
                  loadingMessages
                }
                autoFocus
              />

              <div className="composer-footer">
                <span>
                  Invio per spedire ·
                  Maiusc+Invio per
                  andare a capo
                </span>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    sending ||
                    loadingMessages ||
                    !draft.trim()
                  }
                >
                  {sending
                    ? 'Elaborazione…'
                    : 'Invia'}
                </button>
              </div>
            </form>
          </section>
        </div>

        <KeyMemoriesPanel
          open={keyMemoryPanelOpen}
          memories={keyMemories}
          loading={loadingKeyMemories}
          saving={savingKeyMemory}
          error={keyMemoryError}
          onClose={() =>
            setKeyMemoryPanelOpen(false)
          }
          onCreate={
            handleCreateKeyMemory
          }
          onUpdate={
            handleUpdateKeyMemory
          }
          onDelete={
            handleDeleteKeyMemory
          }
        />

        <EmotionMonitor
          open={emotionPanelOpen}
          levels={emotionLevels}
          sensitivities={
            emotionalSensitivities
          }
          savingSensitivities={
            savingSensitivities
          }
          sensitivitySaveError={
            sensitivitySaveError
          }
          onSensitivityChange={
            handleSensitivityChange
          }
          dailyTokenLimit={
            dailyTokenLimit
          }
          dailyTokensUsed={
            dailyTokensUsed
          }
          savingTokenSettings={
            savingTokenSettings
          }
          tokenSettingsSaveError={
            tokenSettingsSaveError
          }
          onDailyTokenLimitChange={
            handleDailyTokenLimitChange
          }
          currentEmotion={
            settledEmotion
          }
          intensity={
            emotionIntensity
          }
          analyzing={
            analyzingEmotion
          }
          lastReason={
            lastEmotionReason
          }
          analysisSource={
            emotionAnalysisSource
          }
          onClose={() =>
            setEmotionPanelOpen(false)
          }
        />
      </section>
    </main>
  )
}
