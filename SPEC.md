# sg-pii-rules specification

This is the contract every implementation (the TypeScript reference here, Vetted, Discreet in Go) must follow. An implementation conforms when it passes every case in `fixtures/`.

## 1. Files

| File              | What it is                                                                            |
| ----------------- | ------------------------------------------------------------------------------------- |
| `detectors.json`  | The rules. Validated by `schema/detectors.schema.json`                                |
| `fixtures/*.json` | Conformance cases. Validated by `schema/fixtures.schema.json`                         |
| `SHA256SUMS`      | Checksums of the files above, so consumers can prove what they vendored (from v0.1.0) |

## 2. Detectors

Each detector has an `id`, the `entity` it finds, a `pattern` and an optional `validator`.

- **Pattern syntax is RE2**, the regex dialect of Go's `regexp` package. It has no backreferences and no lookaround, so matching always runs in linear time and a hostile input cannot cause catastrophic backtracking (ReDoS). JavaScript implementations must use an RE2 engine (the reference uses `re2js`), not the built-in `RegExp`, because the two dialects differ.
- A pattern's **whole match** is the candidate value. Capture groups have no meaning.
- Patterns are ASCII-oriented: `\b`, `\d` and `\w` use RE2's ASCII definitions.

## 3. Validators

A validator is a named function from the candidate value to true or false. It removes candidates that match the shape but cannot be valid, such as an NRIC with the wrong check letter. Each implementation provides every validator named in `detectors.json`; an unknown validator name is a load error, never a silent pass. Algorithms are specified in `VALIDATORS.md`.

## 4. Detection algorithm

For an input text:

1. For each detector, in file order, find every non-overlapping match of its pattern, scanning left to right.
2. Drop candidates whose validator returns false.
3. **Resolve overlaps across detectors.** Sort candidates by start position, then by length (longest first), then by detector order in `detectors.json`. Walk the sorted list, keeping a list of accepted matches:
   - if the candidate starts at or after the end of the last accepted match, accept it;
   - otherwise it overlaps the last accepted match, and replaces it only if it is strictly longer, or the same length from an earlier detector. Otherwise it is dropped.

   For example, a phone-shaped run of digits inside an email address is reported once, as `EMAIL`.

4. Return the accepted matches in order of position, each as `{ entity, value }`.

## 5. Fixtures

Each case has `text` and `expect`: the exact ordered list of `{ entity, value }` that detection must return. An empty `expect` means nothing may be found. Cases compare **values, not offsets**, because offsets differ between languages (UTF-16 units in JavaScript, bytes in Go).

Case `kind` is one of:

- `true_positive`: contains at least one entity to find
- `hard_negative`: looks like an entity but is not (for example, an NRIC-shaped order number with the wrong check letter); `expect` is empty
- `mixed`: some of both

All fixture data is synthetic. No real NRIC, phone number or email address may appear. Email fixtures use reserved domains (`example.com`, `example.org`, `example.net`, `.test`).

## 6. Versioning

Semantic versioning on the rules' behaviour: a change that makes any existing fixture's expectation different is a major version; new detectors or new fixtures that pass unchanged are minor; documentation is patch.
