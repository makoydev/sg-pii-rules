# 0012. Dates of birth are detected only directly after a birth clue

Status: accepted. Drafted by Claude Code; reviewed and accepted by Michael Mendoza on 2026-10-06.
Date: 2026-10-05

## Context

A date of birth is personal data; any other date usually isn't. Text and code are full of dates: releases, timestamps, copyright years, deadlines. Nothing in the date itself says it is a birth date.

## Options

1. **Any plausible date.** Catches every date of birth and reports every release date and timestamp.
2. **A date directly after a clue:** DOB, D.O.B., date of birth, birth date, born (on), or keys such as `dob`, `dateOfBirth`, `birth_date`, with only an optional colon or equals sign and quotes in between. The date is reported through a `value` group (ADR 0010).
3. **A date within a few words of a clue.** Catches "born in Singapore on 12 March 1988", but a window of words also catches "DOB field added on 12/03/2024", and it is hard to specify identically in two languages.

## Decision

Option 2. The validator `calendar_date` accepts a date that exists in the calendar, reading `12/03/1988` both day-first (Singapore) and month-first (US). It deliberately does not compare with today's date: a validator whose answer changes with the calendar would make the conformance suite flaky.

## Consequences

- On both real-code corpora (36 MB): 0 hits. The Go corpus has 19 real dates with no birth clue; none was reported (EVALS.md §2e).
- Missed: dates of birth with words between clue and date ("born in Singapore on…"), two-digit years (`12/03/88`), dates without a year, and other formats.
- A future date after a clue (`DOB: 01/01/2030`) is reported. It is still something a person typed into a birth field, which is worth protecting.
- `12/03/1988` can't be told apart from 3 December; it doesn't matter, because either way it is a date of birth.
