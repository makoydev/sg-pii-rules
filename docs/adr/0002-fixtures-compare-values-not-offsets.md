# 0002. Conformance fixtures compare values, not offsets

Status: drafted by Claude Code, awaiting Michael's review
Date: 2026-09-28

## Context

Fixtures must be runnable by any implementation. Match positions are counted differently across languages: JavaScript strings index UTF-16 code units, Go strings index bytes. Any non-ASCII character before a match makes the two disagree.

## Options

1. **Offsets in fixtures**, with a declared unit. Precise, but every implementation must convert, and conversion bugs would show up as false conformance failures.
2. **Ordered list of `{ entity, value }`.** Language-neutral. Loses the position, but order of appearance plus value pins down almost every case.

## Decision

Option 2. Each case lists exactly which entities and values must be found, in order of appearance. Hard negatives list nothing.

## Consequences

- Fixtures are easy to read and review by eye.
- A case with the same value appearing twice is still checked, because order and count are compared.
- Implementations still report offsets for their own use (for replacing text); those are tested inside each implementation, not here.
