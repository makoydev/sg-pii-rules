import type { FixtureCase } from '../test/helpers.ts'
import { nricCheckLetter } from '../reference/validators.ts'

// Everything here is synthetic. Digits come from a seeded generator, so a
// generated number with a valid check letter may coincide with an issued
// one by chance, but none is taken from any person (see VALIDATORS.md).

export const PREFIXES = ['S', 'T', 'F', 'G', 'M']
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export const TEMPLATES = [
  (v: string) => `Applicant NRIC: ${v}`,
  (v: string) => `{"nric": "${v}", "plan": "basic"}`,
  (v: string) => `row,id,status\n1,${v},active`,
  (v: string) => `WARN lookup failed for member ${v} at 10:42`,
  (v: string) => `const testMemberId = '${v}'`,
  (v: string) => `Please update the record for ${v}.`,
  (v: string) => `Holder (${v}) confirmed by phone`,
  (v: string) => `FIN ${v} expires next month`,
  (v: string) => `NRIC：${v}`,
  (v: string) => v
]

export function valid(prefix: string, digits: string): string {
  return prefix + digits + nricCheckLetter(prefix, digits)
}

export function wrongLetter(prefix: string, digits: string): string {
  const right = nricCheckLetter(prefix, digits)
  return prefix + digits + LETTERS[(LETTERS.indexOf(right) + 1) % 26]
}

/** First seven-digit string whose weighted sum plus offset leaves remainder r. */
export function digitsWithRemainder(prefix: string, r: number): string {
  const weights = [2, 7, 6, 5, 4, 3, 2]
  const offset = prefix === 'M' ? 3 : prefix === 'T' || prefix === 'G' ? 4 : 0
  for (let n = 0; n < 100; n++) {
    const digits = String(n).padStart(7, '0')
    const sum = weights.reduce((t, w, i) => t + w * Number(digits[i]), offset)
    if (sum % 11 === r) return digits
  }
  throw new Error(`No digits found for ${prefix} with remainder ${r}`)
}

export const nric = (value: string) => ({ entity: 'NRIC', value })
export const nricLike = (value: string) => ({ entity: 'NRIC_LIKE', value })

/** Look-alikes with an NRIC shape but a wrong check letter. */
export function wrongChecksumLookAlikes(): [string, string, string, string][] {
  const r8M = digitsWithRemainder('M', 8)
  const r8F = digitsWithRemainder('F', 8)
  // [id, text, value, note]
  return [
    [
      'ica-example',
      'Format example from ICA: M1234567B',
      'M1234567B',
      'Illustrative example in the ICA media release of 12 Jul 2021; fails the checksum.'
    ],
    [
      'pdpc-example',
      'e.g. S1234567A',
      'S1234567A',
      'Illustrative example in the PDPC NRIC guidelines; fails the checksum.'
    ],
    [
      'order-number',
      'Order number T1234567A shipped',
      'T1234567A',
      'NRIC-shaped order number.'
    ],
    [
      'm-with-fg-letter',
      `M${r8M}M`,
      `M${r8M}M`,
      'Remainder 8: the F/G table gives M but the M table gives J.'
    ],
    [
      'f-with-m-letter',
      `F${r8F}J`,
      `F${r8F}J`,
      'Remainder 8: the M table gives J but the F/G table gives M.'
    ]
  ]
}

/** Strings that match neither NRIC nor NRIC_LIKE. */
export function nonShapeNegatives(idPrefix: string): FixtureCase[] {
  const cases: [string, string, string][] = [
    ['prefix-a', 'Ticket A1234567D', 'A is not an NRIC/FIN prefix.'],
    ['prefix-e', 'Part E1234567D', 'E is not an NRIC/FIN prefix.'],
    ['too-short', 'S123456D', 'Six digits.'],
    ['too-long', 'S12345678D', 'Eight digits.'],
    [
      'embedded-left',
      'code ABS1234567D',
      'No word boundary before the prefix.'
    ],
    [
      'embedded-right',
      'token S1234567DZ',
      'No word boundary after the check letter.'
    ],
    [
      'trailing-digit',
      'S1234567D9',
      'No word boundary after the check letter.'
    ],
    ['masked', 'Holder S****567D', 'Masked NRIC; not a full number.'],
    [
      'partial',
      'last four: 567D',
      'Partial NRIC (PDPC guidelines §5.2); out of scope for these detectors.'
    ],
    ['separator', 'S1234567-D', 'Separator inside the number.']
  ]
  return cases.map(([id, text, note]) => ({
    id: `${idPrefix}-hn-${id}`,
    kind: 'hard_negative',
    text,
    expect: [],
    note
  }))
}
