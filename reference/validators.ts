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

/**
 * Registry of named validators. Algorithms are specified in VALIDATORS.md;
 * each detector that names a validator must find it here (SPEC.md §3).
 */
export const validators: Record<string, Validator> = {
  sg_nric_fin_checksum: isValidNricFin,
  sg_nric_fin_checksum_invalid: hasNricFinShapeButInvalidChecksum
}
