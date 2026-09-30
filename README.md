# sg-pii-rules

Shared, tested detection rules for Singapore personal data, used by [Vetted](https://github.com/makoydev/vetted) (TypeScript) and Discreet (Go). The rules are data, not code: one reviewable file of patterns, a written specification, and synthetic test cases that every implementation must pass.

**All data in this repository is synthetic.** No real NRIC, phone number or email address appears anywhere; email fixtures use domains reserved for testing (RFC 2606).

## What it detects (v0.1.0)

| Entity      | Detector           | What it matches                                                                                                                         | Check                                                                                                                      |
| ----------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `NRIC`      | `sg_nric_fin`      | NRIC and FIN numbers: S, T, F, G and M series                                                                                           | Check letter must be valid ([VALIDATORS.md](VALIDATORS.md))                                                                |
| `NRIC_LIKE` | `sg_nric_fin_like` | NRIC shape with a **wrong** check letter: a mistyped NRIC, or a look-alike such as an order number                                      | Lower confidence; each consumer decides how to treat it ([ADR 0006](docs/adr/0006-nric-checksum-precision-over-recall.md)) |
| `PHONE`     | `sg_phone`         | Eight digits starting 3, 6, 8 or 9 (IMDA National Numbering Plan), optional `+65`, `(65)`, `0065` or `65`, optional 4-4 space or hyphen | Shape only ([ADR 0007](docs/adr/0007-phone-and-email-by-shape.md))                                                         |
| `EMAIL`     | `email`            | Practical email addresses                                                                                                               | Shape only                                                                                                                 |

Patterns use **RE2** syntax, so they behave identically in Go and in JavaScript (via `re2js`) and always match in linear time: a hostile input cannot make them backtrack forever.

## Use it in another project

1. Copy these files from a tagged release into your repo, unchanged: `detectors.json`, `schema/*.json`, `fixtures/*.json`, `SHA256SUMS`.
2. Verify them: `sha256sum -c SHA256SUMS` (Linux) or `shasum -a 256 -c SHA256SUMS` (macOS). Make your CI run this, so a hand edit fails the build.
3. Implement [`SPEC.md`](SPEC.md) (patterns, named validators, the overlap rule) with an RE2 engine, and run every case in `fixtures/` as a test. When all of them pass, your implementation conforms.

The TypeScript reference implementation in [`reference/`](reference) is about 100 lines and is a good starting point.

## Limitations

Read these before relying on the rules. Measured numbers are in [EVALS.md](EVALS.md).

- **Bare eight-digit numbers are ambiguous.** In code, numeric constants such as `67108864` (2²⁶) match `PHONE`. On a 16 MB sample of real JavaScript, almost all `PHONE` hits were constants like these.
- **Some look-alikes are reported.** NRIC-shaped reference numbers become `NRIC_LIKE`; image names such as `icon@2x.png` and SSH remotes such as `git@github.com:…` match `EMAIL`.
- **No person names, addresses, card numbers or dates of birth yet.** Names need NER. Postal codes, cards and dates of birth are planned for Milestone 2 (for Discreet).
- **A valid NRIC check letter does not mean the number was issued.** The checksum algorithm was never officially published; see [VALIDATORS.md](VALIDATORS.md) for sources and their grades.
- **Synthetic fixtures flatter rule-based detectors.** They are a behaviour specification, not a measure of real-world accuracy.

## Develop

Needs Node 24 (it runs the TypeScript directly; there is no build step).

```sh
npm ci
npm run all        # format, typecheck, 245 tests
npm run generate   # regenerate fixtures from the seeded generators
npm run sums       # regenerate SHA256SUMS after changing a vendored file
npm run measure    # count detector hits on real third-party JavaScript (counts only)
```

## How this project is run

- Specification: [`SPEC.md`](SPEC.md) · Validators and sources: [`VALIDATORS.md`](VALIDATORS.md)
- Decisions: [`docs/adr/`](docs/adr) · Controls: [`CONTROLS.md`](CONTROLS.md) · Threats: [`THREAT_MODEL.md`](THREAT_MODEL.md) · Evaluation: [`EVALS.md`](EVALS.md)
- AI assistance and its guardrails: [`docs/HOW-THIS-WAS-BUILT.md`](docs/HOW-THIS-WAS-BUILT.md) · Changes: [`CHANGELOG.md`](CHANGELOG.md)
- Programme board: <https://github.com/users/makoydev/projects/1>

## Licence

[Apache-2.0](LICENSE)
