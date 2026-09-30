# 0008. Integration branch: Claude Code merges into `next`, Michael merges `next` into `main`

Status: accepted. Chosen by Michael Mendoza on 2026-09-30, from options drafted by Claude Code.
Date: 2026-09-30

## Context, options and decision

The same decision as Vetted's [ADR 0009](https://github.com/makoydev/vetted/blob/next/docs/adr/0009-integration-branch.md), applied to this repository. Every change gets its own pull request and CI run. Claude Code squash-merges CI-green pull requests into the protected `next` branch and labels them `ai-merged`. Michael reviews the batch and merges `next` → `main` (rebase merge) at the end of the milestone.

## Consequences specific to this repository

- Vetted must vendor a tagged release (ADR 0004), but final releases are made from `main` only. So a **release candidate** tag (`v0.1.0-rc.N`, marked as a pre-release) is cut on `next` for Vetted to vendor. Once Michael merges into `main`, `v0.1.0` is tagged there. Its files are byte-for-byte those of the release candidate, so `SHA256SUMS`, and every consumer's vendored copy, stay valid.
- Changes to what counts as personal data are no longer reviewed one by one before they merge into `next`. The conformance suite and the minimum fixture counts are the gate, and Michael reviews the batch before release.
