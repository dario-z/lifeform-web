# SPRINT 11 — Native Voice

## Objective

Add free text-to-speech to Digital Lifeform without cloud TTS, an audio provider,
server infrastructure or saved audio.

## Distinct modes

| Mode | Behaviour |
|---|---|
| Off | No playback; speaker controls are disabled. |
| Manual | Speaker control appears on every Lifeform reply. |
| Auto | Manual controls remain; every newly completed Lifeform reply is also read automatically. |

The default mode is Manual. This allows voice interaction without unexpected
sound when a user opens the app.

## Persistence

Settings are stored only in browser localStorage, scoped to the Lifeform ID:

```text
lifeform.native-voice.<lifeform-id>
```

Saved values:
- mode
- selected device voice URI
- rate

No Supabase migration and no persistent server-side voice setting are needed.

## Privacy

The app uses browser speech synthesis. It does not create audio files, upload
audio, or save audio bytes. Device/browser implementation details remain
outside this app's control.

## Scope deliberately excluded

- voice cloning
- custom proprietary voices
- spoken user input / microphone transcription
- saved voice conversations
- Dream narration
- speech during streaming partial output
