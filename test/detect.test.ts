import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { compile, detect } from '../reference/detect.ts'
import type { DetectorSpec } from '../reference/types.ts'

// Toy detectors that exercise the algorithm in SPEC.md §4, independent of
// the real rules.
function spec(
  id: string,
  entity: string,
  pattern: string,
  validator?: string
): DetectorSpec {
  return { id, entity, description: id, pattern, validator, sources: [] }
}

function run(text: string, specs: DetectorSpec[], validators = {}) {
  return detect(
    text,
    compile({ version: '0.0.0', detectors: specs }, validators)
  ).map(({ entity, value }) => ({ entity, value }))
}

describe('detect', () => {
  test('returns matches in order of position', () => {
    const specs = [spec('b', 'B', 'b+'), spec('a', 'A', 'a+')]
    assert.deepEqual(run('aa bb a', specs), [
      { entity: 'A', value: 'aa' },
      { entity: 'B', value: 'bb' },
      { entity: 'A', value: 'a' }
    ])
  })

  test('drops candidates rejected by the validator', () => {
    const specs = [spec('num', 'NUM', '\\d+', 'even')]
    const even = { even: (v: string) => Number(v) % 2 === 0 }
    assert.deepEqual(run('1 2 3 4', specs, even), [
      { entity: 'NUM', value: '2' },
      { entity: 'NUM', value: '4' }
    ])
  })

  test('keeps the longer of two overlapping matches', () => {
    const specs = [
      spec('digits', 'DIGITS', '\\d{4}'),
      spec('word', 'WORD', '\\w+@\\w+')
    ]
    assert.deepEqual(run('x 1234@host y', specs), [
      { entity: 'WORD', value: '1234@host' }
    ])
  })

  test('breaks equal-length ties by detector order', () => {
    const specs = [
      spec('first', 'FIRST', 'abc'),
      spec('second', 'SECOND', 'abc')
    ]
    assert.deepEqual(run('abc', specs), [{ entity: 'FIRST', value: 'abc' }])
  })

  test('a later, longer candidate replaces the last kept match', () => {
    const specs = [spec('short', 'SHORT', 'ab'), spec('long', 'LONG', 'bcdef')]
    assert.deepEqual(run('abcdef', specs), [{ entity: 'LONG', value: 'bcdef' }])
  })

  test('fails loudly on an unknown validator', () => {
    assert.throws(
      () => run('x', [spec('x', 'X', 'x', 'missing')]),
      /unknown validator missing/
    )
  })

  test('rejects non-RE2 syntax such as backreferences', () => {
    assert.throws(() => run('aa', [spec('x', 'X', '(a)\\1')]))
  })
})
