import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const srcRoot = path.join(projectRoot, 'src')

const replacementGroups = [
  {
    label: 'intro subtitle',
    replacements: [
      [
        'Un’identità visiva e relazionale applicata al modello IA scelto dall’utente.',
        'A visual and relational identity applied to the AI model chosen by the user.',
      ],
      [
        "Un'identità visiva e relazionale applicata al modello IA scelto dall'utente.",
        'A visual and relational identity applied to the AI model chosen by the user.',
      ],
      [
        'Un’identità visiva e relazionale applicata al modello IA scelto dall’utente',
        'A visual and relational identity applied to the AI model chosen by the user',
      ],
      [
        "Un'identità visiva e relazionale applicata al modello IA scelto dall'utente",
        'A visual and relational identity applied to the AI model chosen by the user',
      ],
    ],
  },
  {
    label: 'development note',
    replacements: [
      [
        'Versione di sviluppo: la conferma dell’indirizzo email è temporaneamente disattivata.',
        'Development version: email confirmation is temporarily disabled.',
      ],
      [
        "Versione di sviluppo: la conferma dell'indirizzo email è temporaneamente disattivata.",
        'Development version: email confirmation is temporarily disabled.',
      ],
      [
        'Versione di sviluppo: la conferma dell’indirizzo email è temporaneamente disattivata.',
        'Development version: email confirmation is temporarily disabled.',
      ],
    ],
  },
  {
    label: 'email placeholder',
    replacements: [
      ['nome@esempio.com', 'name@example.com'],
      ['Nome@esempio.com', 'name@example.com'],
    ],
  },
  {
    label: 'password placeholder',
    replacements: [
      ['almeno 8 caratteri', 'at least 8 characters'],
      ['Almeno 8 caratteri', 'At least 8 characters'],
    ],
  },
]

const fileExtensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.css',
  '.html',
])

function walk(directory) {
  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  })

  const files = []

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === '.git'
      ) {
        continue
      }

      files.push(...walk(fullPath))
      continue
    }

    if (
      entry.isFile() &&
      fileExtensions.has(path.extname(entry.name))
    ) {
      files.push(fullPath)
    }
  }

  return files
}

function replaceAllLiteral(content, from, to) {
  return content.split(from).join(to)
}

if (!fs.existsSync(srcRoot)) {
  console.error(`src folder not found: ${srcRoot}`)
  process.exit(1)
}

const files = walk(srcRoot)

const groupResults = replacementGroups.map((group) => ({
  label: group.label,
  count: 0,
  files: new Set(),
}))

let changedFileCount = 0

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8')
  const original = content

  replacementGroups.forEach((group, groupIndex) => {
    group.replacements.forEach(([from, to]) => {
      const before = content
      content = replaceAllLiteral(content, from, to)

      if (content !== before) {
        const count =
          before.split(from).length -
          content.split(from).length

        groupResults[groupIndex].count += count
        groupResults[groupIndex].files.add(
          path.relative(projectRoot, filePath),
        )
      }
    })
  })

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8')
    changedFileCount += 1
  }
}

console.log('')
console.log('Exact login English replacements')
console.log('--------------------------------')

let missingCount = 0

for (const result of groupResults) {
  const filesText =
    result.files.size > 0
      ? Array.from(result.files).join(', ')
      : 'NOT FOUND'

  console.log(
    `${result.label}: ${result.count} replacement(s) — ${filesText}`,
  )

  if (result.count === 0) {
    missingCount += 1
  }
}

console.log('')
console.log(`Changed files: ${changedFileCount}`)

if (missingCount > 0) {
  console.log('')
  console.warn(
    `${missingCount} target string(s) were not found. Search the project manually for the remaining Italian text and send me the file if needed.`,
  )
  process.exitCode = 2
} else {
  console.log('')
  console.log('All requested login strings were replaced.')
}
