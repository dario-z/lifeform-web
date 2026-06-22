# SPRINT 10.1 — Proposal Arbitration

## Objective

Keep Active Threads and Key Memories distinct, and prevent generic project or
personal conversation from becoming automatic Key Memory proposals.

## Rule hierarchy

```text
Explicit user save request
→ existing direct save flow

Clear ongoing work context / existing Thread
→ Active Thread evaluation and Thread proposal priority

Stable collaboration preference or standing constraint
→ conservative Key Memory proposal

Everything else
→ no proposal
```

## Thread priority

The app detects ongoing-work language and existing Thread title references.
It evaluates the Thread first. If a Thread candidate is found, it is queued
before a Key Memory. If the exchange is clearly ongoing work but no Thread is
warranted yet, automatic Memory creation is still suppressed.

## Autonomous Memory policy

Autonomous Key Memories must be high-importance durable preferences or
constraints relevant to future collaboration. They are no longer inferred from
generic projects, personal anecdotes, job details, hobbies, temporary plans,
events, issues or one-off topics.

Explicit `remember/save` behaviour is unchanged.

## Database

No database migration is required.
