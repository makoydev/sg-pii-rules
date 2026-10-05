import type { FixtureCase, FixtureFile } from '../test/helpers.ts'
import { randomDigits, seededRandom } from './random.ts'

// Synthetic. Unit numbers and postal codes are random; street and building
// names are public places. No case is anyone's address.

const TEMPLATES = [
  (v: string) => `Blk 123 Ang Mo Kio Avenue 3 ${v}`,
  (v: string) => `10 Anson Road ${v}, International Plaza`,
  (v: string) => `Unit: ${v}`,
  (v: string) => `{"unit": "${v}"}`,
  (v: string) => `address_line_2,${v}`,
  (v: string) => `Deliver to ${v} before noon.`,
  (v: string) => `Tampines Mall ${v}`,
  (v: string) => `${v} Paya Lebar Square`
]

const unit = (value: string) => ({ entity: 'UNIT', value })

export function buildUnitFixtures(): FixtureFile {
  const random = seededRandom(20261007)
  const pick = <T>(items: T[]) => items[Math.floor(random() * items.length)]
  const floor = () =>
    random() < 0.15
      ? `B${1 + Math.floor(random() * 4)}`
      : String(1 + Math.floor(random() * 40)).padStart(2, '0')
  const number = () => {
    const digits = randomDigits(random, 2 + Math.floor(random() * 3))
    return `#${floor()}-${digits}${random() < 0.2 ? pick(['A', 'B', 'C']) : ''}`
  }
  const cases: FixtureCase[] = []

  for (let t = 1; t <= 22; t++) {
    const value = number()
    cases.push({
      id: `unit-tp-${String(t).padStart(3, '0')}`,
      kind: 'true_positive',
      text: TEMPLATES[(t - 1) % TEMPLATES.length](value),
      expect: [unit(value)]
    })
  }
  for (const [id, sector] of [
    ['with-postal-1', '46'],
    ['with-postal-2', '56']
  ]) {
    const value = number()
    const postal = sector + randomDigits(random, 4)
    cases.push({
      id: `unit-tp-${id}`,
      kind: 'true_positive',
      text: `Blk 456 Bedok North Street 1 ${value} Singapore ${postal}`,
      expect: [unit(value), { entity: 'POSTAL', value: postal }],
      note: 'A full address: the unit number and the postal code are both reported.'
    })
  }

  const negatives: [
    string,
    string,
    string,
    { entity: string; value: string }[]?
  ][] = [
    ['issue-ref', 'Fixed in #12', 'An issue reference: no hyphen and unit.'],
    ['four-digits', 'See #1234', 'Four digits with no hyphen.'],
    ['one-digit-unit', 'Step #12-3', 'Units have at least two digits.'],
    ['five-digit-unit', 'Ticket #12-34567', 'Units have at most four digits.'],
    ['digit-run', 'Build #12345', 'A run of digits.'],
    ['colour', 'color: #ff0000;', 'A CSS colour.'],
    ['hex-pair', 'Mask #1a-2b', 'Hex digits, not a floor and unit.'],
    ['slash', 'Item #05/123', 'A slash instead of a hyphen.'],
    ['issue-range', 'Closes #12-#15', 'A range of issue numbers.'],
    ['floor-00', 'Room #00-12', 'There is no floor 00.'],
    [
      'single-digit-floor',
      'Room #5-123',
      'Floors are written with two digits.'
    ],
    ['basement-0', 'Level #B0-12', 'Basements are B1 and below.'],
    ['letter-floor', 'Grid #A1-23', 'A is not a basement or a floor.'],
    ['en-dash', 'Range #12–345', 'An en dash, not a hyphen.'],
    ['underscore', 'Key #12_345', 'An underscore, not a hyphen.'],
    ['spaced', 'Score #12 - 345', 'Spaces around the hyphen.'],
    [
      'lowercase-suffix',
      'Tag #12-34ab',
      'Letters after the unit are lowercase and run on.'
    ],
    ['double-hash', 'Heading ## 12-345', 'A Markdown heading.'],
    ['leading-hyphen', 'Offset #-12-345', 'A hyphen before the floor.'],
    ['date', 'Release #2026-10-05', 'A date after a hash.'],
    [
      'phone',
      'Hotline #9123-4567',
      'A phone number after a hash, reported as PHONE.',
      [{ entity: 'PHONE', value: '9123-4567' }]
    ]
  ]
  for (const [id, text, note, expect] of negatives) {
    cases.push({
      id: `unit-hn-${id}`,
      kind: 'hard_negative',
      text,
      expect: expect ?? [],
      note
    })
  }

  const a = number()
  cases.push({
    id: 'unit-mixed',
    kind: 'mixed',
    text: `Unit ${a}, see ticket #1234`,
    expect: [unit(a)],
    note: 'Only the floor-unit number is a unit number.'
  })

  return { entity: 'UNIT', cases }
}
