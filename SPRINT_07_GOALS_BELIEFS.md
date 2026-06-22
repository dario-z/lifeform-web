# SPRINT 07 — Separate Goals and Beliefs

## Acceptance routing

| Proposal kind | Persisted in |
|---|---|
| Possible memory | `key_memories` |
| Possible goal | `lifeform_goals` |
| Possible belief | `lifeform_beliefs` |

## Context behavior

Only active Goals and active Beliefs are injected into the Gemini system context.
Goals are described as directions, not tasks. Beliefs are explicitly described as
tentative perspectives, not objective truths.

## Existing content

The migration transfers legacy Key Memories tagged `long_term_goal` or
`lifeform_belief` to their dedicated tables, then removes the old copies.
