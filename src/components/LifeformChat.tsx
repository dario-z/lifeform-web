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
import {
  DEFAULT_GEMINI_MODEL,
  streamGeminiReply,
} from '../lib/gemini'
import { supabase } from '../lib/supabase'
import type {
  Lifeform,
  Profile,
} from '../types/lifeform'
import type { ChatMessage } from '../types/message'

const MESSAGE_PAGE_SIZE = 50
const GEMINI_CONTEXT_SIZE = 24
const MAX_MESSAGE_LENGTH = 20000

type LifeformChatProps = {
  profile: Profile
  lifeform: Lifeform
  apiKey: string
  signingOut: boolean
  onSignOut: () => Promise<void>
  onDisconnectGemini: () => void
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

export function LifeformChat({
  profile,
  lifeform,
  apiKey,
  signingOut,
  onSignOut,
  onDisconnectGemini,
}: LifeformChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    [],
  )
  const [draft, setDraft] = useState('')
  const [loadingMessages, setLoadingMessages] =
    useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasOlderMessages, setHasOlderMessages] =
    useState(false)
  const [sending, setSending] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [clearingChat, setClearingChat] =
    useState(false)

  const messageListRef = useRef<HTMLDivElement | null>(
    null,
  )
  const textareaRef =
    useRef<HTMLTextAreaElement | null>(null)
  const stickToBottomRef = useRef(true)

  const locale = getLocale(profile.interface_language)

  const loadInitialMessages = useCallback(async () => {
    setLoadingMessages(true)
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from('messages')
        .select(
          `
            id,
            user_id,
            lifeform_id,
            role,
            content,
            metadata,
            created_at
          `,
        )
        .eq('lifeform_id', lifeform.id)
        .order('created_at', {
          ascending: false,
        })
        .limit(MESSAGE_PAGE_SIZE)

      if (queryError) {
        throw queryError
      }

      const rows = (data ?? []) as ChatMessage[]
      const orderedRows = [...rows].reverse()

      setMessages(orderedRows)
      setHasOlderMessages(
        rows.length === MESSAGE_PAGE_SIZE,
      )
      stickToBottomRef.current = true

      requestAnimationFrame(() => {
        const container = messageListRef.current

        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    } catch (loadError: unknown) {
      setError(getErrorMessage(loadError))
    } finally {
      setLoadingMessages(false)
    }
  }, [lifeform.id])

  useEffect(() => {
    void loadInitialMessages()
  }, [loadInitialMessages])

  useEffect(() => {
    if (!stickToBottomRef.current) {
      return
    }

    const container = messageListRef.current

    if (!container) {
      return
    }

    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight
    })
  }, [messages, streamingText])

  const handleMessageListScroll = () => {
    const container = messageListRef.current

    if (!container) {
      return
    }

    const distanceFromBottom =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight

    stickToBottomRef.current = distanceFromBottom < 100
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

    const container = messageListRef.current
    const previousScrollHeight =
      container?.scrollHeight ?? 0

    try {
      const { data, error: queryError } = await supabase
        .from('messages')
        .select(
          `
            id,
            user_id,
            lifeform_id,
            role,
            content,
            metadata,
            created_at
          `,
        )
        .eq('lifeform_id', lifeform.id)
        .lt('created_at', oldestMessage.created_at)
        .order('created_at', {
          ascending: false,
        })
        .limit(MESSAGE_PAGE_SIZE)

      if (queryError) {
        throw queryError
      }

      const rows = (data ?? []) as ChatMessage[]
      const orderedRows = [...rows].reverse()

      setMessages((currentMessages) => [
        ...orderedRows,
        ...currentMessages,
      ])

      setHasOlderMessages(
        rows.length === MESSAGE_PAGE_SIZE,
      )

      requestAnimationFrame(() => {
        if (!container) {
          return
        }

        const newScrollHeight = container.scrollHeight

        container.scrollTop =
          newScrollHeight - previousScrollHeight
      })
    } catch (loadError: unknown) {
      setError(getErrorMessage(loadError))
    } finally {
      setLoadingOlder(false)
    }
  }

  const buildSystemInstruction = (): string => {
    const userName =
      profile.display_name?.trim() || 'the user'

    return [
      `Your name is ${lifeform.name}.`,
      `You are the persistent AI presence connected to a user named ${userName}.`,
      `Your primary language is "${lifeform.language}". Reply in that language unless the user asks you to use another language.`,
      'Preserve the full general capabilities of the underlying Gemini model.',
      'Answer the actual request directly and competently before adding personality.',
      'You may sound natural, warm and recognizable, but do not turn every answer into an introspective monologue.',
      'Do not claim to have memories, personal information or knowledge that is not included in the supplied conversation.',
      'Long-term memory and autonomous personality evolution are not enabled yet.',
      'Do not pretend to have used tools, searched the web, opened files or performed actions unless those tools were actually provided in the request.',
      'Do not repeatedly announce that you are an AI unless it is directly relevant.',
    ].join('\n')
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const cleanMessage = draft.trim()

    if (!cleanMessage || sending) {
      return
    }

    if (cleanMessage.length > MAX_MESSAGE_LENGTH) {
      setError(
        `Il messaggio supera il limite di ${MAX_MESSAGE_LENGTH.toLocaleString(
          locale,
        )} caratteri.`,
      )
      return
    }

    const previousContext = messages
      .slice(-GEMINI_CONTEXT_SIZE)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }))

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

      setMessages((currentMessages) => [
        ...currentMessages,
        insertedUserMessage as ChatMessage,
      ])

      setDraft('')

      const assistantResponse =
        await streamGeminiReply({
          apiKey,
          history: previousContext,
          prompt: cleanMessage,
          systemInstruction: buildSystemInstruction(),
          onText: setStreamingText,
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
            model: DEFAULT_GEMINI_MODEL,
          },
        })
        .select()
        .single()

      if (assistantInsertError) {
        throw new Error(
          `La risposta è stata generata ma non è stato possibile salvarla: ${assistantInsertError.message}`,
        )
      }

      if (!insertedAssistantMessage) {
        throw new Error(
          'La risposta è stata generata ma non restituita dal database.',
        )
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        insertedAssistantMessage as ChatMessage,
      ])

      setStreamingText('')

      void supabase
        .from('lifeforms')
        .update({
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', lifeform.id)
    } catch (sendError: unknown) {
      setError(getErrorMessage(sendError))
    } finally {
      setSending(false)

      requestAnimationFrame(() => {
        textareaRef.current?.focus()
      })
    }
  }

  const handleTextareaKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  const handleClearChat = async () => {
    if (sending || clearingChat || messages.length === 0) {
      return
    }

    const confirmed = window.confirm(
      'Vuoi eliminare definitivamente tutta la cronologia? Questa operazione non può essere annullata.',
    )

    if (!confirmed) {
      return
    }

    setClearingChat(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('lifeform_id', lifeform.id)

      if (deleteError) {
        throw deleteError
      }

      setMessages([])
      setStreamingText('')
      setHasOlderMessages(false)
    } catch (clearError: unknown) {
      setError(getErrorMessage(clearError))
    } finally {
      setClearingChat(false)
    }
  }

  const displayedEmotion = sending
    ? 'thinking'
    : lifeform.current_emotion

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
              <p className="eyebrow">Connessione attiva</p>
              <h1>{lifeform.name}</h1>
            </div>
          </div>

          <div className="chat-header-actions">
            <button
              type="button"
              className="text-button"
              onClick={() => void handleClearChat()}
              disabled={
                sending ||
                clearingChat ||
                messages.length === 0
              }
            >
              {clearingChat
                ? 'Eliminazione…'
                : 'Svuota chat'}
            </button>

            <button
              type="button"
              className="text-button"
              onClick={onDisconnectGemini}
              disabled={sending}
            >
              Cambia API
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => void onSignOut()}
              disabled={sending || signingOut}
            >
              {signingOut
                ? 'Disconnessione…'
                : 'Esci'}
            </button>
          </div>
        </header>

        <div className="chat-body">
          <aside className="chat-avatar-panel">
            <div
              className={`chat-avatar emotion-${displayedEmotion}`}
            >
              <span />
            </div>

            <p className="chat-emotion">
              {displayedEmotion}
            </p>

            <p className="chat-provider">
              {DEFAULT_GEMINI_MODEL}
            </p>

            <div className="chat-context-info">
              <span>Contesto IA</span>
              <strong>
                Ultimi {GEMINI_CONTEXT_SIZE} messaggi
              </strong>
            </div>
          </aside>

          <section className="chat-conversation">
            <div
              ref={messageListRef}
              className="message-list"
              onScroll={handleMessageListScroll}
              aria-live="polite"
            >
              {hasOlderMessages && (
                <button
                  type="button"
                  className="load-older-button"
                  onClick={() => void loadOlderMessages()}
                  disabled={loadingOlder}
                >
                  {loadingOlder
                    ? 'Caricamento…'
                    : 'Carica messaggi precedenti'}
                </button>
              )}

              {loadingMessages ? (
                <div className="chat-loading">
                  <div className="loading-orb" />
                  <p>Caricamento della cronologia…</p>
                </div>
              ) : messages.length === 0 &&
                !streamingText ? (
                <div className="empty-chat">
                  <p className="eyebrow">
                    Prima conversazione
                  </p>

                  <h2>
                    {lifeform.name} è connessa.
                  </h2>

                  <p>
                    Scrivi il primo messaggio per iniziare
                    questa unica cronologia condivisa.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <article
                    key={message.id}
                    className={`chat-message chat-message-${message.role}`}
                  >
                    <div className="message-meta">
                      <span>
                        {message.role === 'user'
                          ? profile.display_name ??
                            'Utente'
                          : lifeform.name}
                      </span>

                      <time
                        dateTime={message.created_at}
                      >
                        {new Intl.DateTimeFormat(locale, {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                        }).format(
                          new Date(message.created_at),
                        )}
                      </time>
                    </div>

                    <p>{message.content}</p>
                  </article>
                ))
              )}

              {sending && (
                <article className="chat-message chat-message-assistant chat-message-streaming">
                  <div className="message-meta">
                    <span>{lifeform.name}</span>
                    <span>sta rispondendo</span>
                  </div>

                  {streamingText ? (
                    <p>{streamingText}</p>
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
                  setDraft(event.target.value)
                }
                onKeyDown={handleTextareaKeyDown}
                placeholder={`Scrivi a ${lifeform.name}…`}
                maxLength={MAX_MESSAGE_LENGTH}
                rows={2}
                disabled={sending || loadingMessages}
                autoFocus
              />

              <div className="composer-footer">
                <span>
                  Invio per spedire · Maiusc+Invio per andare
                  a capo
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
                  {sending ? 'Elaborazione…' : 'Invia'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </section>
    </main>
  )
}