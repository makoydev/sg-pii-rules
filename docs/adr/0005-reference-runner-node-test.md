# 0005. TypeScript reference runner on node:test, no build step

Status: accepted. Drafted by Claude Code; reviewed and accepted by Michael Mendoza on 2026-09-28.
Date: 2026-09-28

## Context

The repository needs one implementation of `SPEC.md` so its fixtures are known to be consistent before Vetted or Discreet consume them. It should be small and easy to read.

## Options

1. **Go reference.** Matches Discreet, but Discreet doesn't exist yet and Vetted is TypeScript.
2. **TypeScript with Jest**, like Vetted. Needs a transform step and several dev dependencies.
3. **TypeScript run directly by Node 24** (type stripping) with the built-in `node:test` runner.

## Decision

Option 3. The reference is written in plain TypeScript without enums or other non-erasable syntax, so Node runs it without a compiler. `tsc --noEmit` type-checks it in CI. The only runtime dependencies are `re2js` and `ajv`.

## Consequences

- Very little tooling: three runtime/dev packages beyond TypeScript and Prettier.
- Vetted's implementation can reuse this reference's code directly, since both are TypeScript.
- Discreet adds the Go implementation in Milestone 2 and runs the same fixtures.
