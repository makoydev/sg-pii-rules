# 0011. Postal codes are detected only after an address clue

Status: drafted by Claude Code, awaiting Michael's review
Date: 2026-10-05

## Context

A Singapore postal code is six digits whose first two are the postal sector, 01 to 82 except 74. Almost any six-digit number passes that check: in this repository's 16 MB JavaScript corpus, 4,019 of 4,063 bare six-digit numbers did (EVALS.md §2c). Unlike cards (ADR 0009), there is no checksum to narrow it down.

## Options

1. **Six digits with a valid sector, anywhere.** Catches every postal code, and in code reports thousands of constants.
2. **Only after an address clue:** "Singapore" (any case), "S" or "S(" directly before the digits, or a key such as `postal code`, `postalCode`, `postcode` or `zip`, with an optional colon or equals sign and quotes.
3. **Only inside a full address** (block, street, unit). Precise, but street names are open-ended and the pattern would be unreadable.

## Decision

Option 2, reporting only the six digits through a `value` group (ADR 0010).

## Consequences

- On both real-code corpora (36 MB) the detector reported nothing, against 4,019 + 69 bare six-digit numbers that pass the sector check.
- A postal code with no clue, such as a bare `520123` in a CSV column named `pc`, is missed. Consumers who know a field holds postal codes can treat it as one directly.
- Lowercase `s(` and `S 520123` (with a space) are not clues: the first is usually a function call, and the second is rare in written addresses.
