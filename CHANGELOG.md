# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/) as defined in `SPEC.md` §6.

## [Unreleased]

### Added

- `SPEC.md`: the contract for implementations: RE2 pattern syntax, named validators, detection and overlap algorithm, fixture format, versioning.
- JSON Schemas for `detectors.json` and fixture files.
- TypeScript reference implementation (`reference/`) and tests: schema validation, RE2 compilation, the minimum fixture count per detector, algorithm unit tests and the conformance runner.
- CI on Node 24 with SHA-pinned Actions; Dependabot; ADRs 0001–0005.
