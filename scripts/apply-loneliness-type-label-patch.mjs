import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function write(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8')
}

function patchLifeformTypes() {
  const filePath = path.join(
    root,
    'src',
    'types',
    'lifeform.ts',
  )

  if (!fs.existsSync(filePath)) {
    console.warn(
      'Missing src/types/lifeform.ts. Add lonely to EmotionalState manually.',
    )
    return
  }

  let content = read(filePath)
  let changed = false

  if (!content.includes("'lonely'")) {
    const before = content

    content = content.replace(
      /('horny'\s*\|)/,
      "'horny' | 'lonely' |",
    )

    if (content === before) {
      content = content.replace(
        /(\|\s*'horny'\s*\n)/,
        "$1  | 'lonely'\n",
      )
    }

    if (content === before) {
      console.warn(
        "Could not find the EmotionalState union. Add | 'lonely' manually.",
      )
    } else {
      changed = true
    }
  }

  // Some projects use a literal EmotionalSensitivities shape.
  // Loneliness is automatic, but include a harmless default of 50
  // when the type requires every EmotionalState key.
  if (
    content.includes('EmotionalSensitivities') &&
    !content.includes('lonely: number') &&
    content.includes('horny: number')
  ) {
    content = content.replace(
      /(horny:\s*number;?\s*\n)/,
      "$1  lonely: number\n",
    )
    changed = true
  }

  if (changed) {
    write(filePath, content)
    console.log(
      'Patched src/types/lifeform.ts for lonely.',
    )
  } else {
    console.log(
      'src/types/lifeform.ts already compatible with lonely.',
    )
  }
}

function patchEmotionLabels() {
  const filePath = path.join(
    root,
    'src',
    'lib',
    'sprites.ts',
  )

  if (!fs.existsSync(filePath)) {
    console.warn(
      'Missing src/lib/sprites.ts. Add lonely label manually.',
    )
    return
  }

  let content = read(filePath)

  if (content.includes('lonely:')) {
    console.log(
      'EMOTION_LABELS already contains lonely.',
    )
    return
  }

  const before = content

  content = content.replace(
    /(\n\s*horny:\s*['"][^'"]+['"],?\s*)/,
    "$1\n  lonely: 'Loneliness',",
  )

  if (content === before) {
    content = content.replace(
      /(\n\s*happy:\s*['"][^'"]+['"],?\s*)/,
      "$1\n  lonely: 'Loneliness',",
    )
  }

  if (content === before) {
    console.error(
      "Could not patch EMOTION_LABELS. Add lonely: 'Loneliness' inside src/lib/sprites.ts manually.",
    )
    process.exitCode = 1
    return
  }

  write(filePath, content)
  console.log(
    "Added lonely: 'Loneliness' to EMOTION_LABELS.",
  )
}

function walk(directory) {
  if (!fs.existsSync(directory)) {
    return []
  }

  return fs.readdirSync(directory, {
    withFileTypes: true,
  }).flatMap((entry) => {
    const fullPath = path.join(
      directory,
      entry.name,
    )

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

function patchDefaultSensitivityObjects() {
  let changes = 0

  for (const filePath of walk(
    path.join(root, 'src'),
  )) {
    if (
      !filePath.endsWith('.ts') &&
      !filePath.endsWith('.tsx')
    ) {
      continue
    }

    let content = read(filePath)

    if (
      content.includes('lonely:') ||
      !content.includes('amused:') ||
      !content.includes('horny:')
    ) {
      continue
    }

    const likelySensitivitySource =
      content.includes('EmotionalSensitivities') ||
      content.includes('emotional_sensitivities') ||
      content.includes('DEFAULT_EMOTIONAL') ||
      content.includes('defaultEmotional')

    if (!likelySensitivitySource) {
      continue
    }

    const next = content.replace(
      /(amused:\s*50,?\s*\n)/,
      "$1  lonely: 50,\n",
    )

    if (next !== content) {
      write(filePath, next)
      changes += 1
    }
  }

  console.log(
    'Patched ' +
      String(changes) +
      ' default sensitivity file(s).',
  )
}

patchLifeformTypes()
patchEmotionLabels()
patchDefaultSensitivityObjects()
