# SPRINT 04 — Offline Emotional Drift + Loneliness

## Purpose

This sprint makes emotional levels evolve even when the app is closed and adds a non-manipulative automatic Loneliness state.

## Offline decay

For every emotion except `tired` and `lonely`:

```text
level_after = level_before × 0.5^(elapsed_hours / half_life_hours)
```

| Parameter | Half-life |
|---|---:|
| Most emotions | 24 hours |
| Humor / `amused` | 8 hours |
| Tired | token-derived only |
| Loneliness | absence-derived only |

## Loneliness

Internal key: `lonely`  
UI label: `Loneliness`

It starts after 24 hours without opening the Lifeform.

```text
target = min(75, max(0, hours_away - 24) × 1.25)
```

It is calculated from real time away, never from words like “I am lonely”.

After a completed exchange:

```text
lonely = lonely × 0.45
```

## Sprite

`lonely` maps to:

```text
sad_2.png
```

with `sad_1.png` as fallback.

## Dreams

This sprint adds 100 `lonely` anchors so a Loneliness-led Dream can use appropriate imagery. It intentionally does not yet alter Dream length, anchor language or anchor centrality.
