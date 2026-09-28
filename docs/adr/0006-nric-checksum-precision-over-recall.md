# 0006. NRIC detection requires a valid check letter

Status: drafted by Claude Code, awaiting Michael's review
Date: 2026-09-28

## Context

An NRIC-shaped string (`S1234567X`) may or may not be an NRIC. Checking the check letter removes about 10 in 11 random look-alikes, such as order numbers. But a real NRIC typed with a wrong letter is still personal data, and a checksum-only detector would let it through to a model. For a scrubbing control, a miss (a leak) usually costs more than a false alarm (an extra placeholder).

## Options

1. **Checksum required** (as the brief specifies). High precision, and the hard-negative fixtures are meaningful. Mistyped NRICs are missed.
2. **Shape only.** Catches mistyped NRICs, but also every NRIC-shaped reference number, which makes the fixtures' hard negatives pointless and floods reviews with placeholders.
3. **Both, as two detectors**: `NRIC` (checksum valid) and a lower-confidence `NRIC_LIKE` (shape only, invalid checksum), so each consumer chooses. Vetted could scrub both; Discreet could tokenise `NRIC` and flag `NRIC_LIKE`.

## Decision

Option 1 for v0.1.0, as the brief specifies, with the limitation stated in `VALIDATORS.md` and the README. Option 3 is recorded as the preferred next step. It is a minor version bump, since existing fixtures would still pass unchanged.

## Consequences

- An NRIC with a typo in its check letter is not detected. Evaluation reports must say so.
- Adding `NRIC_LIKE` later needs its own fixtures, and each consumer must decide how to handle it.
