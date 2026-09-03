---
description: 
---

# Debug Workflow

## 1. Reproduce

Understand and reproduce the reported problem.

## 2. Inspect

Inspect:

- Error messages
- Stack traces
- Logs
- Relevant source
- Related tests
- Recent git changes

## 3. Hypothesize

Identify likely root causes.

Do not change code based only on guesses.

## 4. Verify

Use logs, tests, instrumentation, or targeted inspection to confirm the root cause.

## 5. Fix

Implement the smallest correct fix.

## 6. Test

Run the relevant tests.

Add a regression test when appropriate.

## 7. Review

Inspect the diff and ensure unrelated behavior was not changed.

## 8. Report

Explain:

- Root cause
- Fix
- Tests
- Remaining concerns
