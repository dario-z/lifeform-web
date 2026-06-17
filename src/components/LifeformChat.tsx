import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import type {
  FormEvent,
  KeyboardEvent,
} from 'react'
import { EmotionMonitor } from './EmotionMonitor'
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
import './GeminiModelSelect.css'

const MESSAGE_PAGE_SIZE = 50
const GEMINI_CONTEXT_SIZE = 24
const EMOTION_CONTEXT_SIZE = 8
const IMMEDIATE_REACTION_DURATION_MS = 2000
const SENSITIVITY_SAVE_DELAY_MS = 450
const TOKEN_SETTINGS_SAVE_DELAY_MS = 450
const MAX_MESSAGE_LENGTH = 20000

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

  const messageListRef =
    useRef<HTMLDivElement | null>(null)

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(null)

  const stickToBottomRef = useRef(true)

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
  }, [
    loadInitialMessages,
    loadEmotionState,
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
        'Do not claim to have memories, personal information or knowledge that is not included in the supplied conversation.',
        'Long-term memory and autonomous personality evolution are not enabled yet.',
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
          'Vuoi eliminare definitivamente tutta la cronologia e azzerare tutti i parametri emotivi? Questa operazione non può essere annullata.',
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

  return (
    <main className="chat-page">
      <section className="chat-shell">
        <header className="chat-header">
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
              onClick={() =>
                setEmotionPanelOpen(true)
              }
              aria-expanded={
                emotionPanelOpen
              }
            >
              Emozioni
            </button>

            <button
              type="button"
              className="text-button"
              onClick={() =>
                void handleClearChat()
              }
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
              onClick={
                onDisconnectGemini
              }
              disabled={sending}
            >
              Cambia API
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                void onSignOut()
              }
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

        <div className="chat-body">
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
