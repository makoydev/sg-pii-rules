import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  hasNricFinShapeButInvalidChecksum,
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
