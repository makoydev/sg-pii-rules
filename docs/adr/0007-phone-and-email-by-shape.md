# 0007. Phone numbers and emails matched by shape, with known false positives

Status: accepted. Drafted by Claude Code; reviewed and accepted by Michael Mendoza on 2026-10-01.
Date: 2026-09-28

## Context

Singapore phone numbers and email addresses have no checksum. A pattern can only check their shape. The IMDA National Numbering Plan (Issue 2, February 2026, Table 2.1) allocates eight-digit numbers starting 3 (internet telephony), 6 (fixed line), 8 and 9 (mobile); 2, 4 and 5 are reserved. For a scrubbing control, a missed number leaks, while an extra match only replaces some text with a placeholder.

## Options

1. **Shape only, leaning towards recall.** Match the numbering plan's shape with common prefixes and separators, and emails with a permissive pattern. Accept some false positives.
2. **Shape plus context words** ("tel", "mobile", "call"). Fewer false positives, but it misses numbers in CSV files, JSON and code, where there are no context words. That is where Vetted finds them.
3. **A full email grammar (RFC 5322).** Accepts rare valid addresses (quoted local parts) that never appear in practice, and is far harder to read and port to Go.

## Decision

Option 1. Phone: eight digits starting 3, 6, 8 or 9, optionally split 4-4 by one space or hyphen, optionally preceded by `+65`, `(65)`, `(+65)`, `0065` or `65`. Email: a practical local part, an `@`, and a domain ending in two or more letters. Domains may start with a digit, because large providers do.

## Consequences

Known false positives. These are documented here and will be reported in `EVALS.md`, not hidden in the fixtures:

| Input                                                                                                                                               | Why it matches                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| A foreign number whose local part looks Singaporean, such as `+60 3-9123 4567`                                                                      | The pattern can't tell that `+60` earlier in the text changes the meaning of `9123 4567`                                   |
| Any eight-digit identifier starting 3, 6, 8 or 9, such as an invoice number                                                                         | No checksum exists to rule it out                                                                                          |
| A card number written in groups of four, where a group starting 3, 6, 8 or 9 is followed by another group (`6011 1111 1111 1117` gives `6011 1111`) | That pair has a phone number's shape. A card detector (Milestone 2) matches the longer card number, which wins the overlap |
| Image names such as `icon@2x.png`                                                                                                                   | Shaped exactly like an email address                                                                                       |
| SSH remotes such as `git@github.com:org/repo`                                                                                                       | Contains a well-formed address                                                                                             |

Known misses: numbers with unusual grouping (`91 23 45 67`), and obfuscated emails (`name [at] example [dot] com`).
