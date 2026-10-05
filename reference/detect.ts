import { readFileSync } from 'node:fs'
import { RE2JS } from 're2js'
import type { DetectorsFile, DetectorSpec, Match, Validator } from './types.ts'
import { validators as defaultValidators } from './validators.ts'

interface CompiledDetector {
  spec: DetectorSpec
  order: number
  pattern: RE2JS
  validator?: Validator
  /** True if the pattern names a `value` group to report (SPEC.md §2). */
  hasValueGroup: boolean
}

const VALUE_GROUP = /\(\?P<value>/

export function loadDetectorsFile(path: string): DetectorsFile {
  return JSON.parse(readFileSync(path, 'utf8')) as DetectorsFile
}

/**
 * Compiles every pattern with RE2 and resolves validator names. Fails loudly
 * on an invalid pattern or an unknown validator (SPEC.md §2 and §3).
 */
export function compile(
  file: DetectorsFile,
  validators: Record<string, Validator> = defaultValidators
): CompiledDetector[] {
  return file.detectors.map((spec, order) => {
    let validator: Validator | undefined
    if (spec.validator !== undefined) {
      validator = validators[spec.validator]
      if (validator === undefined) {
        throw new Error(
          `Detector ${spec.id} names unknown validator ${spec.validator}`
        )
      }
    }
    return {
      spec,
      order,
      pattern: RE2JS.compile(spec.pattern),
      validator,
      hasValueGroup: VALUE_GROUP.test(spec.pattern)
    }
  })
}

/** Runs the detection algorithm in SPEC.md §4. */
export function detect(text: string, detectors: CompiledDetector[]): Match[] {
  const candidates: (Match & { order: number })[] = []

  for (const detector of detectors) {
    const matcher = detector.pattern.matcher(text)
    while (matcher.find()) {
      // With a `value` group, only that part is reported; the rest of the
      // match is context that must be present (SPEC.md §2, ADR 0010).
      const group = detector.hasValueGroup ? 'value' : 0
      const value = matcher.group(group)
      if (value === null || value.length === 0) continue
      if (detector.validator && !detector.validator(value)) continue
      candidates.push({
        entity: detector.spec.entity,
        value,
        start: matcher.start(group),
        end: matcher.end(group),
        order: detector.order
      })
    }
  }

  // Overlaps (SPEC.md §4 step 3). Candidates arrive sorted by start, then
  // longest first, then detector order. Kept matches never overlap, so a new
  // candidate can only clash with the last one kept.
  candidates.sort(
    (a, b) =>
      a.start - b.start ||
      b.end - b.start - (a.end - a.start) ||
      a.order - b.order
  )
  const kept: (Match & { order: number })[] = []
  for (const candidate of candidates) {
    const last = kept.at(-1)
    if (last === undefined || candidate.start >= last.end) {
      kept.push(candidate)
      continue
    }
    const candidateLength = candidate.end - candidate.start
    const lastLength = last.end - last.start
    if (
      candidateLength > lastLength ||
      (candidateLength === lastLength && candidate.order < last.order)
    ) {
      kept[kept.length - 1] = candidate
    }
  }

  return kept.map(({ entity, value, start, end }) => ({
    entity,
    value,
    start,
    end
  }))
}
