import type { FixtureCase, FixtureFile } from '../test/helpers.ts'
import { nricCheckLetter } from '../reference/validators.ts'
import { randomDigits, seededRandom } from './random.ts'

// Everything here is synthetic. Digits come from a seeded generator, so a
// generated number with a valid check letter may coincide with an issued
// one by chance, but none is taken from any person (see VALIDATORS.md).

const PREFIXES = ['S', 'T', 'F', 'G', 'M']
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const TEMPLATES = [
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

function valid(prefix: string, digits: string): string {
  return prefix + digits + nricCheckLetter(prefix, digits)
}

function wrongLetter(prefix: string, digits: string): string {
  const right = nricCheckLetter(prefix, digits)
  return prefix + digits + LETTERS[(LETTERS.indexOf(right) + 1) % 26]
}

/** First seven-digit string whose weighted sum plus offset leaves remainder r. */
function digitsWithRemainder(prefix: string, r: number): string {
  const weights = [2, 7, 6, 5, 4, 3, 2]
  const offset = prefix === 'M' ? 3 : 0
  for (let n = 0; n < 100; n++) {
    const digits = String(n).padStart(7, '0')
    const sum = weights.reduce((t, w, i) => t + w * Number(digits[i]), offset)
    if (sum % 11 === r) return digits
  }
  throw new Error(`No digits found for ${prefix} with remainder ${r}`)
}

export function buildNricFixtures(): FixtureFile {
  const random = seededRandom(20260928)
  const cases: FixtureCase[] = []
  const expectNric = (value: string) => [{ entity: 'NRIC', value }]

  // True positives: five per prefix, in varied surroundings.
  let t = 0
  for (const prefix of PREFIXES) {
    for (let i = 0; i < 5; i++) {
      const value = valid(prefix, randomDigits(random, 7))
      const template = TEMPLATES[t % TEMPLATES.length]
      t++
      cases.push({
        id: `nric-tp-${String(t).padStart(3, '0')}`,
        kind: 'true_positive',
        text: template(value),
        expect: expectNric(value)
      })
    }
  }
  const lower = valid('T', randomDigits(random, 7)).toLowerCase()
  cases.push({
    id: 'nric-tp-lowercase',
    kind: 'true_positive',
    text: `nric=${lower}`,
    expect: expectNric(lower),
    note: 'Lower case is still an NRIC; the value is reported as written.'
  })

  // Hard negatives: generated wrong check letters, two per prefix.
  let n = 0
  for (const prefix of PREFIXES) {
    for (let i = 0; i < 2; i++) {
      n++
      cases.push({
        id: `nric-hn-wrong-letter-${String(n).padStart(2, '0')}`,
        kind: 'hard_negative',
        text: `Order reference ${wrongLetter(prefix, randomDigits(random, 7))} dispatched`,
        expect: [],
        note: 'NRIC-shaped reference with an invalid check letter.'
      })
    }
  }

  // Hard negatives: hand-picked shapes that must not match.
  const r8M = digitsWithRemainder('M', 8)
  const r8F = digitsWithRemainder('F', 8)
  const negatives: [string, string, string][] = [
    [
      'ica-example',
      'Format example from ICA: M1234567B',
      'Illustrative example in the ICA media release of 12 Jul 2021; fails the checksum.'
    ],
    [
      'pdpc-example',
      'e.g. S1234567A',
      'Illustrative example in the PDPC NRIC guidelines; fails the checksum.'
    ],
    [
      'order-number',
      'Order number T1234567A shipped',
      'NRIC-shaped order number.'
    ],
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
      'Partial NRIC (PDPC guidelines §5.2); out of scope for this detector.'
    ],
    ['separator', 'S1234567-D', 'Separator inside the number.'],
    [
      'm-with-fg-letter',
      `M${r8M}M`,
      'Remainder 8: the F/G table gives M but the M table gives J.'
    ],
    [
      'f-with-m-letter',
      `F${r8F}J`,
      'Remainder 8: the M table gives J but the F/G table gives M.'
    ]
  ]
  for (const [id, text, note] of negatives) {
    cases.push({
      id: `nric-hn-${id}`,
      kind: 'hard_negative',
      text,
      expect: [],
      note
    })
  }

  // Mixed: several candidates in one text.
  const a = valid('S', randomDigits(random, 7))
  const b = valid('G', randomDigits(random, 7))
  const c = wrongLetter('T', randomDigits(random, 7))
  cases.push(
    {
      id: 'nric-mixed-two-valid',
      kind: 'mixed',
      text: `Transfer from ${a} to ${b} approved`,
      expect: [...expectNric(a), ...expectNric(b)]
    },
    {
      id: 'nric-mixed-one-invalid',
      kind: 'mixed',
      text: `Primary ${a}, secondary ${c}`,
      expect: expectNric(a),
      note: 'The second number has an invalid check letter.'
    }
  )

  return { entity: 'NRIC', cases }
}
