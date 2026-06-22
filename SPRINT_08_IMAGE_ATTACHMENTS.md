# SPRINT 08 — One-time Image Attachments + Visual Understanding

## Objective

Let the Lifeform observe one user-provided image in the current chat turn without
turning the web app into a permanent file host.

## User flow

```text
Choose image
→ see local preview
→ optionally add text
→ send
→ Gemini receives text + inline image data
→ the app stores only a textual history marker
→ preview disappears
```

## Persistence behavior

The app does not write image bytes to Supabase and does not retain the attachment
in its own chat state after sending. The attachment is passed to Gemini for the
current response under the user’s Gemini API account.

## Input rules

| Rule | Value |
|---|---|
| Attachment count | 1 per message |
| Formats | PNG, JPG/JPEG, WEBP, GIF |
| Browser-side file limit | 10 MB |
| Image-only message | Allowed |
| Automatic Memory / Goal / Belief proposal from image | Disabled |

## Chat-history safety

Messages with a one-time image save a marker such as:

```text
[Image shared: screenshot.png. The image was available only for this reply and is not retained.]
```

The system prompt explicitly prevents the Lifeform from claiming it can still see
that old image in a later conversation.

## No migration

No Supabase migration is required.
