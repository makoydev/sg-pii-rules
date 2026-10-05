# Evaluation

Measured on 2026-09-30 for v0.1.0 with the TypeScript reference implementation, Node 24.21.0 on an Apple-silicon Mac. Every number can be reproduced with the command next to it.

## 1. Conformance on synthetic fixtures (`npm test`)

| Entity      | True positives | Hard negatives | Mixed | Reference result |
| ----------- | -------------- | -------------- | ----- | ---------------- |
| `NRIC`      | 26             | 25             | 2     | 53 / 53 pass     |
| `NRIC_LIKE` | 25             | 20             | 1     | 46 / 46 pass     |
| `PHONE`     | 20             | 20             | 1     | 41 / 41 pass     |
| `EMAIL`     | 22             | 20             | 2     | 44 / 44 pass     |
| `CARD`      | 24             | 22             | 1     | 47 / 47 pass     |
| `POSTAL`    | 24             | 21             | 1     | 46 / 46 pass     |
| `UNIT`      | 24             | 21             | 1     | 46 / 46 pass     |
| **Total**   | **165**        | **149**        | **9** | **323 / 323**    |

**What this does and doesn't show.** The fixtures are the _specification_: they say what the detectors must find and must ignore, and 100% conformance means the reference implementation does exactly that. It is **not** a measure of real-world precision or recall. The cases were written by the same people as the patterns, and synthetic data flatters rule-based detectors.

Checked separately: deliberately breaking the code in nine different ways (wrong M-series table, wrong T offset, word boundaries removed, hand-edited fixture, the `+65` boundary bug, any leading digit, repeated separators, any top-level domain, underscores in domains) made at least one test fail each time.

## 2. Behaviour on real code (`npm run measure`)

The four detectors were run over 16.27 MB of real, third-party JavaScript: this repository's own dependencies (190 files, 214,127 lines, `node_modules/**/*.{js,cjs,mjs}` in sorted path order, excluding minified files). The script prints counts only; matched values are never printed, because third-party files can contain real maintainers' contact details.

| Entity              | Hits | Per MB | What they were                                                                                                                                                                                                                                              |
| ------------------- | ---- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NRIC`, `NRIC_LIKE` | 0    | 0      | No NRIC-shaped strings in this corpus                                                                                                                                                                                                                       |
| `EMAIL`             | 125  | 7.7    | 92 on reserved example domains (in docs and tests), 33 other address-like strings, 0 file names like `icon@2x.png`. All 125 are email-shaped, so this detector's precision _as an email detector_ was 100% here                                             |
| `PHONE`             | 659  | 40.5   | **All 659 were bare eight-digit numbers.** Only 45 distinct values; 17 values seen three or more times account for 603 hits (91%). These are numeric constants such as bit flags (`33554432` = 2²⁵, `67108864` = 2²⁶), almost all from one compiler package |

**Reading this honestly.** For code, `PHONE` has poor precision on unformatted numbers. In this sample, effectively every hit was a false positive. The rate depends heavily on the corpus: one large compiler file dominates it. Formatted numbers (`+65 9123 4567`, `9123-4567`) did not occur in this corpus at all, so this sample says nothing about recall. The cost of these false positives is a placeholder such as `<PHONE>` where a constant was. Consumers that scrub before sending to a model lose a little context but leak nothing. ADR 0007 records the decision to accept this in favour of recall.

### 2b. Card numbers on real code (`npm run measure:go`, added 2026-10-05)

The JavaScript corpus above contains no 13–19 digit numbers at all, so it says nothing about `CARD`. The Go standard library's source is full of long numbers (test vectors, constants), so the card detector was also run over its first 19.98 MB (Go 1.27.1, 1,015 `.go` files, 719,894 lines, sorted path order). The other detectors found 17 `PHONE` and 2 `EMAIL` hits there.

| Step                                         | Count of 13–19 digit runs |
| -------------------------------------------- | ------------------------- |
| Card-shaped (the pattern)                    | 14,124                    |
| Pass the Luhn check alone                    | 2,026 (14%)               |
| Have a network prefix and valid length alone | 306                       |
| **Pass both, reported as `CARD`**            | **3**                     |

All 3 were false positives: digits of floating-point literals in compiler and assembler tests. Either check alone would have reported hundreds or thousands; the combination is what makes the detector usable on code (ADR 0009). These counts come from a one-off breakdown of the same scan; `npm run measure:go` prints the final counts.

### 2c. Postal codes on real code (added 2026-10-05)

`POSTAL` reported **nothing** on either corpus: 0 hits in the 16.27 MB JavaScript corpus and 0 in the 19.98 MB Go corpus. No six-digit number in either sat after an address clue.

What the clue rule (ADR 0011) prevents: the JavaScript corpus has 4,063 bare six-digit numbers, and 4,019 of them pass the postal sector check. The Go corpus has 99, of which 69 pass. Without a clue requirement those 4,088 constants would all have been reported. These counts come from a one-off breakdown of the same scan.

Like the JavaScript corpus for cards, this shows the detector stays quiet on code. It says nothing about recall on real addresses, which the fixtures and Discreet's benchmark cover.

### 2d. Unit numbers on real code (added 2026-10-05)

`UNIT` reported **nothing** on either corpus. Both contain hash-number text it had to ignore: 24 (JavaScript) and 198 (Go) places where `#` is followed by a digit, mostly issue references, and 4 looser `#xx-digits` shapes in the Go corpus. These counts come from a one-off breakdown of the same scan.

## 3. Speed (`npm run measure`)

The reference implementation scanned the 16.27 MB corpus with all four detectors in 5.24 s, **about 3.1 MB/s**. That's fast enough for pull request diffs, which are capped at well under 1 MB by Vetted.

## 4. Known limitations

- False positives: bare eight-digit numbers starting 3, 6, 8 or 9 (constants, IDs); NRIC-shaped reference numbers (as `NRIC_LIKE`); a foreign number whose local part looks Singaporean (`+60 3-9123 4567`); some card-number groups; `icon@2x.png`; `git@github.com:org/repo`. See [ADR 0007](docs/adr/0007-phone-and-email-by-shape.md).
- False negatives: unusual phone groupings (`91 23 45 67`), obfuscated emails, partial NRICs (`567D`), cards from networks outside the seven covered, postal codes without an address clue, unit numbers written without `#` (`Unit 05-123`), and everything not yet covered (names, street names, dates of birth).
- `CARD` false positives: digits after a decimal point in long floating-point literals (3 in 20 MB of Go source).
- No labelled real-world data was used, and none can be without real personal data. Discreet's Milestone 2 benchmark (about 5,000 generated samples built from varied templates with typos and noise, rather than from these patterns) will give a more independent recall estimate.
