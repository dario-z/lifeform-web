DIGITAL LIFEFORM - NATIVE DEVICE VOICE

WHAT THIS CHANGES
-----------------
Voice now uses only the browser/device Web Speech API:

- window.speechSynthesis
- SpeechSynthesisUtterance
- speechSynthesis.getVoices()

There are no extra speech packages, model files, server processes, external
voice services, API keys or generated audio services.

VOICE PANEL
-----------
The Voice panel contains:

1. Voice On/Off.
2. Language:
   - Italiano (it)
   - English (en)
   - Francais (fr)
   - Deutsch (de)
   - Espanol (es)
   - Japanese (ja)
3. Voice preference:
   - Female
   - Male
4. Available voice, populated only from voices returned by the device for the
   selected language.
5. Test voice.

REAL DEVICE LIMITS
------------------
Browsers expose installed voices differently. Some load getVoices() late, so the
app refreshes immediately and again through speechSynthesis.onvoiceschanged.

The Web Speech API does not provide an official gender field. Female/Male is a
best-effort preference based on known voice names. Unknown voices are not labeled
as Female or Male by the app.
