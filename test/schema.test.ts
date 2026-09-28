import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { Ajv } from 'ajv'
import { RE2JS } from 're2js'
import type { DetectorsFile } from '../reference/types.ts'
import { validators } from '../reference/validators.ts'
import { fixtureFiles, readJson } from './helpers.ts'

const MIN_CASES_PER_KIND = 20

const ajv = new Ajv({ allErrors: true })
const detectors = readJson<DetectorsFile>('detectors.json')

describe('detectors.json', () => {
  test('matches its schema', () => {
    const validate = ajv.compile(readJson('schema/detectors.schema.json'))
    assert.ok(validate(detectors), ajv.errorsText(validate.errors))
  })

  test('has unique detector ids', () => {
    const ids = detectors.detectors.map((d) => d.id)
    assert.equal(new Set(ids).size, ids.length)
  })

  for (const detector of detectors.detectors) {
    test(`${detector.id}: pattern compiles as RE2`, () => {
      assert.doesNotThrow(() => RE2JS.compile(detector.pattern))
    })

    if (detector.validator !== undefined) {
      test(`${detector.id}: validator ${detector.validator} exists`, () => {
        assert.ok(detector.validator! in validators)
      })
    }

    test(`${detector.id}: has at least ${MIN_CASES_PER_KIND} true positives and hard negatives`, () => {
      const cases = fixtureFiles()
        .filter(({ file }) => file.entity === detector.entity)
        .flatMap(({ file }) => file.cases)
      const positives = cases.filter((c) => c.kind === 'true_positive').length
      const negatives = cases.filter((c) => c.kind === 'hard_negative').length
      assert.ok(positives >= MIN_CASES_PER_KIND, `${positives} true positives`)
      assert.ok(negatives >= MIN_CASES_PER_KIND, `${negatives} hard negatives`)
    })
  }
})

describe('fixtures', () => {
  const validate = ajv.compile(readJson('schema/fixtures.schema.json'))

  for (const { name, file } of fixtureFiles()) {
    test(`${name} matches its schema`, () => {
      assert.ok(validate(file), ajv.errorsText(validate.errors))
    })

    test(`${name} has unique case ids`, () => {
      const ids = file.cases.map((c) => c.id)
      assert.equal(new Set(ids).size, ids.length)
    })

    test(`${name} kinds agree with expectations`, () => {
      for (const c of file.cases) {
        if (c.kind === 'hard_negative') assert.equal(c.expect.length, 0, c.id)
        if (c.kind === 'true_positive') assert.ok(c.expect.length > 0, c.id)
      }
    })
  }
})
