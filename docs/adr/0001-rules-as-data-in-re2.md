# 0001. Rules as data, with RE2 patterns and named validators

Status: drafted by Claude Code, awaiting Michael's review
Date: 2026-09-28

## Context

Two products need the same Singapore personal-data detectors: Vetted (TypeScript) and Discreet (Go). If each writes its own, they drift, and neither can show that it detects the same things as the other.

## Options

1. **A library per language.** Idiomatic, but two codebases to keep in step and no single artifact to review.
2. **One library, called from both** (for example a WebAssembly build). One implementation, but a heavy toolchain Michael would have to explain and maintain.
3. **Rules as data.** A JSON file of patterns plus names of validation functions, a written specification, and shared fixtures that every implementation must pass.

## Decision

Option 3. Patterns use **RE2** syntax, the dialect of Go's standard `regexp` package, which JavaScript runs through `re2js`. RE2 has no backreferences or lookaround, so the same pattern behaves the same in both languages and always matches in linear time. Checks that a regex can't express (checksums) are named validators, each specified in `VALIDATORS.md` and implemented once per language.

## Consequences

- One reviewable file defines what counts as personal data, and a rule change is a visible pull request.
- Validators are still written twice (TypeScript and Go); the shared fixtures catch any disagreement.
- Linear-time matching removes regex denial-of-service as a threat for both consumers.
