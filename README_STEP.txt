DIGITAL LIFEFORM — SPRINT 09
DOCUMENT ATTACHMENTS + ONE-TIME FILE READING

WHAT THIS ADDS
--------------
The existing + button can now attach one file per message:

- Images: PNG, JPG/JPEG, WEBP, GIF
- PDF
- Text documents: TXT, MD, CSV, JSON, XML, YAML, TOML, LOG
- Common source/config files: PY, JS, TS, TSX, JSX, CSS, HTML, SQL,
  SH, PS1, BAT, CMD, JAVA, C/C++, C#, GO, RS, PHP, RB, SWIFT, KT,
  VUE and SVELTE

The user can send:
- text only;
- one file only;
- text + one file.

HOW EACH FILE IS HANDLED
------------------------
- Images continue to work exactly as in Sprint 08.
- PDFs are passed to Gemini as temporary inline PDF data so it can read
  text, layout and pages in the current reply.
- Text/code/CSV files are read locally by the browser. Their readable text is
  passed only in the current Gemini request.
- No file bytes or text contents are written to Supabase.
- The chat history saves only a compact marker with name/type/size metadata.
- The Lifeform is instructed not to claim it can still inspect a past file.
- Attachments never create Key Memories, Goals or Beliefs automatically.

LIMITS
------
- Images and PDFs: 10 MB maximum.
- Text/code documents: 2 MB maximum.
- Text/code content longer than 120,000 characters is intentionally truncated
  before the model request. The document preview says so.

NOT INCLUDED
------------
- DOCX, XLSX, PPTX, ODT or other Office files.
- Permanent file storage.
- Multiple attachments in one message.
- PDF/text-driven automatic memory creation.

INSTALLATION
------------
0. Commit the working Sprint 08 version first:

   cd /d C:\Projects\lifeform-web
   git add .
   git commit -m "Stable base before document attachments"
   git push

1. Extract this ZIP directly into:

   C:\Projects\lifeform-web

2. No Supabase migration and no npm package installation are required.

3. Build and run:

   cd /d C:\Projects\lifeform-web
   npm run build
   npm run dev

IMPORTANT
---------
This package intentionally does NOT contain ImageAttachmentPreview.css.
Keep your current file exactly as it is: it includes your already-tested visual
positioning and styling for the + button.

WHAT TO TEST
------------
1. Image regression test:
   - attach a PNG/JPG;
   - verify the existing image preview still appears;
   - ask a question about it and send.

2. PDF:
   - attach a small PDF;
   - verify the preview says “PDF attached”;
   - ask “Summarize the important points.”;
   - send.
   - Reload after the response: the PDF itself must not reappear in chat.

3. Text/code:
   - attach a .ts, .py, .txt, .md, .csv or .json file;
   - verify the preview displays the file extension;
   - ask what the file does or what should be fixed;
   - send.

4. Image/PDF/text-only:
   - leave the textarea empty;
   - attach a supported file;
   - Send must be enabled.

5. Invalid file:
   - select a DOCX or random binary file;
   - the app should show a clear format error without sending.

6. Large file:
   - select a PDF/image over 10 MB or text file over 2 MB;
   - it should show a clear size error without sending.
