# Threat model

What could go wrong with a shared rulebook for personal data, and what stops it. Reviewed at each release.

## What we protect

1. **The rules' integrity.** If `detectors.json` is weakened, every consumer silently stops scrubbing something.
2. **Consumers' availability.** The rules run on untrusted text (pull request diffs, user prompts).
3. **People's personal data.** None should ever be in this repository.
4. **Agreement between implementations.** Vetted and Discreet must detect the same things.

## Threats and mitigations

| #   | Threat                                               | Example                                                          | Mitigations                                                                                                                                                                                                           | Residual risk                                                                                                         |
| --- | ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| T1  | A rule is weakened or removed                        | A change narrows the NRIC pattern so M-series FINs stop matching | Every change is a pull request with required CI; the conformance suite (≥20 true positives per detector, enforced by a test) fails on the lost matches; changing an expected result is a major version (`SPEC.md` §6) | A weakening that also rewrites the fixtures would pass CI. Human review of `next` → `main` is the backstop (ADR 0008) |
| T2  | A vendored copy is edited or corrupted in a consumer | Someone edits Vetted's copy of `detectors.json` by hand          | `SHA256SUMS` over every vendored file; consumers' CI verifies it (ADR 0004); a test here keeps the sums current                                                                                                       | A consumer that skips the check loses this protection                                                                 |
| T3  | Regular-expression denial of service                 | A crafted diff makes a pattern backtrack for minutes             | All patterns are RE2 (no backreferences or lookaround), so matching is linear in the input size; a test compiles every pattern with RE2                                                                               | Linear time still grows with input size; consumers must cap input length (Vetted caps diff size)                      |
| T4  | Real personal data committed                         | A contributor pastes a real NRIC or phone number into a fixture  | Fixtures are generated from seeded scripts and a test rejects hand edits; emails use reserved domains only; `CLAUDE.md` forbids real data                                                                             | A randomly generated NRIC or phone number may coincide with a real one by chance. None is taken from any person       |
| T5  | Missed personal data (false negatives)               | A mistyped NRIC, or a phone number written `91 23 45 67`         | `NRIC_LIKE` catches wrong check letters (ADR 0006); known misses are published (ADR 0007, `EVALS.md`)                                                                                                                 | Unusual formats, names and addresses are not detected in v0.1.0                                                       |
| T6  | Implementations disagree                             | Go treats `\b` differently from the TypeScript port              | One spec, RE2 on both sides, value-based fixtures that any implementation can run (ADR 0002); an exact overlap algorithm (ADR 0003)                                                                                   | Validators are written twice; only the fixtures keep them aligned                                                     |
| T7  | Compromised development dependency                   | A malicious update to `re2js` or `ajv`                           | Exact version pins and lockfile; Dependabot updates reviewed through CI; npm 11 blocks install scripts by default; Actions pinned by commit SHA                                                                       | A compromised pinned version already in the lockfile                                                                  |
| T8  | Misleading provenance of the NRIC algorithm          | Presenting a community-derived checksum as official              | `VALIDATORS.md` grades every source primary or secondary and states that no official publication exists                                                                                                               | None known                                                                                                            |

## Out of scope

- How consumers use matches (tokenising, redacting, logging). That's in each consumer's own threat model.
- Confidentiality of the rules themselves. They are public by design.
