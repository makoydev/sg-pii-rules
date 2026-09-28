import type { Validator } from './types.ts'

/**
 * Registry of named validators. Algorithms are specified in VALIDATORS.md;
 * each detector that names a validator must find it here (SPEC.md §3).
 */
export const validators: Record<string, Validator> = {}
