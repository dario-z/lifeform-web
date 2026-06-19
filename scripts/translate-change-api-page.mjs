import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()

const targetFiles = [
  path.join(projectRoot, 'src', 'components', 'GeminiSetup.tsx'),
  path.join(projectRoot, 'src', 'lib', 'gemini.ts'),
]

const replacements = [
  // GeminiSetup.tsx — runtime/errors
  [
    'Non è stato possibile verificare la chiave API.',
    'The API key could not be verified.',
  ],
  [
    'La chiave inserita non sembra essere una chiave Gemini valida.',
    'The key you entered does not look like a valid Gemini API key.',
  ],
  [
    'Inserisci un numero valido di token giornalieri.',
    'Enter a valid number of daily tokens.',
  ],

  // GeminiSetup.tsx — header
  ['Modello IA', 'AI model'],
  ['Connetti ', 'Connect '],
  ['Esci', 'Sign out'],

  // GeminiSetup.tsx — description/details
  [
    'La Lifeform utilizzerà la tua chiave Gemini per generare le risposte e aggiornare il proprio stato emotivo.',
    'The Lifeform will use your Gemini key to generate replies and update its emotional state.',
  ],
  ['Modello selezionato', 'Selected model'],
  ['Token giornalieri', 'Daily tokens'],
  ['Salvataggio cloud', 'Cloud storage'],
  ['Disattivato', 'Disabled'],
  [
    'Crea o gestisci la chiave in Google AI Studio',
    'Create or manage your key in Google AI Studio',
  ],

  // GeminiSetup.tsx — model/token form
  ['Modello Gemini', 'Gemini model'],
  [
    'Gemini Flash-Lite Latest è il modello predefinito. La scelta viene ricordata nel browser e verrà usata sia per la chat sia per l’analisi emotiva.',
    'Gemini Flash-Lite Latest is the default model. Your choice is remembered in the browser and will be used for both chat and emotional analysis.',
  ],
  [
    "Gemini Flash-Lite Latest è il modello predefinito. La scelta viene ricordata nel browser e verrà usata sia per la chat sia per l'analisi emotiva.",
    'Gemini Flash-Lite Latest is the default model. Your choice is remembered in the browser and will be used for both chat and emotional analysis.',
  ],
  ['Soglia token giornaliera', 'Daily token threshold'],
  [
    'Puoi digitare liberamente un valore intero preciso. Valore standard: ',
    'You can enter any precise whole-number value. Default value: ',
  ],
  [
    '. Il parametro Tired crescerà dallo 0 al 100 in proporzione ai token realmente usati ogni giorno da chat e classificatore emotivo.',
    '. The Tired parameter will rise from 0 to 100 in proportion to the tokens actually used each day by chat and the emotional classifier.',
  ],
  [
    '. Il parametro Tired crescerà dallo 0 al 100 in proporzione ai token realmente usati ogni giorno dalla chat e dal classificatore emotivo.',
    '. The Tired parameter will rise from 0 to 100 in proportion to the tokens actually used each day by chat and the emotional classifier.',
  ],

  // GeminiSetup.tsx — API key form
  ['Chiave API Gemini', 'Gemini API key'],
  ['Incolla qui la chiave API', 'Paste the API key here'],
  ['Nascondi', 'Hide'],
  ['Mostra', 'Show'],
  [
    'Ricorda la chiave su questo dispositivo',
    'Remember the key on this device',
  ],
  [
    'Se non selezioni questa opzione, la chiave rimarrà disponibile soltanto nella sessione corrente del browser.',
    'If you do not select this option, the key will remain available only for the current browser session.',
  ],
  [
    'Verifica della connessione…',
    'Checking connection…',
  ],
  ['Verifica e connetti', 'Verify and connect'],
  [
    'La chiave non verrà salvata nel database né inclusa nell’esportazione della Lifeform. Un’applicazione eseguita nel browser non può però proteggerla con la stessa sicurezza di un backend.',
    'The key will not be saved in the database or included in the Lifeform export. A browser-based application, however, cannot protect it with the same security as a backend.',
  ],
  [
    "La chiave non verrà salvata nel database né inclusa nell'esportazione della Lifeform. Un'applicazione eseguita nel browser non può però proteggerla con la stessa sicurezza di un backend.",
    'The key will not be saved in the database or included in the Lifeform export. A browser-based application, however, cannot protect it with the same security as a backend.',
  ],

  // Locale
  ["toLocaleString('it-IT')", "toLocaleString('en-US')"],
  ['toLocaleString("it-IT")', 'toLocaleString("en-US")'],

  // src/lib/gemini.ts — model notes
  ['Predefinito e consigliato', 'Default and recommended'],
  ['Versione stabile corrente', 'Current stable version'],
  ['Versione stabile precedente', 'Previous stable version'],

  // src/lib/gemini.ts — friendly errors
  [
    'La quota disponibile per ',
    'The available quota for ',
  ],
  [
    ' è temporaneamente esaurita. ',
    ' is temporarily exhausted. ',
  ],
  [
    'Seleziona un altro modello oppure riprova dopo il ripristino della quota.',
    'Select another model or try again after the quota resets.',
  ],
  [
    ' non è disponibile per questa chiave API o regione. Seleziona un altro modello.',
    ' is not available for this API key or region. Select another model.',
  ],
  [
    " non è disponibile per questa chiave API o regione. Seleziona un altro modello.",
    ' is not available for this API key or region. Select another model.',
  ],
  [
    'La chiave Google non è autorizzata a usare ',
    'The Google key is not authorized to use ',
  ],
  [
    '. Controlla la chiave o seleziona un altro modello.',
    '. Check the key or select another model.',
  ],
  [
    ' è temporaneamente sovraccarico. Riprova tra poco oppure seleziona un altro modello.',
    ' is temporarily overloaded. Try again shortly or select another model.',
  ],
  [
    'Impossibile raggiungere Gemini. Controlla la connessione e riprova.',
    'Gemini could not be reached. Check your connection and try again.',
  ],
  [
    'Gemini non ha completato la richiesta con ',
    'Gemini did not complete the request with ',
  ],
  [
    '. Riprova oppure seleziona un altro modello.',
    '. Try again or select another model.',
  ],
  [
    'Gemini ha risposto senza restituire testo.',
    'Gemini replied without returning text.',
  ],
]

const regexReplacements = [
  {
    label: 'Connect heading punctuation',
    regex: /Connect\s+(\{lifeformName\})\./g,
    replacement: 'Connect $1.',
  },
  {
    label: 'Any remaining Italian API key placeholder',
    regex: /placeholder=["'](?:Incolla|Inserisci|Scrivi)[^"']*chiave API[^"']*["']/giu,
    replacement: 'placeholder="Paste the API key here"',
  },
  {
    label: 'Any remaining show/hide literals',
    regex: /\?\s*'Nascondi'\s*:\s*'Mostra'/g,
    replacement: "? 'Hide' : 'Show'",
  },
]

function replaceLiteral(content, from, to) {
  return content.split(from).join(to)
}

let total = 0
let changedFiles = 0

console.log('')
console.log('Change API page English translation')
console.log('-----------------------------------')

for (const filePath of targetFiles) {
  if (!fs.existsSync(filePath)) {
    console.log(`missing: ${path.relative(projectRoot, filePath)}`)
    continue
  }

  let content = fs.readFileSync(filePath, 'utf8')
  const original = content
  let count = 0

  for (const [from, to] of replacements) {
    const before = content
    content = replaceLiteral(content, from, to)
    if (content !== before) {
      const replacementCount =
        before.split(from).length - 1
      count += replacementCount
      total += replacementCount
    }
  }

  for (const item of regexReplacements) {
    const matches = [...content.matchAll(item.regex)]
    if (matches.length > 0) {
      content = content.replace(
        item.regex,
        item.replacement,
      )
      count += matches.length
      total += matches.length
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8')
    changedFiles += 1
  }

  console.log(
    `${path.relative(projectRoot, filePath)}: ${count} replacement(s)`,
  )
}

console.log('')
console.log(`Changed files: ${changedFiles}`)
console.log(`Total replacements: ${total}`)

const suspiciousWords = [
  'chiave',
  'giornalier',
  'Modello selezionato',
  'Salvataggio',
  'Disattivato',
  'Verifica',
  'connetti',
  'Nascondi',
  'Mostra',
  'Ricorda',
  'browser',
  'classificatore',
  'connessione',
  'riprova',
]

console.log('')
console.log('Remaining suspicious Italian fragments:')

let suspiciousCount = 0

for (const filePath of targetFiles) {
  if (!fs.existsSync(filePath)) {
    continue
  }

  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split(/\r?\n/)

  lines.forEach((line, index) => {
    if (
      suspiciousWords.some((word) =>
        line.toLowerCase().includes(word.toLowerCase()),
      )
    ) {
      suspiciousCount += 1
      console.log(
        `${path.relative(projectRoot, filePath)}:${index + 1}: ${line.trim()}`,
      )
    }
  })
}

if (suspiciousCount === 0) {
  console.log('none')
}

if (total === 0) {
  console.log('')
  console.warn(
    'No replacements were made. The page may already be translated or the text is in another file.',
  )
  process.exitCode = 2
}
