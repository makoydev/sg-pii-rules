import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export const root = join(import.meta.dirname, '..')

export interface FixtureCase {
  id: string
  kind: 'true_positive' | 'hard_negative' | 'mixed'
  text: string
  expect: { entity: string; value: string }[]
  note?: string
}

export interface FixtureFile {
  entity: string
  cases: FixtureCase[]
}

export function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(join(root, relativePath), 'utf8')) as T
}

export function fixtureFiles(): { name: string; file: FixtureFile }[] {
  return readdirSync(join(root, 'fixtures'))
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => ({ name, file: readJson<FixtureFile>(`fixtures/${name}`) }))
}
