import {
  useEffect,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import {
  KEY_MEMORY_CATEGORY_LABELS,
  MAX_KEY_MEMORIES,
  normalizeKeyMemoryInput,
} from '../lib/keyMemories'
import {
  KEY_MEMORY_CATEGORIES,
  type KeyMemory,
  type KeyMemoryCategory,
  type KeyMemoryInput,
} from '../types/keyMemory'
import './KeyMemoriesPanel.css'

const EMPTY_FORM: KeyMemoryInput = {
  category: 'conversation_memory',
  content: '',
  importance: 60,
}

function getMemoryOriginLabel(
  source: KeyMemory['source'],
): string {
  return source === 'manual'
    ? 'Origin: User confirmed'
    : 'Origin: Lifeform inference'
}

function getMemoryConfidenceLabel(
  confidence: KeyMemory['confidence'],
): string {
  if (confidence === 'high') {
    return 'Confidence: High'
  }

  if (confidence === 'tentative') {
    return 'Confidence: Tentative'
  }

  return 'Confidence: Medium'
}

function formatMemoryConfirmation(
  value: string | null,
): string {
  if (!value) {
    return 'Not confirmed'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Not confirmed'
  }

  return (
    'Confirmed ' +
    new Intl.DateTimeFormat(
      'en-GB',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      },
    ).format(date)
  )
}

type KeyMemoriesPanelProps = {
  open: boolean
  memories: KeyMemory[]
  loading: boolean
  saving: boolean
  error: string | null
  onClose: () => void
  onCreate: (
    input: KeyMemoryInput,
  ) => Promise<void>
  onUpdate: (
    id: string,
    input: KeyMemoryInput,
  ) => Promise<void>
  onConfirm: (
    id: string,
  ) => Promise<void>
  onDelete: (
    id: string,
  ) => Promise<void>
}

export function KeyMemoriesPanel({
  open,
  memories,
  loading,
  saving,
  error,
  onClose,
  onCreate,
  onUpdate,
  onConfirm,
  onDelete,
}: KeyMemoriesPanelProps) {
  const [editingId, setEditingId] =
    useState<string | null>(null)

  const [form, setForm] =
    useState<KeyMemoryInput>({
      ...EMPTY_FORM,
    })

  useEffect(() => {
    if (!open) {
      setEditingId(null)
      setForm({
        ...EMPTY_FORM,
      })
    }
  }, [open])

  if (!open) {
    return null
  }

  const beginCreate = () => {
    setEditingId('new')
    setForm({
      ...EMPTY_FORM,
    })
  }

  const beginEdit = (
    memory: KeyMemory,
  ) => {
    setEditingId(memory.id)
    setForm({
      category: memory.category,
      content: memory.content,
      importance:
        memory.importance,
    })
  }

  const closeEditor = () => {
    setEditingId(null)
    setForm({
      ...EMPTY_FORM,
    })
  }

  const saveForm = async () => {
    const normalized =
      normalizeKeyMemoryInput(form)

    if (!normalized.content) {
      return
    }

    try {
      if (editingId === 'new') {
        await onCreate(normalized)
      } else if (editingId) {
        await onUpdate(
          editingId,
          normalized,
        )
      }

      closeEditor()
    } catch {
      // The parent keeps the editor open and exposes the error.
    }
  }

  const orderedMemories = [
    ...memories,
  ].sort(
    (left, right) =>
      right.importance -
      left.importance,
  )

  return createPortal(
    <div
      className="key-memory-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <aside
        className="key-memory-panel"
        aria-label="Key Memories"
      >
        <header className="key-memory-header">
          <div>
            <p className="eyebrow">
              Long-term memory
            </p>

            <h2>Key Memories</h2>

            <p>
              {memories.length} /{' '}
              {MAX_KEY_MEMORIES}
            </p>
          </div>

          <button
            type="button"
            className="key-memory-close"
            onClick={onClose}
            aria-label="Close Key Memories"
          >
            ×
          </button>
        </header>

        <div className="key-memory-intro">
          The Lifeform can create and update
          important memories autonomously. Every
          manual edit becomes authoritative and will
          not be overwritten automatically.
        </div>

        {error && (
          <p className="key-memory-error">
            {error}
          </p>
        )}

        {editingId && (
          <section className="key-memory-editor">
            <label>
              <span>Category</span>

              <select
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category:
                      event.target
                        .value as KeyMemoryCategory,
                  }))
                }
                disabled={saving}
              >
                {KEY_MEMORY_CATEGORIES.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {
                        KEY_MEMORY_CATEGORY_LABELS[
                          category
                        ]
                      }
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              <span>Memory</span>

              <textarea
                value={form.content}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    content:
                      event.target.value,
                  }))
                }
                maxLength={8000}
                rows={5}
                disabled={saving}
                placeholder="Write a clear, self-contained memory…"
              />
            </label>

            <label>
              <span>
                Importance: {form.importance}
              </span>

              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={form.importance}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    importance:
                      Number(
                        event.target.value,
                      ),
                  }))
                }
                disabled={saving}
              />
            </label>

            <div className="key-memory-editor-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeEditor}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  void saveForm()
                }
                disabled={
                  saving ||
                  !form.content.trim()
                }
              >
                {saving
                  ? 'Saving…'
                  : 'Save memory'}
              </button>
            </div>
          </section>
        )}

        {!editingId && (
          <button
            type="button"
            className="key-memory-add"
            onClick={beginCreate}
            disabled={
              saving ||
              memories.length >=
                MAX_KEY_MEMORIES
            }
          >
            + New memory
          </button>
        )}

        <div className="key-memory-list">
          {loading ? (
            <p className="key-memory-empty">
              Loading memories…
            </p>
          ) : orderedMemories.length === 0 ? (
            <p className="key-memory-empty">
              No Key Memories yet. The
              Lifeform can create them autonomously
              during conversations.
            </p>
          ) : (
            orderedMemories.map((memory) => (
              <article
                key={memory.id}
                className={
                  memory.source === 'curiosity'
                    ? 'key-memory-card key-memory-card-curiosity'
                    : 'key-memory-card'
                }
              >
                <div className="key-memory-card-topline">
                  <span>
                    {
                      KEY_MEMORY_CATEGORY_LABELS[
                        memory.category
                      ]
                    }
                  </span>

                  <span>
                    {memory.source === 'manual'
                      ? 'Manual'
                      : memory.source === 'curiosity'
                        ? 'Autonomous curiosity'
                        : 'Autonomous'}
                    {' · '}
                    {memory.importance}
                  </span>
                </div>

                {memory.source === 'curiosity' && (
                  <span className="key-memory-curiosity-chip">
                    Autonomous curiosity
                  </span>
                )}

                <p>{memory.content}</p>

                <div className="key-memory-provenance">
                  <span>
                    {memory.source === 'curiosity'
                      ? 'Origin: autonomous curiosity'
                      : getMemoryOriginLabel(
                          memory.source,
                        )}
                  </span>

                  <span>
                    {getMemoryConfidenceLabel(
                      memory.confidence,
                    )}
                  </span>

                  <span>
                    {formatMemoryConfirmation(
                      memory.last_confirmed_at,
                    )}
                  </span>
                </div>

                <div className="key-memory-card-actions">
                  <button
                    type="button"
                    onClick={() =>
                      void onConfirm(memory.id)
                    }
                    disabled={saving}
                  >
                    {memory.last_confirmed_at
                      ? 'Reconfirm'
                      : 'Confirm'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      beginEdit(memory)
                    }
                    disabled={saving}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const confirmed =
                        window.confirm(
                          'Delete this Key Memory?',
                        )

                      if (confirmed) {
                        void onDelete(
                          memory.id,
                        )
                      }
                    }}
                    disabled={saving}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </aside>
    </div>,
    document.body,
  )
}
