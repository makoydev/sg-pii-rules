import type { FixtureCase, FixtureFile } from '../test/helpers.ts'
import { randomDigits, seededRandom } from './random.ts'

// Synthetic. Numbers are random within IMDA's ranges, so one may coincide
// with a real subscriber by chance; none is taken from any person.

const LEADING = ['3', '6', '8', '9']

const FORMATS = [
  (n: string) => n,
  (n: string) => `${n.slice(0, 4)} ${n.slice(4)}`,
  (n: string) => `${n.slice(0, 4)}-${n.slice(4)}`,
  (n: string) => `+65 ${n.slice(0, 4)} ${n.slice(4)}`,
  (n: string) => `+65${n}`,
  (n: string) => `+65-${n.slice(0, 4)}-${n.slice(4)}`,
  (n: string) => `(65) ${n.slice(0, 4)} ${n.slice(4)}`,
  (n: string) => `(+65)${n}`,
  (n: string) => `0065 ${n.slice(0, 4)} ${n.slice(4)}`,
  (n: string) => `65${n}`
]

const TEMPLATES = [
  (v: string) => `Contact number: ${v}`,
  (v: string) => `{"mobile": "${v}"}`,
  (v: string) => `row,phone\n1,${v}`,
  (v: string) => `Call ${v} after 6pm.`,
  (v: string) => `tel:${v}`,
  (v: string) => `const fallbackPhone = '${v}'`
]

const phone = (value: string) => ({ entity: 'PHONE', value })

export function buildPhoneFixtures(): FixtureFile {
  const random = seededRandom(20260930)
  const cases: FixtureCase[] = []

  // True positives: every leading digit in every format.
  let t = 0
  for (const format of FORMATS) {
    for (let i = 0; i < 2; i++) {
      const lead = LEADING[t % LEADING.length]
      const value = format(lead + randomDigits(random, 7))
      const template = TEMPLATES[t % TEMPLATES.length]
      t++
      cases.push({
        id: `phone-tp-${String(t).padStart(3, '0')}`,
        kind: 'true_positive',
        text: template(value),
        expect: [phone(value)]
      })
    }
  }

  // Hard negatives: close to a Singapore number, but not one.
  const negatives: [string, string, string][] = []
  for (const lead of ['0', '1', '2', '4', '5', '7']) {
    negatives.push([
      `leading-${lead}`,
      `Reference ${lead}${randomDigits(random, 7)}`,
      lead === '7'
        ? 'Leading 7 is for SMS short codes, not eight-digit numbers (IMDA NNP Table 2.1).'
        : `No eight-digit Singapore numbers start with ${lead} (IMDA NNP Table 2.1).`
    ])
  }
  negatives.push(
    ['nine-digits', `ID ${'9' + randomDigits(random, 8)}`, 'Nine digits.'],
    ['seven-digits', `ID ${'8' + randomDigits(random, 6)}`, 'Seven digits.'],
    [
      'after-letter',
      `S${'9' + randomDigits(random, 7)}`,
      'No word boundary between a letter and the digits.'
    ],
    ['country-code-too-long', '65912345678', 'Country code plus nine digits.'],
    [
      'toll-free',
      'Hotline 1800 123 4567',
      'Toll-free number: 11 digits, and a business number, not a subscriber line (IMDA NNP §8.1).'
    ],
    ['premium', 'Vote 1900 112 2334', 'Premium-rate number (IMDA NNP §9.1).'],
    ['us-number', 'US office +1 650 912 3456', 'United States number.'],
    ['uk-number', 'UK mobile +44 7911 123456', 'United Kingdom number.'],
    ['split-4-5', 'Order 8123-45678', 'Wrong grouping: four then five digits.'],
    ['double-space', '9123  4567', 'Two separators.'],
    ['price', 'Total SGD 9,123.45', 'An amount.'],
    [
      'date',
      'Settled on 20260928',
      'A date written as eight digits, starting with 2.'
    ],
    ['emergency', 'Dial 995 for emergencies', 'Three-digit emergency code.']
  )
  for (const [id, text, note] of negatives) {
    cases.push({
      id: `phone-hn-${id}`,
      kind: 'hard_negative',
      text,
      expect: [],
      note
    })
  }
  const inEmail = `${'9' + randomDigits(random, 7)}@example.com`
  cases.push({
    id: 'phone-hn-inside-email',
    kind: 'hard_negative',
    text: `Reply to ${inEmail}`,
    expect: [{ entity: 'EMAIL', value: inEmail }],
    note: 'The digits look like a mobile number, but the longer email match wins (SPEC.md §4).'
  })

  // Mixed.
  const a = `+65 8${randomDigits(random, 3)} ${randomDigits(random, 4)}`
  cases.push({
    id: 'phone-mixed',
    kind: 'mixed',
    text: `Mobile ${a}, hotline 1800 123 4567`,
    expect: [phone(a)],
    note: 'Only the mobile number is a personal phone number.'
  })

  return { entity: 'PHONE', cases }
}
