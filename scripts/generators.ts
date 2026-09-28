import type { FixtureFile } from '../test/helpers.ts'
import { buildNricFixtures } from './fixtures-nric.ts'

/** Fixture file name → generator. */
export const generators: Record<string, () => FixtureFile> = {
  'nric.json': buildNricFixtures
}
