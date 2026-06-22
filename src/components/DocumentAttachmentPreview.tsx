import type {
  PendingDocumentAttachment,
} from '../lib/imageAttachment'
import {
  formatAttachmentFileSize,
  getAttachmentDisplayLabel,
  MAX_TEXT_ATTACHMENT_CHARACTERS,
} from '../lib/imageAttachment'
import './DocumentAttachmentPreview.css'

type DocumentAttachmentPreviewProps = {
  attachment: PendingDocumentAttachment
  disabled: boolean
  onRemove: () => void
}

export function DocumentAttachmentPreview({
  attachment,
  disabled,
  onRemove,
}: DocumentAttachmentPreviewProps) {
  const isPdf = attachment.kind === 'pdf'
  const label =
    getAttachmentDisplayLabel(attachment)

  const detail = isPdf
    ? 'Sent to Gemini for this reply only. The PDF is not kept in the chat.'
    : attachment.textTruncated
      ? 'The first ' +
        MAX_TEXT_ATTACHMENT_CHARACTERS.toLocaleString() +
        ' characters will be read for this reply only.'
      : 'Read locally for this reply only. The file is not kept in the chat.'

  return (
    <div className="document-attachment-preview">
      <div
        className="document-attachment-badge"
        aria-hidden="true"
      >
        {label}
      </div>

      <div className="document-attachment-copy">
        <strong>
          {isPdf
            ? 'PDF attached'
            : 'Document attached'}
        </strong>

        <span>
          {attachment.name}
          {' · '}
          {formatAttachmentFileSize(
            attachment.size,
          )}
        </span>

        <small>{detail}</small>
      </div>

      <button
        type="button"
        className="document-attachment-remove"
        onClick={onRemove}
        disabled={disabled}
        aria-label="Remove attached file"
        title="Remove attached file"
      >
        ×
      </button>
    </div>
  )
}
