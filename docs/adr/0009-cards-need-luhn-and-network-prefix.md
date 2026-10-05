# 0009. Card numbers must pass the Luhn check and carry a card network's prefix

Status: drafted by Claude Code, awaiting Michael's review
Date: 2026-10-05

## Context

Payment card numbers are 13 to 19 digits and end with a Luhn check digit. Code and documents are full of other long numbers: timestamps, IDs, test vectors, constants. Because the Luhn check is a single digit, about one random number in ten passes it by chance. For a scrubbing control a missed card leaks, but a detector that fires on every long constant gets switched off.

## Options

1. **Luhn only.** Simple, but roughly 10% of long numbers pass by chance.
2. **Luhn plus the network prefix (IIN) and the lengths that network issues.** Visa, Mastercard (including the 2-series), American Express, Discover, JCB, UnionPay and Diners Club International cover the cards in use in Singapore. Prefix and length are public scheme rules.
3. **Context words** ("card", "PAN"). Misses card numbers in CSV files, JSON and logs, where there are no words, like the phone decision in ADR 0007.

## Decision

Option 2, with no context words. Spaces or hyphens between digits are allowed (single separators only), because people write cards in groups.

## Consequences

- Measured on 20 MB of the Go standard library's source (EVALS.md §2): of 14,124 card-shaped digit runs, 2,026 passed Luhn alone and 306 had a valid prefix and length alone. Only 3 passed both, all floating-point literals in compiler tests.
- A card from a network not in the table (for example a domestic debit scheme) is missed. Adding a network is a minor version: new matches, no changed expectations for existing fixtures.
- The prefix table is a secondary source except Mastercard's 2-series range, which comes from Mastercard (VALIDATORS.md). Networks can change ranges; the table is reviewed at each release.
- Digits after a decimal point (`0.39…`) can match, because RE2 has no lookbehind to rule out a preceding `.`.
