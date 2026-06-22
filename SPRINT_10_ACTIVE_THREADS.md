# SPRINT 10 — Active Threads

## Purpose

Introduce a persistent but lightweight concept of **Active Thread**: a concise,
user-confirmed context for work or discussion that is still open.

Threads are deliberately separate from Goals.

| Concept | Meaning |
|---|---|
| Key Memory | Durable fact, preference or event |
| Goal | Durable direction / desired outcome |
| Belief | Tentative Lifeform perspective |
| Thread | Ongoing work or conversation context |
| Dream | Symbolic internal elaboration |

A Thread has no implied completion state beyond `active` / `archived`. It has no
tasks, deadlines, progress percentage or automation.

## Data model

### `lifeform_threads`

- `title`
- `current_context`
- `last_progress`
- `open_direction`
- `linked_goal_id` (optional)
- `status`: `active` or `archived`
- timestamps

### `lifeform_thread_proposals`

A separate proposal queue avoids changing an existing Thread without consent.

- `action`: `create` / `update`
- optional `target_thread_id`
- content fields
- optional `linked_goal_id`
- `status`: `pending` / `accepted` / `dismissed`
- exactly one pending proposal per Lifeform

## Creation and update flow

```text
Relevant recurring work conversation
→ conservative candidate extraction
→ Possible Active Thread / Possible Thread update card
→ user confirms
→ Thread is inserted or updated
```

If an existing Key Memory / Goal / Belief proposal is pending, Thread proposals are
not shown simultaneously.

## Attachment safety

Images, PDFs and documents are one-time inputs. Their contents are not persisted
to a Thread. The only possible persistent result is a user-confirmed concise work
context created from the conversation around that input.

## System prompt behavior

Active Threads are included as context with the explicit instruction that they are
not commitments, Goals, task lists or obligations.

## Scope intentionally excluded

- manual Thread editor;
- task lists;
- deadlines or reminders;
- automatic writes without confirmation;
- permanent attachment storage;
- search across all historic messages.
