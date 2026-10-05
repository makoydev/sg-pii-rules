import type { FixtureCase, FixtureFile } from '../test/helpers.ts'
import { seededRandom } from './random.ts'

// Synthetic. Dates are random days between 1940 and 2010; none is anyone's
// date of birth on purpose, though any date is someone's by chance.

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]
const pad = (n: number) => String(n).padStart(2, '0')

// [name, format(day, month, year)]
const FORMATS: [string, (d: number, m: number, y: number) => string][] = [
  ['dd/mm/yyyy', (d, m, y) => `${pad(d)}/${pad(m)}/${y}`],
  ['d/m/yyyy', (d, m, y) => `${d}/${m}/${y}`],
  ['dd-mm-yyyy', (d, m, y) => `${pad(d)}-${pad(m)}-${y}`],
  ['dd.mm.yyyy', (d, m, y) => `${pad(d)}.${pad(m)}.${y}`],
  ['yyyy-mm-dd', (d, m, y) => `${y}-${pad(m)}-${pad(d)}`],
  ['d Mon yyyy', (d, m, y) => `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`],
  ['d Month yyyy', (d, m, y) => `${d} ${MONTHS[m - 1]} ${y}`],
  ['Month d, yyyy', (d, m, y) => `${MONTHS[m - 1]} ${d}, ${y}`]
]

const TEMPLATES = [
  (v: string) => `DOB: ${v}`,
  (v: string) => `D.O.B. ${v}`,
  (v: string) => `Date of birth: ${v}`,
  (v: string) => `date_of_birth: "${v}"`,
  (v: string) => `{"dateOfBirth":"${v}"}`,
  (v: string) => `dob=${v}`,
  (v: string) => `Birth date ${v}`,
  (v: string) => `birthDate: '${v}'`,
  (v: string) => `Born on ${v}`,
  (v: string) => `Patient born ${v} in Singapore`,
  (v: string) => `Born: ${v}`,
  (v: string) => `DATE OF BIRTH ${v}`
]

const dob = (value: string) => ({ entity: 'DOB', value })

export function buildDobFixtures(): FixtureFile {
  const random = seededRandom(20261008)
  const date = () => {
    const y = 1940 + Math.floor(random() * 71)
    const m = 1 + Math.floor(random() * 12)
    return [1 + Math.floor(random() * 28), m, y] as const
  }
  const cases: FixtureCase[] = []

  for (let t = 0; t < 23; t++) {
    const [name, format] = FORMATS[t % FORMATS.length]
    const value = format(...date())
    cases.push({
      id: `dob-tp-${String(t + 1).padStart(3, '0')}`,
      kind: 'true_positive',
      text: TEMPLATES[t % TEMPLATES.length](value),
      expect: [dob(value)],
      note: name
    })
  }
  const [, m, y] = date()
  const us = `${pad(m)}/${pad(13 + Math.floor(random() * 15))}/${y}`
  cases.push({
    id: 'dob-tp-month-first',
    kind: 'true_positive',
    text: `DOB: ${us}`,
    expect: [dob(us)],
    note: 'Only valid month first (US style), which is accepted too.'
  })

  const negatives: [
    string,
    string,
    string,
    { entity: string; value: string }[]?
  ][] = [
    ['no-clue-release', 'Released 12/03/1988', 'A date with no birth clue.'],
    ['no-clue-updated', 'Updated: 2026-10-05', 'A date with no birth clue.'],
    [
      'no-clue-meeting',
      'Meeting on 12 March 1988',
      'A date with no birth clue.'
    ],
    [
      'clue-far-away',
      'DOB field added on 12/03/2024',
      'Words between the clue and the date.'
    ],
    [
      'born-again',
      'born-again 2020-01-01',
      'A hyphen joins "born" to another word.'
    ],
    [
      'doberman',
      'Doberman 12/03/1988',
      '"Dob" at the start of a longer word is not the clue.'
    ],
    ['feb-31', 'DOB: 31/02/1990', 'February has no 31st, either way round.'],
    ['not-a-leap-year', 'DOB: 29/02/1990', '1990 is not a leap year.'],
    ['month-13', 'DOB: 13/13/1990', 'Neither part is a month.'],
    ['day-zero', 'DOB: 00/05/1990', 'There is no day 0 or month 0.'],
    ['iso-feb-30', 'dob=1990-02-30', 'February has no 30th.'],
    ['april-31', 'DOB: 31 April 1990', 'April has 30 days.'],
    ['year-1899', 'DOB: 01/01/1899', 'Years before 1900 are out of range.'],
    ['year-2150', 'DOB: 01/01/2150', 'Years after 2099 are out of range.'],
    ['year-only', 'Born in 1988', 'A year alone is not a full date of birth.'],
    ['redacted', 'DOB: [redacted]', 'No date.'],
    [
      'code',
      'if (isValidDob(value)) save()',
      'Code that mentions dates of birth.'
    ],
    ['time', 'DOB: 12:30', 'A time, not a date.'],
    ['weekday', 'DOB: Monday', 'A day name, not a date.'],
    [
      'nric',
      'Date of birth: S1234567D',
      'An NRIC after the clue (synthetic example), reported as NRIC.',
      [{ entity: 'NRIC', value: 'S1234567D' }]
    ],
    [
      'phone',
      'DOB: 9123 4567',
      'A phone number after the clue, reported as PHONE.',
      [{ entity: 'PHONE', value: '9123 4567' }]
    ]
  ]
  for (const [id, text, note, expect] of negatives) {
    cases.push({
      id: `dob-hn-${id}`,
      kind: 'hard_negative',
      text,
      expect: expect ?? [],
      note
    })
  }

  const born = FORMATS[0][1](...date())
  cases.push({
    id: 'dob-mixed',
    kind: 'mixed',
    text: `DOB: ${born}, joined 01/06/2020`,
    expect: [dob(born)],
    note: 'Only the date after the clue is a date of birth.'
  })

  return { entity: 'DOB', cases }
}
