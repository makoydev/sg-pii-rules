# How this was built

Built with AI assistance (Claude Code) under the same guardrails as Vetted: a written brief kept outside the repo, `CLAUDE.md`, plan approval before code, pull requests only with required CI, and every decision recorded as an ADR for Michael's review. See Vetted's [build log](https://github.com/makoydev/vetted/blob/main/docs/HOW-THIS-WAS-BUILT.md) for roles and the full list of guardrails.

## How facts were sourced

The NRIC/FIN checksum, PDPC guidance and IMDA numbering facts were researched from primary sources first, with every claim graded primary, secondary or unverified (`VALIDATORS.md`). A key claim was then spot-checked independently: the M-series rule against GovTech FormSG's source. The implementation was written from the algorithm's description, not copied from any source.

## Exceptions

- The first commit (`LICENSE`, a README stub, `.gitignore`) went directly to `main`, because branch protection needs the branch to exist first.

## What the AI got wrong, and how it was caught

| Date       | What went wrong                                                                                                                                                            | How it was caught                                                                  | Fix                                                                                                                                                |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-28 | The fixture generator searched for edge-case digits with an unbounded loop, which ran forever when the validator was deliberately broken                                   | A mutation check (breaking the M-series table on purpose) hung instead of failing  | The search is now independent of the validator and bounded, and throws if it finds nothing                                                         |
| 2026-09-28 | While cleaning up that hung check, a `git checkout` meant to undo the deliberate break restored the last _committed_ version of the validator, discarding uncommitted work | Noticed the validator was missing when checking the state of every file afterwards | Rewrote the file from the session record and re-ran all tests. Mutation checks now back up and restore files explicitly, never with `git checkout` |
| 2026-09-28 | The first set of NRIC test vectors didn't exercise the one remainder (8) where the M and F/G tables differ, so breaking the M table was caught by only one test            | Mutation check                                                                     | Added vectors for remainder 8 in both series; the same break now fails two tests                                                                   |
