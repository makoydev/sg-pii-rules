import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { compile, detect, loadDetectorsFile } from '../reference/detect.ts'
import { fixtureFiles, root } from './helpers.ts'
import { join } from 'node:path'

// The conformance suite: every case in fixtures/ must produce exactly its
// expected matches (SPEC.md §5). Other implementations run the same cases.
const detectors = compile(loadDetectorsFile(join(root, 'detectors.json')))

for (const { name, file } of fixtureFiles()) {
  describe(name, () => {
    for (const c of file.cases) {
      test(`${c.id} (${c.kind})`, () => {
        const found = detect(c.text, detectors).map(({ entity, value }) => ({
          entity,
          value
        }))
        assert.deepEqual(found, c.expect)
      })
    }
  })
}
