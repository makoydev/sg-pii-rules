import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { root } from '../test/helpers.ts'

/**
 * The files a consumer vendors (ADR 0004), in a stable order. SHA256SUMS
 * covers exactly these, in the format `sha256sum -c` understands.
 */
export function vendoredFiles(): string[] {
  const dir = (d: string) =>
    readdirSync(join(root, d))
      .filter((f) => f.endsWith('.json'))
      .sort()
      .map((f) => `${d}/${f}`)
  return ['detectors.json', ...dir('schema'), ...dir('fixtures')]
}

export function sha256(relativePath: string): string {
  return createHash('sha256')
    .update(readFileSync(join(root, relativePath)))
    .digest('hex')
}

export function renderSums(): string {
  return vendoredFiles()
    .map((f) => `${sha256(f)}  ${f}\n`)
    .join('')
}
