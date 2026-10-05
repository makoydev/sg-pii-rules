import type { Validator } from './types.ts'

// NRIC/FIN check letter. See VALIDATORS.md for the algorithm and its sources.
const NRIC_WEIGHTS = [2, 7, 6, 5, 4, 3, 2]
const NRIC_OFFSETS: Record<string, number> = { S: 0, T: 4, F: 0, G: 4, M: 3 }
const NRIC_CHECK_LETTERS: Record<string, string> = {
  S: 'JZIHGFEDCBA',
  T: 'JZIHGFEDCBA',
  F: 'XWUTRQPNMLK',
  G: 'XWUTRQPNMLK',
  M: 'XWUTRQPNJLK'
}

/** Returns the expected check letter for a prefix and seven digits. */
export function nricCheckLetter(prefix: string, digits: string): string {
  const sum = NRIC_WEIGHTS.reduce(
    (total, weight, i) => total + weight * Number(digits[i]),
    NRIC_OFFSETS[prefix]
  )
  return NRIC_CHECK_LETTERS[prefix][sum % 11]
}

export function isValidNricFin(value: string): boolean {
  const match = /^([STFGM])(\d{7})([A-Z])$/.exec(value.toUpperCase())
  if (match === null) return false
  const [, prefix, digits, letter] = match
  return nricCheckLetter(prefix, digits) === letter
}

/**
 * NRIC/FIN shape with a wrong check letter: a mistyped NRIC, or a
 * look-alike such as an order number. See ADR 0006.
 */
export function hasNricFinShapeButInvalidChecksum(value: string): boolean {
  return (
    /^[STFGM]\d{7}[A-Z]$/.test(value.toUpperCase()) && !isValidNricFin(value)
  )
}

/** Luhn (mod 10) checksum over a string of digits. See VALIDATORS.md. */
export function passesLuhn(digits: string): boolean {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  return sum % 10 === 0
}

// Card network prefixes (IIN ranges) and the lengths each network issues.
// Ranges compare the number's leading digits; see VALIDATORS.md for sources.
const CARD_NETWORKS: { prefixes: [string, string][]; lengths: number[] }[] = [
  { prefixes: [['4', '4']], lengths: [13, 16, 19] }, // Visa
  {
    prefixes: [
      ['51', '55'],
      ['2221', '2720']
    ],
    lengths: [16]
  }, // Mastercard
  {
    prefixes: [
      ['34', '34'],
      ['37', '37']
    ],
    lengths: [15]
  }, // American Express
  {
    prefixes: [
      ['6011', '6011'],
      ['644', '649'],
      ['65', '65'],
      ['622126', '622925']
    ],
    lengths: [16, 17, 18, 19]
  }, // Discover
  { prefixes: [['3528', '3589']], lengths: [16, 17, 18, 19] }, // JCB
  { prefixes: [['62', '62']], lengths: [16, 17, 18, 19] }, // UnionPay
  {
    prefixes: [
      ['30', '30'],
      ['36', '36'],
      ['38', '39']
    ],
    lengths: [14, 15, 16, 17, 18, 19]
  } // Diners Club International
]

/** True if the digits start with a known network prefix at a valid length. */
export function hasCardNetworkPrefix(digits: string): boolean {
  return CARD_NETWORKS.some(
    ({ prefixes, lengths }) =>
      lengths.includes(digits.length) &&
      prefixes.some(([low, high]) => {
        const lead = digits.slice(0, low.length)
        return lead >= low && lead <= high
      })
  )
}

/**
 * Payment card number: separators removed, it must pass the Luhn checksum
 * and start with a card network's prefix at a length that network issues.
 */
export function isPaymentCard(value: string): boolean {
  const digits = value.replace(/[ -]/g, '')
  return (
    /^\d{13,19}$/.test(digits) &&
    passesLuhn(digits) &&
    hasCardNetworkPrefix(digits)
  )
}

/**
 * Singapore postal code: six digits whose first two (the postal sector) are
 * 01 to 82, except 74, which is not used. See VALIDATORS.md.
 */
export function isSingaporePostalCode(value: string): boolean {
  if (!/^\d{6}$/.test(value)) return false
  const sector = Number(value.slice(0, 2))
  return sector >= 1 && sector <= 82 && sector !== 74
}

const MONTHS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec'
]

/** True if day/month/year is a real calendar date (leap years included). */
export function isCalendarDate(
  year: number,
  month: number,
  day: number
): boolean {
  if (month < 1 || month > 12 || day < 1) return false
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return day <= days[month - 1]
}

/**
 * A date written as 12/03/1988 (day or month first), 12-03-1988, 12.03.1988,
 * 1988-03-12, 12 Mar 1988 or March 12, 1988 that exists in the calendar.
 * Deliberately does not compare with today, so results never change with
 * the date the code runs (VALIDATORS.md).
 */
export function isPlausibleDate(value: string): boolean {
  let m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(value)
  if (m) {
    const [a, b, y] = [Number(m[1]), Number(m[2]), Number(m[3])]
    return isCalendarDate(y, b, a) || isCalendarDate(y, a, b)
  }
  m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value)
  if (m) return isCalendarDate(Number(m[1]), Number(m[2]), Number(m[3]))
  m = /^(\d{1,2}) ([a-z]+)\.?,? (\d{4})$/i.exec(value)
  if (m)
    return isCalendarDate(
      Number(m[3]),
      MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()) + 1,
      Number(m[1])
    )
  m = /^([a-z]+)\.? (\d{1,2}),? (\d{4})$/i.exec(value)
  if (m)
    return isCalendarDate(
      Number(m[3]),
      MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()) + 1,
      Number(m[2])
    )
  return false
}

/**
 * Registry of named validators. Algorithms are specified in VALIDATORS.md;
 * each detector that names a validator must find it here (SPEC.md §3).
 */
export const validators: Record<string, Validator> = {
  sg_nric_fin_checksum: isValidNricFin,
  sg_nric_fin_checksum_invalid: hasNricFinShapeButInvalidChecksum,
  payment_card_luhn_iin: isPaymentCard,
  sg_postal_sector: isSingaporePostalCode,
  calendar_date: isPlausibleDate
}
