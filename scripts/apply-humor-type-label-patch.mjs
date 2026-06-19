import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function write(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8')
}

function walk(dir) {
  if (!fs.existsSync(dir)) {
    return []
  }

  return fs.readdirSync(dir, {
    withFileTypes: true,
  }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === '.git'
      ) {
        return []
      }

      return walk(fullPath)
    }

    return [fullPath]
  })
}

function ensureEmotionalStateUnion() {
  const filePath = path.join(
    projectRoot,
    'src',
    'types',
    'lifeform.ts',
  )

  if (!fs.existsSync(filePath)) {
    console.warn('src/types/lifeform.ts not found; skipped EmotionalState patch.')
    return false
  }

  let content = read(filePath)

  if (content.includes("'amused'")) {
    console.log('EmotionalState already contains amused.')
    return false
  }

  const typeRegex =
    /export\s+type\s+EmotionalState\s*=\s*([\s\S]*?)(?=\n\n|export\s+(?:type|interface|const|function)|interface\s|type\s|const\s|$)/m

  const match = content.match(typeRegex)

  if (!match) {
    console.warn("Could not find export type EmotionalState; add | 'amused' manually.")
    return false
  }

  const block = match[0]
  let nextBlock = block

  if (block.includes("'afraid'")) {
    nextBlock = block.replace(
      /(\|\s*'afraid'\s*\n)/,
      "$1  | 'amused'\n",
    )

    if (nextBlock === block) {
      nextBlock = block.replace(
        /('afraid'\s*\|)/,
        "'afraid' | 'amused' |",
      )
    }
  }

  if (nextBlock === block) {
    nextBlock = block.replace(
      /(;?\s*)$/,
      "\n  | 'amused'$1",
    )
  }

  content =
    content.slice(0, match.index) +
    nextBlock +
    content.slice(match.index + block.length)

  write(filePath, content)
  console.log('Added amused to EmotionalState.')
  return true
}

function ensureSpritesLabel() {
  const filePath = path.join(
    projectRoot,
    'src',
    'lib',
    'sprites.ts',
  )

  if (!fs.existsSync(filePath)) {
    console.warn('src/lib/sprites.ts not found; skipped EMOTION_LABELS patch.')
    return false
  }

  let content = read(filePath)

  if (
    content.includes('amused:') ||
    content.includes('"amused"')
  ) {
    console.log('EMOTION_LABELS already contains amused.')
    return false
  }

  let changed = false

  content = content.replace(
    /(afraid:\s*['"][^'"]+['"],?\s*\n)/,
    (full) => {
      changed = true
      return full + "  amused: 'Humor',\n"
    },
  )

  if (!changed) {
    content = content.replace(
      /(horny:\s*['"][^'"]+['"],?\s*\n)/,
      (full) => {
        changed = true
        return "  amused: 'Humor',\n" + full
      },
    )
  }

  if (!changed) {
    console.warn("Could not patch EMOTION_LABELS automatically; add amused: 'Humor' manually.")
    return false
  }

  write(filePath, content)
  console.log('Added amused label as Humor.')
  return true
}

function ensureDefaultSensitivityObjects() {
  const srcDir = path.join(projectRoot, 'src')
  const files = walk(srcDir)
    .filter((filePath) =>
      filePath.endsWith('.ts') ||
      filePath.endsWith('.tsx'),
    )

  let changedFiles = 0

  for (const filePath of files) {
    let content = read(filePath)

    if (
      content.includes('amused:') ||
      !content.includes('afraid:') ||
      !content.includes('horny:')
    ) {
      continue
    }

    const isLikelySensitivityFile =
      content.includes('EmotionalSensitivities') ||
      content.includes('emotional_sensitivities') ||
      content.includes('defaultEmotional') ||
      content.includes('DEFAULT_EMOTIONAL')

    if (!isLikelySensitivityFile) {
      continue
    }

    const nextContent = content.replace(
      /(afraid:\s*50,?\s*\n)/,
      "$1  amused: 50,\n",
    )

    if (nextContent !== content) {
      write(filePath, nextContent)
      changedFiles += 1
    }
  }

  console.log(
    'Default sensitivity object patch changed ' +
      String(changedFiles) +
      ' file(s).',
  )
}

ensureEmotionalStateUnion()
ensureSpritesLabel()
ensureDefaultSensitivityObjects()

console.log('')
console.log('Humor type/label patch completed.')
