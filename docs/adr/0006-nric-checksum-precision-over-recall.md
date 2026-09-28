# 0006. Two NRIC detectors: valid check letter, and look-alikes

Status: accepted. Drafted by Claude Code; Michael Mendoza chose option 3 on review on 2026-09-28, over the brief's checksum-only rule.
Date: 2026-09-28

## Context

An NRIC-shaped string (`S1234567X`) may or may not be an NRIC. Checking the check letter removes about 10 in 11 random look-alikes, such as order numbers. But a real NRIC typed with a wrong letter is still personal data, and a checksum-only detector would let it through to a model. For a scrubbing control, a miss (a leak) usually costs more than a false alarm (an extra placeholder).

## Options

1. **Checksum required**, as the brief specifies. High precision, and the hard-negative fixtures are meaningful. Mistyped NRICs are missed.
2. **Shape only.** Catches mistyped NRICs, but also every NRIC-shaped reference number, which makes the fixtures' hard negatives pointless and floods reviews with placeholders.
3. **Both, as two detectors**: `NRIC` (check letter valid) and a lower-confidence `NRIC_LIKE` (NRIC shape, check letter invalid), so each consumer chooses how to treat each.

## Decision

Option 3, in v0.1.0. `sg_nric_fin` reports `NRIC`; `sg_nric_fin_like` reports `NRIC_LIKE` using the `sg_nric_fin_checksum_invalid` validator. The two never report the same text: a string has either a valid check letter or an invalid one.

Suggested handling, which each consumer decides and records in its own ADRs: Vetted scrubs both before anything reaches a model; Discreet tokenises `NRIC` and treats `NRIC_LIKE` per policy (tokenise or flag).

## Consequences

- Mistyped NRICs are caught, as `NRIC_LIKE`.
- NRIC-shaped reference numbers are also reported as `NRIC_LIKE`. Consumers that scrub them lose a little context (an order number becomes a placeholder). That's the accepted cost of not leaking a mistyped NRIC.
- The fixtures test both detectors. A look-alike is a hard negative for `NRIC` and a true positive for `NRIC_LIKE`, which is why `SPEC.md` §5 defines a case's kind relative to its file's entity.
