import assert from 'node:assert/strict'
import { test } from 'node:test'
import { generators } from '../scripts/generators.ts'
import { readJson } from './helpers.ts'

// The committed fixtures must be exactly what the generators produce, so a
// hand edit to a fixture file cannot slip through review.
for (const [name, build] of Object.entries(generators)) {
  test(`fixtures/${name} is up to date (run: npm run generate)`, () => {
    const committed = readJson<Record<string, unknown>>(`fixtures/${name}`)
    delete committed.$schema
    assert.deepEqual(committed, JSON.parse(JSON.stringify(build())))
  })
}
