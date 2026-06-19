import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const cssPath = path.join(
  projectRoot,
  'src',
  'components',
  'IvoryGlassTheme.css',
)

const marker = 'IVORY GLASS V15 — CHANGE API HIGH CONTRAST'

const cssBlock = "\n/* ============================================================\n   IVORY GLASS V15 — CHANGE API HIGH CONTRAST\n   ============================================================ */\n\n/*\n * Stronger than the previous patch: this targets the whole Change API\n * / Gemini setup page, not only the characters typed inside inputs.\n */\n\nbody #root .gemini-setup-card,\nbody #root .gemini-setup-card *,\nbody #root .gemini-setup-content,\nbody #root .gemini-setup-content *,\nbody #root .gemini-description,\nbody #root .gemini-description *,\nbody #root .gemini-details,\nbody #root .gemini-details *,\nbody #root .gemini-key-form,\nbody #root .gemini-key-form *,\nbody #root .api-key-input-row,\nbody #root .api-key-input-row * {\n  opacity: 1 !important;\n  text-shadow: none !important;\n}\n\nbody #root .gemini-setup-card p,\nbody #root .gemini-setup-card span,\nbody #root .gemini-setup-card label,\nbody #root .gemini-setup-card dt,\nbody #root .gemini-setup-card dd,\nbody #root .gemini-setup-card a,\nbody #root .gemini-setup-card .eyebrow,\nbody #root .gemini-setup-card .gemini-model-explanation,\nbody #root .gemini-setup-card .storage-explanation,\nbody #root .gemini-setup-card .api-key-warning,\nbody #root .gemini-setup-card .checkbox-row span,\nbody #root .gemini-setup-card .external-link {\n  color: #3f3a35 !important;\n  -webkit-text-fill-color: #3f3a35 !important;\n  opacity: 1 !important;\n}\n\nbody #root .gemini-setup-card h1,\nbody #root .gemini-setup-card h2,\nbody #root .gemini-setup-card h3,\nbody #root .gemini-setup-card strong,\nbody #root .gemini-setup-card .gemini-details dt,\nbody #root .gemini-setup-card .gemini-key-form > label,\nbody #root .gemini-setup-card .external-link {\n  color: #2f2b27 !important;\n  -webkit-text-fill-color: #2f2b27 !important;\n  opacity: 1 !important;\n}\n\nbody #root .gemini-setup-card input,\nbody #root .gemini-setup-card select,\nbody #root .gemini-setup-card textarea,\nbody #root .gemini-setup-card option,\nbody #root .gemini-setup-card .gemini-model-select,\nbody #root .gemini-setup-card .gemini-token-limit-input,\nbody #root .gemini-setup-card .api-key-input-row input {\n  color: #2f2b27 !important;\n  -webkit-text-fill-color: #2f2b27 !important;\n  caret-color: #2f2b27 !important;\n  opacity: 1 !important;\n}\n\nbody #root .gemini-setup-card input::placeholder,\nbody #root .gemini-setup-card textarea::placeholder,\nbody #root .gemini-setup-card .api-key-input-row input::placeholder {\n  color: #5f5750 !important;\n  -webkit-text-fill-color: #5f5750 !important;\n  opacity: 1 !important;\n}\n\nbody #root .gemini-setup-card select option,\nbody #root .gemini-setup-card .gemini-model-select option {\n  color: #2f2b27 !important;\n  -webkit-text-fill-color: #2f2b27 !important;\n  background: #fffdfb !important;\n}\n\n/* The checkbox itself must remain visible. */\nbody #root .gemini-setup-card input[type='checkbox'] {\n  accent-color: #4b4540 !important;\n}\n\n/* Buttons are the exception: graphite buttons keep white labels. */\nbody #root .gemini-setup-card button.primary-button,\nbody #root .gemini-setup-card button.primary-button *,\nbody #root .gemini-setup-card .primary-button,\nbody #root .gemini-setup-card .primary-button *,\nbody #root .gemini-setup-card button.small-secondary-button,\nbody #root .gemini-setup-card button.small-secondary-button * {\n  color: #ffffff !important;\n  -webkit-text-fill-color: #ffffff !important;\n  opacity: 1 !important;\n}\n\n/* The top Sign out button is light, so it needs graphite text even when disabled. */\nbody #root .gemini-setup-header button.secondary-button,\nbody #root .gemini-setup-header button.secondary-button *,\nbody #root .gemini-setup-header .secondary-button,\nbody #root .gemini-setup-header .secondary-button * {\n  color: #3f3a35 !important;\n  -webkit-text-fill-color: #3f3a35 !important;\n  opacity: 1 !important;\n}\n\n/* Autofill text in Chrome/Safari. */\nbody #root .gemini-setup-card input:-webkit-autofill,\nbody #root .gemini-setup-card input:-webkit-autofill:hover,\nbody #root .gemini-setup-card input:-webkit-autofill:focus {\n  -webkit-text-fill-color: #2f2b27 !important;\n  box-shadow:\n    0 0 0 1000px\n    rgba(255, 253, 250, 0.86)\n    inset !important;\n  transition:\n    background-color 9999s ease-out 0s !important;\n}\n"

if (!fs.existsSync(cssPath)) {
  console.error(`File not found: ${cssPath}`)
  process.exit(1)
}

const current = fs.readFileSync(cssPath, 'utf8')

if (current.includes(marker)) {
  console.log('V15 Change API contrast CSS is already present.')
  process.exit(0)
}

fs.writeFileSync(
  cssPath,
  current.trimEnd() + '\n' + cssBlock + '\n',
  'utf8',
)

console.log('Added V15 Change API high contrast CSS to src/components/IvoryGlassTheme.css')
