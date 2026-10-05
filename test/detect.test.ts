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

  test('reports only the value group when a pattern names one', () => {
    const specs = [spec('kv', 'KV', 'key=(?P<value>\\d+)')]
    assert.deepEqual(run('a key=42 and key=7, not 9', specs), [
      { entity: 'KV', value: '42' },
      { entity: 'KV', value: '7' }
    ])
  })

  test('resolves overlaps on the value group, not the whole match', () => {
    // The context "id:" overlaps nothing; the value "123" ties with NUM's
    // "123", and the earlier detector wins the tie.
    const specs = [
      spec('num', 'NUM', '\\d+'),
      spec('id', 'ID', 'id:(?P<value>\\d+)')
    ]
    assert.deepEqual(run('id:123', specs), [{ entity: 'NUM', value: '123' }])
  })

  test('skips a match whose value group did not take part', () => {
    const specs = [spec('opt', 'OPT', 'x(?:=(?P<value>\\d+))?')]
    assert.deepEqual(run('x x=5', specs), [{ entity: 'OPT', value: '5' }])
  })
})
