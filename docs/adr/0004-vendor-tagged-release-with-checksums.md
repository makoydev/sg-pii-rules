# 0004. Consumers vendor a tagged release and verify SHA256SUMS

Status: accepted. Drafted by Claude Code; reviewed and accepted by Michael Mendoza on 2026-09-28.
Date: 2026-09-28

## Context

Vetted and Discreet must use a known, reviewed version of the rules, and be able to prove which version they run. The rules decide what personal data is scrubbed, so an unnoticed change is a privacy risk.

## Options

1. **Publish packages** (npm and a Go module). Familiar, but two registries to publish to, and the supply-chain risk of a registry in between.
2. **Git submodule.** Pins a commit, but submodules confuse contributors and CI setups.
3. **Vendor the files from a tagged release** into each consumer, alongside `SHA256SUMS`; each consumer's CI recomputes the checksums and fails on any difference.

## Decision

Option 3. Releases are semantic-version tags with a GitHub Release. `SHA256SUMS` covers `detectors.json`, the schemas and the fixtures.

## Consequences

- Updating the rules is an explicit pull request in each consumer, showing exactly what changed.
- Editing a vendored file by hand fails the consumer's CI.
- No package registry is involved.
