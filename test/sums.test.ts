import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { renderSums } from '../scripts/sums.ts'
import { root } from './helpers.ts'

// Consumers verify their vendored copy against SHA256SUMS (ADR 0004), so it
// must always describe the files exactly as committed.
test('SHA256SUMS matches the vendored files (run: npm run sums)', () => {
  assert.equal(readFileSync(join(root, 'SHA256SUMS'), 'utf8'), renderSums())
})
