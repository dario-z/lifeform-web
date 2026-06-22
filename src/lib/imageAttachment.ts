export const MAX_BINARY_ATTACHMENT_BYTES =
  10 * 1024 * 1024

export const MAX_TEXT_ATTACHMENT_BYTES =
  2 * 1024 * 1024

export const MAX_TEXT_ATTACHMENT_CHARACTERS =
  120000

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const TEXT_MIME_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/html',
  'text/css',
  'text/xml',
  'text/yaml',
  'text/x-python',
  'text/x-c',
  'text/x-c++',
  'text/x-java-source',
  'text/x-csharp',
  'application/json',
  'application/ld+json',
  'application/xml',
  'application/javascript',
  'application/x-javascript',
  'application/sql',
  'application/x-sh',
  'application/x-yaml',
  'application/yaml',
  'application/toml',
])

const IMAGE_EXTENSION_MIME_TYPES: Record<
  string,
  string
> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

const TEXT_EXTENSIONS = new Set([
  'txt',
  'md',
  'markdown',
  'csv',
  'json',
  'jsonl',
  'xml',
  'yaml',
  'yml',
  'toml',
  'ini',
  'conf',
  'config',
  'env',
  'log',
  'py',
  'pyi',
  'js',
  'mjs',
  'cjs',
  'ts',
  'tsx',
  'jsx',
  'css',
  'html',
  'htm',
  'sql',
  'sh',
  'bash',
  'zsh',
  'ps1',
  'bat',
  'cmd',
  'java',
  'c',
  'h',
  'cpp',
  'cc',
  'cxx',
  'hpp',
  'cs',
  'go',
  'rs',
  'php',
  'rb',
  'swift',
  'kt',
  'kts',
  'vue',
  'svelte',
])

export type PendingImageAttachment = {
  kind: 'image'
  name: string
  mimeType: string
  size: number
  base64Data: string
  previewUrl: string
}

export type PendingPdfAttachment = {
  kind: 'pdf'
  name: string
  mimeType: 'application/pdf'
  size: number
  base64Data: string
}

export type PendingTextAttachment = {
  kind: 'text'
  name: string
  mimeType: string
  size: number
  textContent: string
  textTruncated: boolean
  extension: string | null
}

export type PendingDocumentAttachment =
  | PendingPdfAttachment
  | PendingTextAttachment

export type PendingChatAttachment =
  | PendingImageAttachment
  | PendingDocumentAttachment

function getExtension(
  fileName: string,
): string | null {
  const extension = fileName
    .split('.')
    .at(-1)
    ?.toLocaleLowerCase()

  if (
    !extension ||
    extension === fileName.toLocaleLowerCase()
  ) {
    return null
  }

  return extension
}

function getSupportedImageMimeType(
  file: File,
): string | null {
  const providedMimeType =
    file.type.toLocaleLowerCase()

  if (
    IMAGE_MIME_TYPES.has(
      providedMimeType,
    )
  ) {
    return providedMimeType
  }

  const extension = getExtension(file.name)

  if (!extension) {
    return null
  }

  return (
    IMAGE_EXTENSION_MIME_TYPES[extension] ??
    null
  )
}

function isPdfFile(file: File): boolean {
  return (
    file.type.toLocaleLowerCase() ===
      'application/pdf' ||
    getExtension(file.name) === 'pdf'
  )
}

function isSupportedTextFile(
  file: File,
): boolean {
  const mimeType =
    file.type.toLocaleLowerCase()

  return (
    TEXT_MIME_TYPES.has(mimeType) ||
    mimeType.startsWith('text/') ||
    TEXT_EXTENSIONS.has(
      getExtension(file.name) ?? '',
    )
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
            'The selected file could not be read.',
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
              'The selected file could not be read.',
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

function normalizeTextDocument(
  value: string,
): string {
  return value
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u0000/g, '')
    .trim()
}

function ensureNonEmptyFile(file: File): void {
  if (file.size <= 0) {
    throw new Error(
      'The selected file is empty.',
    )
  }
}

function ensureBinaryFileSize(file: File): void {
  if (
    file.size >
    MAX_BINARY_ATTACHMENT_BYTES
  ) {
    throw new Error(
      'Images and PDFs must be 10 MB or smaller.',
    )
  }
}

function ensureTextFileSize(file: File): void {
  if (
    file.size >
    MAX_TEXT_ATTACHMENT_BYTES
  ) {
    throw new Error(
      'Text documents must be 2 MB or smaller.',
    )
  }
}

async function createPendingImageAttachmentInternal(
  file: File,
  mimeType: string,
): Promise<PendingImageAttachment> {
  ensureNonEmptyFile(file)
  ensureBinaryFileSize(file)

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
    kind: 'image',
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

async function createPendingPdfAttachment(
  file: File,
): Promise<PendingPdfAttachment> {
  ensureNonEmptyFile(file)
  ensureBinaryFileSize(file)

  const dataUrl =
    await readFileAsDataUrl(file)

  const commaIndex =
    dataUrl.indexOf(',')

  if (commaIndex < 0) {
    throw new Error(
      'The selected PDF could not be prepared.',
    )
  }

  return {
    kind: 'pdf',
    name: file.name || 'document.pdf',
    mimeType: 'application/pdf',
    size: file.size,
    base64Data: dataUrl.slice(
      commaIndex + 1,
    ),
  }
}

async function createPendingTextAttachment(
  file: File,
): Promise<PendingTextAttachment> {
  ensureNonEmptyFile(file)
  ensureTextFileSize(file)

  const rawText = await file.text()
  const normalizedText =
    normalizeTextDocument(rawText)

  if (!normalizedText) {
    throw new Error(
      'The selected text document has no readable text.',
    )
  }

  const textTruncated =
    normalizedText.length >
    MAX_TEXT_ATTACHMENT_CHARACTERS

  return {
    kind: 'text',
    name: file.name || 'document.txt',
    mimeType:
      file.type.toLocaleLowerCase() ||
      'text/plain',
    size: file.size,
    textContent: textTruncated
      ? normalizedText.slice(
          0,
          MAX_TEXT_ATTACHMENT_CHARACTERS,
        )
      : normalizedText,
    textTruncated,
    extension: getExtension(file.name),
  }
}

export async function createPendingChatAttachment(
  file: File,
): Promise<PendingChatAttachment> {
  const imageMimeType =
    getSupportedImageMimeType(file)

  if (imageMimeType) {
    return createPendingImageAttachmentInternal(
      file,
      imageMimeType,
    )
  }

  if (isPdfFile(file)) {
    return createPendingPdfAttachment(file)
  }

  if (isSupportedTextFile(file)) {
    return createPendingTextAttachment(file)
  }

  throw new Error(
    'Use an image, PDF, or text-based file such as TXT, MD, CSV, JSON or source code.',
  )
}

export async function createPendingImageAttachment(
  file: File,
): Promise<PendingImageAttachment> {
  const mimeType =
    getSupportedImageMimeType(file)

  if (!mimeType) {
    throw new Error(
      'Use a PNG, JPG, WEBP or GIF image.',
    )
  }

  return createPendingImageAttachmentInternal(
    file,
    mimeType,
  )
}

export function isPendingImageAttachment(
  attachment:
    | PendingChatAttachment
    | null
    | undefined,
): attachment is PendingImageAttachment {
  return attachment?.kind === 'image'
}

export function isPendingDocumentAttachment(
  attachment:
    | PendingChatAttachment
    | null
    | undefined,
): attachment is PendingDocumentAttachment {
  return (
    attachment?.kind === 'pdf' ||
    attachment?.kind === 'text'
  )
}

export function revokeChatAttachmentPreview(
  attachment:
    | PendingChatAttachment
    | null
    | undefined,
): void {
  if (
    isPendingImageAttachment(attachment) &&
    attachment.previewUrl &&
    typeof URL !== 'undefined'
  ) {
    URL.revokeObjectURL(
      attachment.previewUrl,
    )
  }
}

export function revokeImagePreview(
  attachment:
    | PendingImageAttachment
    | null
    | undefined,
): void {
  revokeChatAttachmentPreview(attachment)
}

export function formatAttachmentFileSize(
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

export function formatImageFileSize(
  bytes: number,
): string {
  return formatAttachmentFileSize(bytes)
}

export function getAttachmentDisplayLabel(
  attachment: PendingChatAttachment,
): string {
  if (attachment.kind === 'image') {
    return 'Image'
  }

  if (attachment.kind === 'pdf') {
    return 'PDF'
  }

  return (
    attachment.extension?.toUpperCase() ??
    'Text file'
  )
}
