# 0010. A pattern can require context without reporting it: the `value` group

Status: accepted. Drafted by Claude Code; reviewed and accepted by Michael Mendoza on 2026-10-06.
Date: 2026-10-05

## Context

Some personal data is only recognisable from what surrounds it. Six digits are a Singapore postal code after "Singapore" or "postal code:", and an ordinary number anywhere else (ADR 0011). Dates of birth (next release) have the same problem. RE2, our required regex dialect (ADR 0001), has no lookbehind, so a pattern cannot say "six digits preceded by Singapore" without the word becoming part of the match. Under the v0.1.0 spec the whole match is the reported value, so `Singapore 520123` would be replaced as a unit and a reader would lose the word "Singapore".

## Options

1. **Report the whole match, clue included.** No spec change, but consumers redact more than the personal data, and fixture values include the clue words.
2. **A named capture group `value`.** If a pattern has `(?P<value>…)`, only that group is reported; the rest of the match must be present but is context. RE2 supports named groups identically in Go's `regexp` and `re2js` (checked on 2026-10-05 with the postal pattern: same values, same positions).
3. **Context rules outside the pattern** (for example "within 20 characters of one of these words"). More flexible, but it is a second matching language for every implementation to get right.

## Decision

Option 2. `SPEC.md` §2: a pattern has at most one named group, and it must be called `value`; overlaps are resolved on the value's position, not the whole match. A schema test enforces the naming rule.

## Consequences

- An implementation written for v0.1.0 reports the whole match and fails the postal fixtures until it supports value groups. That is intended: consumers vendor a tagged release and upgrade deliberately (ADR 0004). Vetted stays on v0.1.0 until Milestone 3; Discreet implements value groups from the start (issue D3).
- Matches are still found as whole matches, scanning left to right, so the clue text is consumed: a clue cannot be shared by two values.
