DIGITAL LIFEFORM — SPRINT 11
NATIVE BROWSER VOICE (NO PAID API, NO SERVER, NO AUDIO STORAGE)

WHAT THIS ADDS
--------------
The Lifeform can now be read aloud through the browser's built-in speech
synthesis. This uses the voices already available on the user's device.

- Speaker button on every Lifeform reply.
- Voice settings in the hamburger menu.
- Modes: Off, Manual, Auto.
- Default: Manual (no unexpected audio).
- Choose a compatible device voice where available.
- Playback speed: 0.85× to 1.15×.
- Stop button while speech is playing.
- New user messages and clearing chat stop ongoing playback.

NO BACKEND / NO MIGRATION
-------------------------
No Supabase change is required.
No audio file is created.
No audio is uploaded or stored by this application.
No paid API, token usage or external TTS provider is used.

INSTALLATION
------------
0. Commit the working version first:

   cd /d C:\Projects\lifeform-web
   git add .
   git commit -m "Stable base before native voice"
   git push

1. Extract this ZIP into:

   C:\Projects\lifeform-web

2. It adds/replaces only:

   src\components\LifeformChat.tsx
   src\components\VoiceSettingsPanel.tsx
   src\components\VoiceSettingsPanel.css
   src\lib\nativeVoice.ts

3. Build and run:

   cd /d C:\Projects\lifeform-web
   npm run build
   npm run dev

TEST CHECKLIST
--------------
1. Open the hamburger menu and choose Voice · Manual.
2. Press Test voice.
3. Send a normal message. Press the speaker button below the Lifeform reply.
4. Press the same speaker button while speech is playing: it must stop.
5. Change Voice to Auto, press Test voice once, then send another message:
   the next completed Lifeform reply should start reading automatically.
6. Switch Voice to Off:
   playback stops and reply speaker buttons become disabled.
7. Reload the page:
   the chosen voice mode, voice and speed remain local to this Lifeform
   on this browser/device.

IMPORTANT LIMIT
---------------
This is browser-native speech synthesis. The exact available voices and the
behaviour of Auto mode depend on the device and browser. Some browsers require
one initial Test voice click before they allow automatic playback.
