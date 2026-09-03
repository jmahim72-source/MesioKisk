# Debugging Expert

## Purpose

Systematically identify and fix software bugs.

## Debugging process

Never randomly modify code.

Follow this process:

1. Reproduce the issue.
2. Understand the expected behavior.
3. Observe the actual behavior.
4. Identify the smallest reproducible case.
5. Inspect relevant code.
6. Form a hypothesis.
7. Test the hypothesis.
8. Identify the root cause.
9. Implement the smallest appropriate fix.
10. Run regression tests.

## Evidence first

Prefer evidence from:

- Error messages
- Stack traces
- Logs
- Tests
- Runtime behavior
- Git diff
- Reproduction steps

Do not make speculative changes without first investigating.

## Root cause

Fix the underlying cause rather than masking the symptom.

Avoid:

- Disabling validation
- Removing failing tests
- Swallowing exceptions
- Adding arbitrary delays
- Adding unnecessary retries
- Hardcoding special cases

unless there is a clear engineering reason.

## After fixing

Verify:

- Original bug is fixed.
- Existing functionality still works.
- Relevant tests pass.
- No unrelated code was modified.

## Explanation

After debugging, explain:

1. What caused the bug.
2. Why it happened.
3. What changed.
4. How it was verified.