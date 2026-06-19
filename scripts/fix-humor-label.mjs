import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const filePath = path.join(
  projectRoot,
  'src',
  'lib',
  'sprites.ts',
)

if (!fs.existsSync(filePath)) {
  console.error(
    'File not found: src/lib/sprites.ts',
  )
  process.exit(1)
}

let content = fs.readFileSync(
  filePath,
  'utf8',
)

if (content.includes('amused:')) {
  console.log(
    'src/lib/sprites.ts already contains amused.',
  )
  process.exit(0)
}

const before = content

// Preferred: add the label right after afraid.
content = content.replace(
  /(\n\s*afraid:\s*['"][^'"]+['"],?\s*)/,
  "$1\n  amused: 'Humor',",
)

if (content === before) {
  // Fallback: add the label as first entry inside EMOTION_LABELS.
  content = content.replace(
    /(export\s+const\s+EMOTION_LABELS[\s\S]*?=\s*\{\s*)/,
    "$1\n  amused: 'Humor',",
  )
}

if (content === before) {
  console.error(
    "Could not patch EMOTION_LABELS automatically. Add this line manually inside src/lib/sprites.ts: amused: 'Humor',",
  )
  process.exit(1)
}

fs.writeFileSync(
  filePath,
  content,
  'utf8',
)

console.log(
  "Added amused: 'Humor' to src/lib/sprites.ts",
)
