import type {
  PendingImageAttachment,
} from '../lib/imageAttachment'
import {
  formatImageFileSize,
} from '../lib/imageAttachment'
import './ImageAttachmentPreview.css'

type ImageAttachmentPreviewProps = {
  attachment: PendingImageAttachment
  disabled: boolean
  onRemove: () => void
}

export function ImageAttachmentPreview({
  attachment,
  disabled,
  onRemove,
}: ImageAttachmentPreviewProps) {
  return (
    <div className="image-attachment-preview">
      <img
        src={attachment.previewUrl}
        alt=""
      />

      <div className="image-attachment-copy">
        <strong>Image attached</strong>

        <span>
          {attachment.name}
          {' · '}
          {formatImageFileSize(
            attachment.size,
          )}
        </span>

        <small>
          Sent only with this reply.
          The image is not kept in the chat.
        </small>
      </div>

      <button
        type="button"
        className="image-attachment-remove"
        onClick={onRemove}
        disabled={disabled}
        aria-label="Remove attached image"
        title="Remove attached image"
      >
        ×
      </button>
    </div>
  )
}
