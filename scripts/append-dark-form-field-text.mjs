import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const cssPath = path.join(
  projectRoot,
  'src',
  'components',
  'IvoryGlassTheme.css',
)

const marker = 'IVORY GLASS V14 — DARK FORM FIELD TEXT'

const cssBlock = '\n/* ============================================================\n   IVORY GLASS V14 — DARK FORM FIELD TEXT\n   ============================================================ */\n\nbody #root input,\nbody #root select,\nbody #root textarea,\nbody #root option,\nbody #root .auth-form input,\nbody #root .auth-form select,\nbody #root .auth-form textarea,\nbody #root .gemini-key-form input,\nbody #root .gemini-key-form select,\nbody #root .gemini-key-form textarea,\nbody #root .gemini-model-select,\nbody #root .gemini-token-limit-input,\nbody #root .api-key-input-row input {\n  color: var(--ivory-ink, #3f3a35) !important;\n  -webkit-text-fill-color: var(--ivory-ink, #3f3a35) !important;\n  caret-color: var(--ivory-graphite, #45413d) !important;\n}\n\nbody #root input::placeholder,\nbody #root textarea::placeholder,\nbody #root .auth-form input::placeholder,\nbody #root .auth-form textarea::placeholder,\nbody #root .gemini-key-form input::placeholder,\nbody #root .gemini-key-form textarea::placeholder,\nbody #root .api-key-input-row input::placeholder {\n  color: rgba(63, 58, 53, 0.68) !important;\n  -webkit-text-fill-color: rgba(63, 58, 53, 0.68) !important;\n  opacity: 1 !important;\n}\n\nbody #root select option,\nbody #root .gemini-model-select option {\n  color: #2f2b27 !important;\n  background: #fffdfb !important;\n}\n\nbody #root input:disabled,\nbody #root select:disabled,\nbody #root textarea:disabled {\n  color: rgba(63, 58, 53, 0.52) !important;\n  -webkit-text-fill-color: rgba(63, 58, 53, 0.52) !important;\n  opacity: 1 !important;\n}\n\n/* Chrome/Safari autofill often makes text too pale unless forced. */\nbody #root input:-webkit-autofill,\nbody #root input:-webkit-autofill:hover,\nbody #root input:-webkit-autofill:focus {\n  -webkit-text-fill-color: var(--ivory-ink, #3f3a35) !important;\n  box-shadow:\n    0 0 0 1000px\n    rgba(255, 253, 250, 0.82)\n    inset !important;\n  transition:\n    background-color 9999s ease-out 0s !important;\n}\n'

if (!fs.existsSync(cssPath)) {
  console.error(`File not found: ${cssPath}`)
  process.exit(1)
}

const current = fs.readFileSync(cssPath, 'utf8')

if (current.includes(marker)) {
  console.log('V14 dark form field text CSS is already present.')
  process.exit(0)
}

fs.writeFileSync(
  cssPath,
  current.trimEnd() + '\n' + cssBlock + '\n',
  'utf8',
)

console.log('Added V14 dark form field text CSS to src/components/IvoryGlassTheme.css')
