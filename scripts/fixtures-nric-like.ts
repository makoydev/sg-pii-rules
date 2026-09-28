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

export function buildNricLikeFixtures(): FixtureFile {
  const random = seededRandom(20260929)
  const cases: FixtureCase[] = []

  // True positives: NRIC shape, wrong check letter, four per prefix.
  let t = 0
  for (const prefix of PREFIXES) {
    for (let i = 0; i < 4; i++) {
      const value = wrongLetter(prefix, randomDigits(random, 7))
      const template = TEMPLATES[t % TEMPLATES.length]
      t++
      cases.push({
        id: `nric-like-tp-${String(t).padStart(3, '0')}`,
        kind: 'true_positive',
        text: template(value),
        expect: [nricLike(value)]
      })
    }
  }
  for (const [id, text, value, note] of wrongChecksumLookAlikes()) {
    cases.push({
      id: `nric-like-tp-${id}`,
      kind: 'true_positive',
      text,
      expect: [nricLike(value)],
      note
    })
  }

  // Hard negatives for NRIC_LIKE: valid NRICs (reported as NRIC instead)...
  for (let i = 0; i < 10; i++) {
    const value = valid(PREFIXES[i % PREFIXES.length], randomDigits(random, 7))
    cases.push({
      id: `nric-like-hn-valid-${String(i + 1).padStart(2, '0')}`,
      kind: 'hard_negative',
      text: TEMPLATES[i % TEMPLATES.length](value),
      expect: [nric(value)],
      note: 'A valid NRIC is reported as NRIC, never NRIC_LIKE.'
    })
  }
  // ...and strings without the NRIC shape at all.
  cases.push(...nonShapeNegatives('nric-like'))

  const a = valid('F', randomDigits(random, 7))
  const b = wrongLetter('M', randomDigits(random, 7))
  cases.push({
    id: 'nric-like-mixed',
    kind: 'mixed',
    text: `Holder ${a} and dependant ${b}`,
    expect: [nric(a), nricLike(b)]
  })

  return { entity: 'NRIC_LIKE', cases }
}
