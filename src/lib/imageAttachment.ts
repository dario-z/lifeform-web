export const MAX_IMAGE_ATTACHMENT_BYTES =
  10 * 1024 * 1024

const SUPPORTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const EXTENSION_MIME_TYPES: Record<
  string,
  string
> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

export type PendingImageAttachment = {
  name: string
  mimeType: string
  size: number
  base64Data: string
  previewUrl: string
}

function getSupportedMimeType(
  file: File,
): string | null {
  const providedMimeType =
    file.type.toLocaleLowerCase()

  if (
    SUPPORTED_MIME_TYPES.has(
      providedMimeType,
    )
  ) {
    return providedMimeType
  }

  const extension = file.name
    .split('.')
    .at(-1)
    ?.toLocaleLowerCase()

  if (!extension) {
    return null
  }

  return (
    EXTENSION_MIME_TYPES[extension] ??
    null
  )
}

function readFileAsDataUrl(
  file: File,
): Promise<string> {
  return new Promise(
    (resolve, reject) => {
      const reader = new FileReader()

      reader.onerror = () => {
        reject(
          new Error(
            'The selected image could not be read.',
          ),
        )
      }

      reader.onload = () => {
        if (
          typeof reader.result !==
          'string'
        ) {
          reject(
            new Error(
              'The selected image could not be read.',
            ),
          )
          return
        }

        resolve(reader.result)
      }

      reader.readAsDataURL(file)
    },
  )
}

export async function createPendingImageAttachment(
  file: File,
): Promise<PendingImageAttachment> {
  const mimeType =
    getSupportedMimeType(file)

  if (!mimeType) {
    throw new Error(
      'Use a PNG, JPG, WEBP or GIF image.',
    )
  }

  if (file.size <= 0) {
    throw new Error(
      'The selected image is empty.',
    )
  }

  if (
    file.size >
    MAX_IMAGE_ATTACHMENT_BYTES
  ) {
    throw new Error(
      'The image must be 10 MB or smaller.',
    )
  }

  const dataUrl =
    await readFileAsDataUrl(file)

  const commaIndex =
    dataUrl.indexOf(',')

  if (commaIndex < 0) {
    throw new Error(
      'The selected image could not be prepared.',
    )
  }

  return {
    name: file.name || 'image',
    mimeType,
    size: file.size,
    base64Data: dataUrl.slice(
      commaIndex + 1,
    ),
    previewUrl:
      URL.createObjectURL(file),
  }
}

export function revokeImagePreview(
  attachment:
    | PendingImageAttachment
    | null
    | undefined,
): void {
  if (
    attachment?.previewUrl &&
    typeof URL !== 'undefined'
  ) {
    URL.revokeObjectURL(
      attachment.previewUrl,
    )
  }
}

export function formatImageFileSize(
  bytes: number,
): string {
  if (bytes < 1024 * 1024) {
    return (
      Math.max(1, Math.round(bytes / 1024)) +
      ' KB'
    )
  }

  return (
    (bytes / (1024 * 1024))
      .toFixed(1)
      .replace('.0', '') +
    ' MB'
  )
}
