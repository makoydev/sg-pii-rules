import type { FixtureCase, FixtureFile } from '../test/helpers.ts'
import { randomDigits, seededRandom } from './random.ts'

// Synthetic. Every domain is reserved for documentation or testing
// (RFC 2606: example.com, example.org, example.net, and the .test TLD).

const SYLLABLES = [
  'an',
  'bo',
  'ce',
  'di',
  'en',
  'fu',
  'ga',
  'hi',
  'jo',
  'ka',
  'li',
  'mu',
  'na',
  'or',
  'pe',
  'ri',
  'su',
  'ta',
  'wu',
  'ye'
]
const DOMAINS = [
  'example.com',
  'example.org',
  'example.net',
  'mail.example.com',
  'dept.example.org',
  'sub-team.example.net',
  'clinic.test'
]

const SHAPES = [
  (a: string, b: string, n: string) => `${a}.${b}`,
  (a: string, b: string, n: string) => `${a}${b}${n}`,
  (a: string, b: string, n: string) => `${a}_${b}`,
  (a: string, b: string, n: string) => `${a}+${b}`,
  (a: string, b: string, n: string) => `${a}-${b}.${n}`,
  (a: string, b: string, n: string) => `${a.toUpperCase()}.${b}`
]

const TEMPLATES = [
  (v: string) => `Contact: ${v}.`,
  (v: string) => `{"email": "${v}"}`,
  (v: string) => `row,email\n1,${v}`,
  (v: string) => `<a href="mailto:${v}">email us</a>`,
  (v: string) => `From: Support <${v}>`,
  (v: string) => `const adminEmail = '${v}'`,
  (v: string) => `Please cc ${v}, thanks`
]

const email = (value: string) => ({ entity: 'EMAIL', value })

export function buildEmailFixtures(): FixtureFile {
  const random = seededRandom(20261001)
  const pick = <T>(items: T[]) => items[Math.floor(random() * items.length)]
  const word = () => pick(SYLLABLES) + pick(SYLLABLES)
  const cases: FixtureCase[] = []

  // True positives: varied local parts and reserved domains.
  for (let t = 1; t <= 21; t++) {
    const local = SHAPES[t % SHAPES.length](
      word(),
      word(),
      randomDigits(random, 2)
    )
    const value = `${local}@${DOMAINS[t % DOMAINS.length]}`
    cases.push({
      id: `email-tp-${String(t).padStart(3, '0')}`,
      kind: 'true_positive',
      text: TEMPLATES[t % TEMPLATES.length](value),
      expect: [email(value)]
    })
  }

  // Hard negatives: @ signs that are not email addresses.
  const negatives: [string, string, string][] = [
    ['npm-version', 'npm install left-pad@1.3.0', 'Package and version.'],
    [
      'npm-scoped',
      'import from @scope/pkg@2.1.0',
      'Scoped package and version.'
    ],
    ['npm-range', '"react@^18.2.0"', 'Version range.'],
    ['no-tld', 'ssh admin@localhost', 'No top-level domain.'],
    ['bare-host', 'user@intranet', 'No top-level domain.'],
    ['one-letter-tld', 'a@b.c', 'Top-level domain of one letter.'],
    [
      'ip-domain',
      'x@192.0.2.10',
      'Domain is an IP address (a documentation range, RFC 5737).'
    ],
    ['double-at', 'user@@example.com', 'Empty local part.'],
    ['mention', 'Thanks @reviewer for the catch', 'A mention.'],
    ['decorator', '@Component({ selector: "app" })', 'A decorator.'],
    ['css-at-rule', '@media screen and (max-width: 600px)', 'A CSS at-rule.'],
    ['at-symbol-price', 'Buy 3@$2.00 each', 'Price notation.'],
    ['trailing-at', 'Sent to team@', 'Nothing after the @.'],
    ['leading-at', '@example.com', 'Nothing before the @.'],
    [
      'space-inside',
      'jo an@example.com',
      'The space splits it; only the part after it is an address.'
    ],
    ['numeric-tld', 'build@host.123', 'Numeric top-level domain.'],
    ['obfuscated', 'jo [at] example [dot] com', 'Obfuscated address.'],
    ['version-tag', 'git tag v1.2@rc', 'Not an address.'],
    ['docker-digest', 'image@sha256:abc123', 'Container digest.'],
    [
      'at-in-path',
      'https://registry.example.com/@types/node',
      'A path segment.'
    ],
    [
      'underscore-domain',
      'x@exa_mple.com',
      'Underscores are not allowed in host names.'
    ]
  ]
  for (const [id, text, note] of negatives) {
    const expect = id === 'space-inside' ? [email('an@example.com')] : []
    cases.push({
      id: `email-hn-${id}`,
      kind: id === 'space-inside' ? 'mixed' : 'hard_negative',
      text,
      expect,
      note
    })
  }

  // Mixed: address next to things that are not addresses.
  const a = `${word()}.${word()}@example.org`
  cases.push({
    id: 'email-mixed',
    kind: 'mixed',
    text: `Owner ${a}; deps: lodash@4.17.21`,
    expect: [email(a)]
  })
  const phoneLocal = `8${randomDigits(random, 7)}@example.net`
  cases.push({
    id: 'email-tp-numeric-local',
    kind: 'true_positive',
    text: `SMS gateway ${phoneLocal}`,
    expect: [email(phoneLocal)],
    note: 'Reported once, as EMAIL, although the local part looks like a phone number.'
  })

  return { entity: 'EMAIL', cases }
}
