# SPRINT 06 — Confirmed Memory / Goal / Belief Proposals

## Objective

Replace autonomous Key Memory persistence with a user-confirmed proposal flow.

## Canonical storage model

This sprint deliberately does **not** create separate Goals or Beliefs tables.

| Proposal label | Existing Key Memory category |
|---|---|
| Possible memory | appropriate normal category |
| Possible goal | `long_term_goal` |
| Possible belief | `lifeform_belief` |

This makes accepted content immediately available in the existing Key Memories panel
and in the normal Gemini context, while avoiding a premature task-management system.

## Proposal eligibility

A candidate must:

- have importance of at least 70;
- contain a durable fact, preference, person, place, project, goal, event, or belief;
- be self-contained;
- be in the Lifeform primary language.

A candidate is rejected before display when it is:

- a generic summary;
- an ordinary conversation topic;
- temporary emotion or fleeting detail;
- repeated filler / isolated word;
- secret, token, password, or payment detail;
- already a manually confirmed memory.

## User actions

- **Keep it**: persists to `key_memories` with `source = 'manual'`.
- **Dismiss**: resolves the pending proposal without persistence and blocks automatic
  re-proposal of the exact same content.
- A user command such as “remember this” remains a direct manual save.

## Safety guarantees

- One pending proposal per Lifeform, enforced by a partial unique database index.
- No pending proposal can delete or replace a confirmed memory automatically.
- A full 10-memory list causes acceptance to fail transparently rather than removing
  a previous confirmed memory.
- Clear chat dismisses any still-pending proposal.
