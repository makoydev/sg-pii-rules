import type { FixtureCase, FixtureFile } from '../test/helpers.ts'
import { randomDigits, seededRandom } from './random.ts'

// Synthetic. Each number is a network prefix plus random digits, completed
// with a Luhn check digit. One may coincide with an issued card by chance;
// none is taken from any person or account.

/**
 * Appends the digit that makes the number pass the Luhn check. Written
 * independently of reference/validators.ts, so the two cross-check.
 */
export function withLuhnDigit(partial: string): string {
  let sum = 0
  for (let i = 0; i < partial.length; i++) {
    // Once the check digit is appended, the partial's last digit is second
    // from the right, so it is the first one doubled.
    let d = Number(partial[partial.length - 1 - i])
    if (i % 2 === 0) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  return partial + ((10 - (sum % 10)) % 10)
}

const groupsOf4 = (n: string, sep: string) => n.match(/.{1,4}/g)!.join(sep)
const FORMATS: Record<string, (n: string) => string> = {
  plain: (n) => n,
  spaces: (n) => groupsOf4(n, ' '),
  hyphens: (n) => groupsOf4(n, '-'),
  amex: (n) => `${n.slice(0, 4)} ${n.slice(4, 10)} ${n.slice(10)}`
}

const TEMPLATES = [
  (v: string) => `Card number: ${v}`,
  (v: string) => `{"card": "${v}"}`,
  (v: string) => `order_id,card\n1042,${v}`,
  (v: string) => `Charged to ${v} at checkout.`,
  (v: string) => `const testCard = '${v}'`,
  (v: string) => `PAN=${v}`
]

// [network, prefix, length, format]
const POSITIVES: [string, string, number, string][] = [
  ['visa', '4', 16, 'spaces'],
  ['visa', '4', 16, 'plain'],
  ['visa', '4', 13, 'plain'],
  ['visa', '4', 19, 'plain'],
  ['visa', '4', 16, 'hyphens'],
  ['mastercard', '51', 16, 'spaces'],
  ['mastercard', '55', 16, 'plain'],
  ['mastercard', '2221', 16, 'hyphens'],
  ['mastercard', '2720', 16, 'spaces'],
  ['mastercard', '2500', 16, 'plain'],
  ['amex', '34', 15, 'amex'],
  ['amex', '37', 15, 'plain'],
  ['discover', '6011', 16, 'spaces'],
  ['discover', '65', 16, 'plain'],
  ['discover', '644', 16, 'hyphens'],
  ['discover', '622126', 19, 'plain'],
  ['jcb', '3528', 16, 'spaces'],
  ['jcb', '3589', 19, 'plain'],
  ['unionpay', '62', 16, 'spaces'],
  ['unionpay', '62', 19, 'plain'],
  ['diners', '36', 14, 'plain'],
  ['diners', '30', 14, 'plain'],
  ['diners', '38', 16, 'spaces']
]

const card = (value: string) => ({ entity: 'CARD', value })

export function buildCardFixtures(): FixtureFile {
  const random = seededRandom(20261005)
  const number = (prefix: string, length: number) =>
    withLuhnDigit(prefix + randomDigits(random, length - prefix.length - 1))
  const cases: FixtureCase[] = []

  POSITIVES.forEach(([network, prefix, length, format], i) => {
    const value = FORMATS[format](number(prefix, length))
    cases.push({
      id: `card-tp-${String(i + 1).padStart(3, '0')}`,
      kind: 'true_positive',
      text: TEMPLATES[i % TEMPLATES.length](value),
      expect: [card(value)],
      note: `${network}, ${length} digits, ${format}`
    })
  })
  const withPhoneShape = groupsOf4(
    withLuhnDigit('5500' + '91234567' + randomDigits(random, 3)),
    ' '
  )
  cases.push({
    id: 'card-tp-contains-phone-shape',
    kind: 'true_positive',
    text: `Card on file: ${withPhoneShape}`,
    expect: [card(withPhoneShape)],
    note: 'Two groups look like a phone number (9123 4567); the longer card match wins (SPEC.md §4, ADR 0007).'
  })

  // Hard negatives: card-shaped, but not a card.
  const breakLuhn = (n: string) =>
    n.slice(0, -1) + ((Number(n.at(-1)) + 1) % 10)
  const visa = number('4', 16)
  const negatives: [
    string,
    string,
    string,
    { entity: string; value: string }[]?
  ][] = [
    [
      'luhn-fail-visa',
      `Card: ${breakLuhn(number('4', 16))}`,
      'Visa prefix and length, but the Luhn check fails. Written unspaced: spaced groups can look like a phone number (ADR 0007).'
    ],
    [
      'luhn-fail-mastercard',
      `Card: ${breakLuhn(number('53', 16))}`,
      'Mastercard prefix and length, but the Luhn check fails.'
    ],
    [
      'luhn-fail-amex',
      `Card: ${FORMATS.amex(breakLuhn(number('37', 15)))}`,
      'Amex prefix and length, but the Luhn check fails.'
    ],
    [
      'no-network-1',
      `Reference ${number('1', 16)}`,
      'Passes Luhn, but no card network uses prefix 1.'
    ],
    [
      'no-network-7',
      `Tracking ${number('7', 16)}`,
      'Passes Luhn, but no card network uses prefix 7.'
    ],
    [
      'no-network-8',
      `Batch ${number('80', 16)}`,
      'Passes Luhn, but no card network uses prefix 80.'
    ],
    [
      'no-network-9',
      `Order ${number('9', 16)}`,
      'A Luhn-valid order number; no card network uses prefix 9.'
    ],
    [
      'amex-wrong-length',
      `Card: ${number('34', 16)}`,
      'Amex prefix, but Amex numbers have 15 digits, not 16.'
    ],
    [
      'visa-14-digits',
      `Card: ${number('4', 14)}`,
      'Visa issues 13, 16 or 19 digits, not 14.'
    ],
    [
      'visa-15-digits',
      `Card: ${number('4', 15)}`,
      'Visa issues 13, 16 or 19 digits, not 15.'
    ],
    [
      'mastercard-15-digits',
      `Card: ${number('51', 15)}`,
      'Mastercard numbers have 16 digits.'
    ],
    [
      'twelve-digits',
      `Card: ${number('4', 12)}`,
      'Twelve digits: shorter than any card number here.'
    ],
    [
      'twenty-digits',
      `Card: ${number('4', 20)}`,
      'Twenty digits: longer than any card number.'
    ],
    [
      'double-space',
      `Card: ${visa.slice(0, 4)}  ${groupsOf4(visa.slice(4), ' ')}`,
      'Two separators in a row break the number into pieces too short to be a card.'
    ],
    [
      'dot-separated',
      `Card: ${groupsOf4(number('4', 16), '.')}`,
      'Dots are not card separators.'
    ],
    [
      'inside-word',
      `ID${number('4', 16)}`,
      'No word boundary between the letters and the digits.'
    ],
    [
      'timestamp',
      'Created 1727654321000',
      'A 13-digit millisecond timestamp (prefix 17 is not a card network).'
    ],
    [
      'isbn',
      'ISBN 978-3-16-148410-0',
      'An ISBN-13 with hyphens (prefix 97 is not a card network).'
    ],
    [
      'iban-like',
      'IBAN SG12 0456 7450 1234 5178 90',
      'Bank-account-shaped digits with no card prefix at a valid length.'
    ],
    [
      'masked',
      'Card ending **** **** **** 4242',
      'Only the last four digits, which is not the card number.'
    ],
    ['amount', 'Total 1,234,567,890,123.45', 'An amount with commas.'],
    [
      'phone',
      'Call +65 9123 4567',
      'A phone number, reported as PHONE, not CARD.',
      [{ entity: 'PHONE', value: '+65 9123 4567' }]
    ]
  ]
  for (const [id, text, note, expect] of negatives) {
    cases.push({
      id: `card-hn-${id}`,
      kind: 'hard_negative',
      text,
      expect: expect ?? [],
      note
    })
  }

  const order = number('9', 16)
  const real = FORMATS.spaces(number('4', 16))
  cases.push({
    id: 'card-mixed',
    kind: 'mixed',
    text: `Card ${real}, order ${order}`,
    expect: [card(real)],
    note: 'The order number passes Luhn but has no card prefix.'
  })

  return { entity: 'CARD', cases }
}
