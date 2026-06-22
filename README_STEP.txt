DIGITAL LIFEFORM — SPRINT 08
ONE-TIME IMAGE ATTACHMENTS + VISUAL UNDERSTANDING

WHAT THIS ADDS
--------------
A small + button next to the chat composer lets the user attach one image:
- PNG
- JPG / JPEG
- WEBP
- GIF
- maximum 10 MB

The user can send:
- text only;
- image only;
- image + text.

The selected image appears in a small preview before sending and can be removed.

WHAT HAPPENS TO THE IMAGE
-------------------------
- The app reads the chosen file in the browser and sends it as inline image data
  only with the current Gemini request.
- The file itself is NOT uploaded to Supabase and is NOT stored in the messages table.
- The saved chat message contains only a small textual filename marker, so the
  history remains understandable.
- A later reply is explicitly told that an old “Image shared” marker does NOT
  mean the model can still see that old image.
- Image attachment messages do NOT automatically create a Key Memory, Goal or
  Belief. Visual content remains intentionally ephemeral.

INSTALLATION
------------
0. Commit your working version first:

   cd /d C:\Projects\lifeform-web
   git add .
   git commit -m "Stable base before image attachments"
   git push

1. Extract this ZIP into:

   C:\Projects\lifeform-web

2. No Supabase migration is required.

3. Build and run:

   cd /d C:\Projects\lifeform-web
   npm run build
   npm run dev

WHAT TO TEST
------------
1. Click + near the message composer.
2. Attach a small PNG or JPG.
3. Check that a preview, filename and size appear.
4. Send an image with a question:
   “What looks wrong in this interface?”
5. Check the Lifeform response talks about the attached image.
6. Reload the page:
   - the actual image must NOT reappear;
   - only the small history marker remains.
7. Try an image-only message:
   - attach a picture;
   - leave the text field empty;
   - Send must be enabled.
8. Try a non-image or a file above 10 MB:
   - it should show a clear error without sending.

IMPORTANT
---------
This is image understanding only. It does not implement permanent image storage,
documents, PDFs, web search or image generation.
