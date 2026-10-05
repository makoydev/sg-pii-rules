import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  hasCardNetworkPrefix,
  hasNricFinShapeButInvalidChecksum,
  isCalendarDate,
  isPaymentCard,
  isPlausibleDate,
  isSingaporePostalCode,
  passesLuhn,
  isValidNricFin,
  nricCheckLetter
} from '../reference/validators.ts'

describe('sg_nric_fin_checksum', () => {
  // Test vectors computed from the algorithm in VALIDATORS.md using
  // patterned digits. They illustrate the arithmetic; they are not taken
  // from any person.
  const vectors = [
    'S0000000J',
    'S1234567D',
    'S9999999C',
    'T0000000G',
    'T1234567J',
    'T9999999Z',
    'F0000000X',
    'F1234567N',
    'F9999999M',
    'G0000000R',
    'G1234567X',
    'G9999999W',
    'M0000000T',
    'M1234567K',
    'M9999999X'
  ]

  for (const value of vectors) {
    test(`accepts ${value}`, () => assert.ok(isValidNricFin(value)))
  }

  test('accepts lower case', () => {
    assert.ok(isValidNricFin('s1234567d'))
  })

  test('rejects every other check letter', () => {
    for (const value of vectors) {
      for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
        if (letter === value[8]) continue
        assert.equal(
          isValidNricFin(value.slice(0, 8) + letter),
          false,
          value.slice(0, 8) + letter
        )
      }
    }
  })

  test('rejects the published illustrative examples, which fail the checksum', () => {
    assert.equal(isValidNricFin('M1234567B'), false) // ICA media release, 12 Jul 2021
    assert.equal(isValidNricFin('S1234567A'), false) // PDPC NRIC guidelines
  })

  test('rejects wrong shapes', () => {
    for (const value of [
      'A1234567D',
      'S123456D',
      'S12345678D',
      'S1234567',
      '1234567D'
    ]) {
      assert.equal(isValidNricFin(value), false, value)
    }
  })

  test('M series differs from F/G only when the remainder is 8', () => {
    // FormSG writes the M rule as "KLJNPQRTUWX"[10 - r]; this file indexes
    // "XWUTRQPNJLK" by r. Check that the two forms agree for every r.
    for (let r = 0; r <= 10; r++) {
      assert.equal('XWUTRQPNJLK'[r], 'KLJNPQRTUWX'[10 - r])
      assert.equal('XWUTRQPNJLK'[r] === 'XWUTRQPNMLK'[r], r !== 8)
    }
  })

  test('remainder 8 is where the M and F/G tables differ', () => {
    // Sum of weights × digits plus offset is 11 × k + 8 for both values.
    assert.ok(isValidNricFin('M0000008J'))
    assert.equal(isValidNricFin('M0000008M'), false)
    assert.ok(isValidNricFin('F0000004M'))
    assert.equal(isValidNricFin('F0000004J'), false)
  })

  test('computes the check letter directly', () => {
    assert.equal(nricCheckLetter('S', '1234567'), 'D')
    assert.equal(nricCheckLetter('M', '1234567'), 'K')
  })
})

describe('sg_nric_fin_checksum_invalid', () => {
  test('accepts the NRIC shape with a wrong check letter', () => {
    assert.ok(hasNricFinShapeButInvalidChecksum('S1234567A'))
    assert.ok(hasNricFinShapeButInvalidChecksum('m1234567b'))
  })

  test('rejects valid NRICs, which belong to sg_nric_fin_checksum', () => {
    assert.equal(hasNricFinShapeButInvalidChecksum('S1234567D'), false)
    assert.equal(hasNricFinShapeButInvalidChecksum('M0000008J'), false)
  })

  test('rejects anything without the NRIC shape', () => {
    for (const value of ['A1234567D', 'S123456D', 'S12345678D', 'S1234567']) {
      assert.equal(hasNricFinShapeButInvalidChecksum(value), false, value)
    }
  })
})

describe('payment_card_luhn_iin', () => {
  // Published test numbers and the textbook Luhn example: not issued cards.
  test('Luhn accepts known-valid numbers and rejects a changed digit', () => {
    assert.equal(passesLuhn('79927398713'), true)
    assert.equal(passesLuhn('4111111111111111'), true)
    assert.equal(passesLuhn('4111111111111112'), false)
    assert.equal(passesLuhn('378282246310005'), true)
  })

  test('network prefixes and lengths', () => {
    assert.equal(hasCardNetworkPrefix('4111111111111111'), true) // Visa 16
    assert.equal(hasCardNetworkPrefix('411111111111111'), false) // Visa 15
    assert.equal(hasCardNetworkPrefix('2221000000000009'), true) // Mastercard 2-series, low end
    assert.equal(hasCardNetworkPrefix('2721000000000004'), false) // just above it
    assert.equal(hasCardNetworkPrefix('378282246310005'), true) // Amex 15
    assert.equal(hasCardNetworkPrefix('3782822463100050'), false) // Amex 16
    assert.equal(hasCardNetworkPrefix('9111111111111111'), false) // no network
  })

  test('accepts separators and rejects other shapes', () => {
    assert.equal(isPaymentCard('4111 1111 1111 1111'), true)
    assert.equal(isPaymentCard('4111-1111-1111-1111'), true)
    assert.equal(isPaymentCard('4111.1111.1111.1111'), false)
    assert.equal(isPaymentCard('411111111111'), false)
  })
})

describe('sg_postal_sector', () => {
  test('accepts sectors 01 to 82 except 74', () => {
    for (const ok of ['010000', '730001', '750001', '829999'])
      assert.equal(isSingaporePostalCode(ok), true, ok)
    for (const bad of [
      '000123',
      '740123',
      '830000',
      '990000',
      '52012',
      '5201234'
    ])
      assert.equal(isSingaporePostalCode(bad), false, bad)
  })
})

describe('calendar_date', () => {
  test('knows month lengths and leap years', () => {
    assert.equal(isCalendarDate(1992, 2, 29), true)
    assert.equal(isCalendarDate(1990, 2, 29), false)
    assert.equal(isCalendarDate(2000, 2, 29), true) // divisible by 400
    assert.equal(isCalendarDate(1900, 2, 29), false) // divisible by 100
    assert.equal(isCalendarDate(1990, 4, 31), false)
    assert.equal(isCalendarDate(1990, 13, 1), false)
  })

  test('accepts every supported format, day or month first', () => {
    for (const ok of [
      '12/03/1988',
      '3/7/1988',
      '12-03-1988',
      '12.03.1988',
      '03/31/1988',
      '1988-03-12',
      '12 Mar 1988',
      '12 March 1988',
      '12 Sept. 1988',
      'March 12, 1988',
      'mar 12 1988'
    ])
      assert.equal(isPlausibleDate(ok), true, ok)
    for (const bad of [
      '31/02/1990',
      '13/13/1990',
      '00/05/1990',
      '1990-02-30',
      '31 April 1990',
      '12 Foo 1988',
      '12/03/88'
    ])
      assert.equal(isPlausibleDate(bad), false, bad)
  })
})
