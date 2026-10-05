import type { FixtureCase, FixtureFile } from '../test/helpers.ts'
import { randomDigits, seededRandom } from './random.ts'

// Synthetic. Postal codes are a valid sector plus random digits, so one may
// coincide with a real address by chance; street names are public places.
// No case contains a unit number, so later detectors can't change these.

// Sectors 01 to 82, except 74 (VALIDATORS.md).
const SECTORS = Array.from({ length: 82 }, (_, i) => i + 1)
  .filter((n) => n !== 74)
  .map((n) => String(n).padStart(2, '0'))

const TEMPLATES = [
  (v: string) => `Blk 123 Ang Mo Kio Avenue 3, Singapore ${v}`,
  (v: string) => `10 Anson Road, SINGAPORE ${v}`,
  (v: string) => `Address: Paya Lebar Road, Singapore, ${v}`,
  (v: string) => `Ship to Tampines Street 81, Singapore  ${v}`,
  (v: string) => `Bedok North Avenue 1 S(${v})`,
  (v: string) => `Jurong West Street 52 S${v}`,
  (v: string) => `Postal code: ${v}`,
  (v: string) => `postal_code: "${v}"`,
  (v: string) => `{"postalCode":"${v}"}`,
  (v: string) => `postcode=${v}`,
  (v: string) => `Zip: ${v}`,
  (v: string) => `Postal Code ${v}`
]

const postal = (value: string) => ({ entity: 'POSTAL', value })

export function buildPostalFixtures(): FixtureFile {
  const random = seededRandom(20261006)
  const code = () =>
    SECTORS[Math.floor(random() * SECTORS.length)] + randomDigits(random, 4)
  const cases: FixtureCase[] = []

  // True positives: every clue form, twice.
  let t = 0
  for (let round = 0; round < 2; round++) {
    for (const template of TEMPLATES) {
      const value = code()
      t++
      cases.push({
        id: `postal-tp-${String(t).padStart(3, '0')}`,
        kind: 'true_positive',
        text: template(value),
        expect: [postal(value)]
      })
    }
  }

  // Hard negatives: six digits without a clue, an invalid sector, or a
  // clue next to something that isn't a postal code.
  const negatives: [
    string,
    string,
    string,
    { entity: string; value: string }[]?
  ][] = [
    [
      'sector-00',
      `Singapore 00${randomDigits(random, 4)}`,
      'Sector 00 does not exist.'
    ],
    [
      'sector-74',
      `Singapore 74${randomDigits(random, 4)}`,
      'Sector 74 is not used.'
    ],
    [
      'sector-83',
      `Singapore 83${randomDigits(random, 4)}`,
      'Sectors stop at 82.'
    ],
    [
      'sector-99',
      `Postal code: 99${randomDigits(random, 4)}`,
      'Sectors stop at 82.'
    ],
    ['no-clue-order', `Order ${code()}`, 'Six digits with no address clue.'],
    ['no-clue-amount', `Amount: ${code()}`, 'Six digits with no address clue.'],
    ['no-clue-code', `const timeoutMs = ${code()}`, 'A numeric constant.'],
    ['seven-digits', `Singapore ${code()}7`, 'Seven digits.'],
    ['five-digits', 'Singapore 52012', 'Five digits.'],
    [
      'eight-digits',
      'Singapore 52012345',
      'Eight digits, and not a phone number (leading 5).'
    ],
    [
      'glued-to-word',
      `Singapore${code()}`,
      'No space or comma after "Singapore".'
    ],
    ['year', 'Singapore 2026 budget', 'A year after the clue.'],
    [
      'phone',
      'Singapore 6123 4567',
      'A phone number after the clue, reported as PHONE.',
      [{ entity: 'PHONE', value: '6123 4567' }]
    ],
    [
      'phone-country-code',
      'Singapore +65 9123 4567',
      'A phone number with country code.',
      [{ entity: 'PHONE', value: '+65 9123 4567' }]
    ],
    [
      'nric-like',
      'Ref S520123A',
      'S, six digits and a letter: neither a postal code nor an NRIC.'
    ],
    [
      'nric',
      'Member S1234567D',
      'An NRIC (synthetic example from VALIDATORS.md): S then seven digits.',
      [{ entity: 'NRIC', value: 'S1234567D' }]
    ],
    ['zipped', `zipped ${code()} bytes`, '"zipped" is not the zip clue.'],
    ['blog-post', `Blog post ${code()}`, '"post" alone is not a clue.'],
    [
      'malaysia',
      'Kuala Lumpur 50088, Malaysia',
      'A five-digit Malaysian postcode.'
    ],
    ['us-zip', 'ZIP 94043-1351', 'A US ZIP+4 code.'],
    [
      'lowercase-s',
      `s(${code()})`,
      'Lowercase s( is a function call, not the S( address clue.'
    ]
  ]
  for (const [id, text, note, expect] of negatives) {
    cases.push({
      id: `postal-hn-${id}`,
      kind: 'hard_negative',
      text,
      expect: expect ?? [],
      note
    })
  }

  const a = code()
  cases.push({
    id: 'postal-mixed',
    kind: 'mixed',
    text: `Deliver to Singapore ${a}, order ${code()}`,
    expect: [postal(a)],
    note: 'Only the digits after the clue are a postal code.'
  })

  return { entity: 'POSTAL', cases }
}
