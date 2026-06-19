import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const srcRoot = path.join(projectRoot, 'src')

const replacements = [
  // Login/register tabs and buttons
  ['ACCEDI', 'SIGN IN'],
  ['REGISTRATI', 'REGISTER'],
  ['Accedi', 'Sign in'],
  ['Registrati', 'Register'],
  ['Accedi alla tua Lifeform', 'Access your Lifeform'],
  ['Crea la tua Lifeform', 'Create your Lifeform'],
  ['Crea la tua lifeform', 'Create your Lifeform'],
  ['Crea un account', 'Create an account'],
  ['Crea account', 'Create account'],
  ['Entra', 'Enter'],
  ['Esci', 'Sign out'],

  // Login headings
  ['BENTORNATO', 'WELCOME BACK'],
  ['Bentornato', 'Welcome back'],
  [
    'Riprendi la tua unica sessione personale.',
    'Resume your unique personal session.',
  ],
  [
    'Riprendi la tua sessione personale.',
    'Resume your personal session.',
  ],
  [
    'Versione di sviluppo: la conferma dell’indirizzo email è temporaneamente disattivata.',
    'Development version: email confirmation is temporarily disabled.',
  ],
  [
    "Versione di sviluppo: la conferma dell'indirizzo email è temporaneamente disattivata.",
    'Development version: email confirmation is temporarily disabled.',
  ],
  [
    'La conferma dell’indirizzo email è temporaneamente disattivata.',
    'Email confirmation is temporarily disabled.',
  ],
  [
    "La conferma dell'indirizzo email è temporaneamente disattivata.",
    'Email confirmation is temporarily disabled.',
  ],

  // Intro left panel
  ['PROJECT LIFEFORM', ''],
  ['Project Lifeform', ''],
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

  // Form labels
  ['EMAIL', 'EMAIL'],
  ['Email', 'Email'],
  ['PASSWORD', 'PASSWORD'],
  ['Password', 'Password'],
  ['CONFERMA PASSWORD', 'CONFIRM PASSWORD'],
  ['Conferma password', 'Confirm password'],
  ['NOME VISUALIZZATO', 'DISPLAY NAME'],
  ['Nome visualizzato', 'Display name'],
  ['NOME UTENTE', 'USERNAME'],
  ['Nome utente', 'Username'],
  ['NOME LIFEFROM', 'LIFEFORM NAME'],
  ['NOME LIFEFORM', 'LIFEFORM NAME'],
  ['Nome Lifeform', 'Lifeform name'],
  ['Nome della Lifeform', 'Lifeform name'],
  ['Nome della lifeform', 'Lifeform name'],

  // Placeholders / examples
  ['Inserisci la tua email', 'Enter your email'],
  ['Inserisci email', 'Enter email'],
  ['La tua email', 'Your email'],
  ['email@example.com', 'email@example.com'],
  ['nome@email.com', 'name@email.com'],
  ['tu@email.com', 'you@example.com'],
  ['Inserisci la password', 'Enter your password'],
  ['Inserisci password', 'Enter password'],
  ['Scegli una password', 'Choose a password'],
  ['La tua password', 'Your password'],
  ['Almeno 6 caratteri', 'At least 6 characters'],
  ['Minimo 6 caratteri', 'Minimum 6 characters'],
  ['Ripeti la password', 'Repeat the password'],
  ['Conferma la password', 'Confirm the password'],
  ['Come vuoi essere chiamato?', 'How should you be called?'],
  ['Come vuoi essere chiamato', 'How should you be called'],
  ['Il tuo nome', 'Your name'],
  ['es. Dario', 'e.g. Dario'],
  ['es. Lili', 'e.g. Lili'],
  ['Scegli il nome della tua Lifeform', 'Choose your Lifeform name'],
  ['Dai un nome alla tua Lifeform', 'Name your Lifeform'],

  // Small helper texts / errors commonly present in auth forms
  ['Hai già un account?', 'Already have an account?'],
  ['Non hai un account?', 'Do not have an account?'],
  ['Registrati ora', 'Register now'],
  ['Accedi ora', 'Sign in now'],
  ['Password dimenticata?', 'Forgot password?'],
  ['Campo obbligatorio', 'Required field'],
  ['Credenziali non valide', 'Invalid credentials'],
  ['Accesso non riuscito', 'Sign in failed'],
  ['Registrazione non riuscita', 'Registration failed'],
  ['Account creato', 'Account created'],
]

const textExtensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.css',
  '.html',
])

function walk(directory) {
  if (!fs.existsSync(directory)) {
    throw new Error(`Directory not found: ${directory}`)
  }

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
      textExtensions.has(path.extname(entry.name))
    ) {
      files.push(fullPath)
    }
  }

  return files
}

let changedFiles = 0
let totalReplacements = 0

for (const filePath of walk(srcRoot)) {
  let content = fs.readFileSync(filePath, 'utf8')
  const original = content
  let fileReplacementCount = 0

  for (const [from, to] of replacements) {
    if (!from) {
      continue
    }

    const parts = content.split(from)

    if (parts.length > 1) {
      fileReplacementCount += parts.length - 1
      content = parts.join(to)
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8')
    changedFiles += 1
    totalReplacements += fileReplacementCount
    console.log(
      `translated ${path.relative(projectRoot, filePath)} (${fileReplacementCount})`,
    )
  }
}

console.log(
  `Login translation complete: ${totalReplacements} replacements in ${changedFiles} files.`,
)
