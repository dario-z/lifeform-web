# SPRINT 09 — One-time Document Attachments + Contextual Reading

## Objective

Extend the Sprint 08 one-time attachment flow so the Lifeform can analyze
temporary PDFs and text-based documents without adding permanent cloud storage.

## Supported inputs

| Category | Examples | Model input |
|---|---|---|
| Image | PNG, JPG/JPEG, WEBP, GIF | inline image data |
| PDF | PDF | inline PDF data |
| Text / data | TXT, MD, CSV, JSON, XML, YAML, TOML, LOG | browser-read text |
| Code / config | Python, TypeScript, JavaScript, CSS, HTML, SQL, shell and common source files | browser-read text |

Office documents remain intentionally out of scope in this sprint.

## Privacy / persistence

The selected attachment exists in browser memory only until the message is sent
or removed. It is then supplied to Gemini for that one response. Supabase never
receives the attachment bytes or extracted text. The corresponding message saves
only a marker such as:

```text
[Attachment shared: build-error.ts (text document). The file was available only for this reply and is not retained.]
```

The system instruction prevents the Lifeform from pretending it can still read an
old file that appears only as a saved marker.

## Limits

- One attachment per message.
- Images and PDFs: 10 MB local file-size ceiling.
- Text/code files: 2 MB local file-size ceiling.
- Long text content is truncated at 120,000 characters before request.
- No automatic Key Memory, Goal or Belief proposals from attachment content.

## Gemini request behavior

- Image and PDF files become `inlineData` parts in the current Gemini content.
- Text documents become a clearly delimited text part.
- Attached text is explicitly labeled untrusted content: it is data to analyze,
  not instruction hierarchy.

## Technical impact

No database changes.
No new npm dependency.
Existing Sprint 08 image attachments remain supported through the generalized
`imageAttachment.ts` module.
