# 0003. Overlapping matches: longest wins, then detector order

Status: drafted by Claude Code, awaiting Michael's review
Date: 2026-09-28

## Context

Detectors can match overlapping text. An email address such as `91234567@example.com` contains a run of digits shaped like a Singapore mobile number. Without a rule, one secret could be reported twice, or replaced twice and garbled.

## Options

1. **Report everything, overlaps included.** Simple, but consumers that replace matched text would have to resolve the overlaps themselves, each in their own way.
2. **Priority by entity type.** Needs a ranking of entities, which is a policy question, not a detection one.
3. **Longest match wins; ties go to the detector listed first**, applied in one left-to-right pass (`SPEC.md` §4).

## Decision

Option 3. It is deterministic and short enough to implement identically in both languages. Fixtures include overlap cases so any divergence fails conformance.

## Consequences

- An email containing a phone-shaped number is reported once, as an email.
- The order of detectors in `detectors.json` carries meaning for ties; that is documented in the spec.
