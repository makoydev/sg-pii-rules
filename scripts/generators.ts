import type { FixtureFile } from '../test/helpers.ts'
import { buildCardFixtures } from './fixtures-card.ts'
import { buildEmailFixtures } from './fixtures-email.ts'
import { buildNricFixtures } from './fixtures-nric.ts'
import { buildNricLikeFixtures } from './fixtures-nric-like.ts'
import { buildPhoneFixtures } from './fixtures-phone.ts'
import { buildPostalFixtures } from './fixtures-postal.ts'
import { buildUnitFixtures } from './fixtures-unit.ts'

/** Fixture file name → generator. */
export const generators: Record<string, () => FixtureFile> = {
  'nric.json': buildNricFixtures,
  'nric-like.json': buildNricLikeFixtures,
  'phone.json': buildPhoneFixtures,
  'email.json': buildEmailFixtures,
  'card.json': buildCardFixtures,
  'postal.json': buildPostalFixtures,
  'unit.json': buildUnitFixtures
}
