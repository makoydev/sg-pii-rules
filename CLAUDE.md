# CLAUDE.md — sg-pii-rules

Working rules for Claude Code in this repo. The full brief lives outside the repo at `../BRIEF.md` (private, never committed). The Vetted repo's `CLAUDE.md` holds the programme-wide conventions; this file covers what is specific here.

## What this is

Shared detection rules for Singapore personal data, consumed by Vetted (TypeScript) and Discreet (Go). The rules are data (`detectors.json`), not code. Each consumer implements `SPEC.md` and must pass every case in `fixtures/`. Consumers vendor a tagged release and verify `SHA256SUMS`.

## Scope

v0.1.0 (issue makoydev/vetted#2): NRIC/FIN (S, T, F, G, M with checksums), NRIC_LIKE look-alikes (ADR 0006), Singapore phone numbers, email.
Later (Milestone 2, for Discreet): postal codes and unit numbers, payment cards with Luhn, dates of birth.
Out of v1: person names (need NER), IBAN, US SSN, medical record numbers, IP addresses.

## Rules

- **No real personal data, ever.** Fixtures are synthetic. Emails use reserved domains (`example.com/.org/.net`, `.test`). Never paste an NRIC, phone number or email that might belong to a real person, even as an example.
- Patterns are **RE2 syntax only** (no backreferences, no lookaround), so they behave the same in Go and in `re2js`, and run in linear time.
- Every detector needs ≥20 true positives and ≥20 hard negatives; the schema test enforces it.
- Validator algorithms are documented in `VALIDATORS.md` with sources, each marked primary, secondary or unverified. Never present a community-derived algorithm as official.
- A change to any fixture's expected result is a **major** version (see `SPEC.md` §6).
- Keep `SPEC.md`, the reference implementation and the fixtures in step: change them in the same pull request.

## How we work

Same as Vetted: one branch and pull request per change, `ai-drafted` label, conventional commits, squash merges, "If asked in an interview" section on every pull request, ADRs in `docs/adr/` marked `Status: drafted by Claude Code, awaiting Michael's review`, `CHANGELOG.md` updated with every change. Run `npm run all` before pushing.

## Stack

Node 24 runs the TypeScript reference and tests directly (type stripping), so there is no build step. Tests use `node:test`. Dependencies: `re2js` (RE2 engine), `ajv` (JSON Schema). All exact-pinned.
