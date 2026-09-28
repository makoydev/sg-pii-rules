import type { FixtureCase, FixtureFile } from '../test/helpers.ts'
import { randomDigits, seededRandom } from './random.ts'
import {
  PREFIXES,
  TEMPLATES,
  nonShapeNegatives,
  nric,
  nricLike,
  valid,
  wrongChecksumLookAlikes,
  wrongLetter
} from './nric-shared.ts'

export function buildNricFixtures(): FixtureFile {
  const random = seededRandom(20260928)
  const cases: FixtureCase[] = []

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
        expect: [nric(value)]
      })
    }
  }
  const lower = valid('T', randomDigits(random, 7)).toLowerCase()
  cases.push({
    id: 'nric-tp-lowercase',
    kind: 'true_positive',
    text: `nric=${lower}`,
    expect: [nric(lower)],
    note: 'Lower case is still an NRIC; the value is reported as written.'
  })

  // Hard negatives for NRIC: wrong check letters, reported as NRIC_LIKE.
  let n = 0
  for (const prefix of PREFIXES) {
    for (let i = 0; i < 2; i++) {
      n++
      const value = wrongLetter(prefix, randomDigits(random, 7))
      cases.push({
        id: `nric-hn-wrong-letter-${String(n).padStart(2, '0')}`,
        kind: 'hard_negative',
        text: `Order reference ${value} dispatched`,
        expect: [nricLike(value)],
        note: 'NRIC-shaped reference with an invalid check letter: NRIC_LIKE, not NRIC.'
      })
    }
  }
  for (const [id, text, value, note] of wrongChecksumLookAlikes()) {
    cases.push({
      id: `nric-hn-${id}`,
      kind: 'hard_negative',
      text,
      expect: [nricLike(value)],
      note
    })
  }
  cases.push(...nonShapeNegatives('nric'))

  // Mixed: several candidates in one text.
  const a = valid('S', randomDigits(random, 7))
  const b = valid('G', randomDigits(random, 7))
  const c = wrongLetter('T', randomDigits(random, 7))
  cases.push(
    {
      id: 'nric-mixed-two-valid',
      kind: 'mixed',
      text: `Transfer from ${a} to ${b} approved`,
      expect: [nric(a), nric(b)]
    },
    {
      id: 'nric-mixed-one-invalid',
      kind: 'mixed',
      text: `Primary ${a}, secondary ${c}`,
      expect: [nric(a), nricLike(c)],
      note: 'The second number has an invalid check letter.'
    }
  )

  return { entity: 'NRIC', cases }
}
