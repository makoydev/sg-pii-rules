# sg-pii-rules

Shared, tested detection rules for Singapore personal data, used by [Vetted](https://github.com/makoydev/vetted) (TypeScript) and Discreet (Go). The rules are data, not code: one reviewable file of patterns, a written specification, and synthetic test cases that every implementation must pass.

**All data in this repository is synthetic.** No real NRIC, phone number, email address, card number or address appears anywhere; email fixtures use domains reserved for testing (RFC 2606).

## What it detects (v0.2.0)

| Entity      | Detector           | What it matches                                                                                                                              | Check                                                                                                                      |
| ----------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `NRIC`      | `sg_nric_fin`      | NRIC and FIN numbers: S, T, F, G and M series                                                                                                | Check letter must be valid ([VALIDATORS.md](VALIDATORS.md))                                                                |
| `NRIC_LIKE` | `sg_nric_fin_like` | NRIC shape with a **wrong** check letter: a mistyped NRIC, or a look-alike such as an order number                                           | Lower confidence; each consumer decides how to treat it ([ADR 0006](docs/adr/0006-nric-checksum-precision-over-recall.md)) |
| `PHONE`     | `sg_phone`         | Eight digits starting 3, 6, 8 or 9 (IMDA National Numbering Plan), optional `+65`, `(65)`, `0065` or `65`, optional 4-4 space or hyphen      | Shape only ([ADR 0007](docs/adr/0007-phone-and-email-by-shape.md))                                                         |
| `EMAIL`     | `email`            | Practical email addresses                                                                                                                    | Shape only                                                                                                                 |
| `CARD`      | `payment_card`     | Payment card numbers, 13–19 digits, optionally grouped by spaces or hyphens                                                                  | Luhn check **and** a card network's prefix and length ([ADR 0009](docs/adr/0009-cards-need-luhn-and-network-prefix.md))    |
| `POSTAL`    | `sg_postal_code`   | Six-digit postal codes **after an address clue** ("Singapore", `S(`, `postal code:`, `postcode=`, `zip:`); only the digits are reported      | Valid postal sector, 01–82 except 74 ([ADR 0011](docs/adr/0011-postal-codes-need-an-address-clue.md))                      |
| `UNIT`      | `sg_unit_number`   | Unit numbers in the `#floor-unit` form: `#05-123`, `#12-34`, `#B1-23A`                                                                       | Shape only: floor 01–99 or B1–B9                                                                                           |
| `DOB`       | `date_of_birth`    | Dates **directly after a birth clue** (DOB, date of birth, born on, `dateOfBirth`…), in common day-first, month-first, ISO and written forms | The date exists in the calendar ([ADR 0012](docs/adr/0012-dates-of-birth-need-a-clue.md))                                  |

Patterns use **RE2** syntax, so they behave identically in Go and in JavaScript (via `re2js`) and always match in linear time: a hostile input cannot make them backtrack forever.

## Use it in another project

1. Copy these files from a tagged release into your repo, unchanged: `detectors.json`, `schema/*.json`, `fixtures/*.json`, `SHA256SUMS`.
2. Verify them: `sha256sum -c SHA256SUMS` (Linux) or `shasum -a 256 -c SHA256SUMS` (macOS). Make your CI run this, so a hand edit fails the build.
3. Implement [`SPEC.md`](SPEC.md) (patterns, `value` groups, named validators, the overlap rule) with an RE2 engine, and run every case in `fixtures/` as a test. When all of them pass, your implementation conforms.

The TypeScript reference implementation in [`reference/`](reference) is about 100 lines and is a good starting point.

## Limitations

Read these before relying on the rules. Measured numbers are in [EVALS.md](EVALS.md).

- **Bare eight-digit numbers are ambiguous.** In code, numeric constants such as `67108864` (2²⁶) match `PHONE`. On a 16 MB sample of real JavaScript, almost all `PHONE` hits were constants like these.
- **Some look-alikes are reported.** NRIC-shaped reference numbers become `NRIC_LIKE`; image names such as `icon@2x.png` and SSH remotes such as `git@github.com:…` match `EMAIL`.
- **No person names or street names.** Names need NER (a Presidio sidecar in Discreet, later).
- **Dates of birth need a clue right before them.** "Born in Singapore on 12 March 1988" and two-digit years (`12/03/88`) are missed ([ADR 0012](docs/adr/0012-dates-of-birth-need-a-clue.md)).
- **Unit numbers need the `#`.** `Unit 05-123` is not detected, and a hash followed by a floor-unit shape, such as `#12-34` used as a range, is.
- **Postal codes without an address clue are missed** (a bare `520123`), by design ([ADR 0011](docs/adr/0011-postal-codes-need-an-address-clue.md)).
- **Card numbers from networks outside the seven listed are missed**, and digits after a decimal point can occasionally match ([ADR 0009](docs/adr/0009-cards-need-luhn-and-network-prefix.md)).
- **A valid NRIC check letter does not mean the number was issued.** The checksum algorithm was never officially published; see [VALIDATORS.md](VALIDATORS.md) for sources and their grades.
- **Synthetic fixtures flatter rule-based detectors.** They are a behaviour specification, not a measure of real-world accuracy.

## Develop

Needs Node 24 (it runs the TypeScript directly; there is no build step).

```sh
npm ci
npm run all        # format, typecheck, 474 tests
npm run generate   # regenerate fixtures from the seeded generators
npm run sums       # regenerate SHA256SUMS after changing a vendored file
npm run measure    # count detector hits on real third-party JavaScript (counts only)
npm run measure:go # the same on the Go standard library's source (needs Go)
```

## How this project is run

- Specification: [`SPEC.md`](SPEC.md) · Validators and sources: [`VALIDATORS.md`](VALIDATORS.md)
- Decisions: [`docs/adr/`](docs/adr) · Controls: [`CONTROLS.md`](CONTROLS.md) · Threats: [`THREAT_MODEL.md`](THREAT_MODEL.md) · Evaluation: [`EVALS.md`](EVALS.md)
- AI assistance and its guardrails: [`docs/HOW-THIS-WAS-BUILT.md`](docs/HOW-THIS-WAS-BUILT.md) · Changes: [`CHANGELOG.md`](CHANGELOG.md)
- Programme board: <https://github.com/users/makoydev/projects/1>

## Licence

[Apache-2.0](LICENSE)
