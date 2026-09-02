# Debugging Workflow

## Purpose

Systematic step-by-step workflow for diagnosing, fixing, and verifying software bugs and regressions.

## Workflow steps

### 1. Reproduce & Collect Evidence
- Capture exact error messages, stack traces, logs, and unexpected outputs.
- Identify minimal reproduction steps or create a targeted failing test case.
- Determine if the issue is deterministic, intermittent, or environment-specific.

### 2. Inspect & Trace
- Follow the stack trace from the point of failure back to where bad state originated.
- Inspect relevant source code, data flow, and state mutations.
- Check recent changes using `git log` or `git diff` to identify regressions.

### 3. Formulate & Validate Hypothesis
- Formulate a specific hypothesis explaining the root cause.
- Validate the hypothesis using targeted logs, debuggers, or isolated assertions.
- Avoid speculative code edits before confirming the cause.

### 4. Implement Minimal Fix
- Implement the smallest appropriate fix addressing the root cause directly.
- Avoid masking symptoms (e.g., swallowing exceptions, arbitrary delays, removing checks).
- Preserve existing contracts, interfaces, and surrounding functionality.

### 5. Regression Testing & Verification
- Run the reproduction test to verify the fix works.
- Run the full test suite, linter, and type checker to ensure no side effects.
- Add an automated regression test covering the failure scenario.

### 6. Clean Up & Review Diff
- Remove all temporary debugging code, logs, breakpoints, and scratch files.
- Inspect `git diff` to ensure only the necessary changes are included.

### 7. Commit & Explain
- Commit changes using Conventional Commits:
  ```bash
  git commit -m "fix(<scope>): <description>"
  ```
- Summarize:
  1. What caused the bug.
  2. Why it occurred.
  3. What was changed.
  4. How it was verified.
