# SPRINT 05 — Dream Quality: Localized Central Anchors

## Goal

Make Dreams feel like short recovered fragments, where the random anchor is the actual engine of the Dream rather than a decorative English object.

## Output constraints

| Requirement | Rule |
|---|---|
| Length | 35–70 words |
| Title | 2–6 words |
| Anchor language | Same as the Lifeform language |
| Anchor location | First and final sentence |
| Anchor frequency | Exactly two occurrences |
| Anchor role | Protagonist, obstacle, or direct cause of two transformations |

## Internal versus displayed anchor

The library can keep English anchors for deterministic selection. Gemini translates or creatively localizes the selected phrase. The localized phrase is what gets saved to `dreams.random_anchor` and displayed in the Dreams page.

## Failure handling

The generator validates every new Dream. If it fails the language, length or centrality rules, it retries once. A failed Dream never blocks chat and does not create a fake fallback Dream.
