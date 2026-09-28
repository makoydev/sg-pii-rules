export interface DetectorSpec {
  id: string
  entity: string
  description: string
  pattern: string
  validator?: string
  sources: string[]
}

export interface DetectorsFile {
  version: string
  detectors: DetectorSpec[]
}

export interface Match {
  entity: string
  value: string
  /** Offsets in UTF-16 code units. Not part of conformance (see SPEC.md §5). */
  start: number
  end: number
}

export type Validator = (value: string) => boolean
