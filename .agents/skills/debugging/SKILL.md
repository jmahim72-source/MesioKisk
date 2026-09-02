---
name: debugging
description: Systematic workflow and heuristics for diagnosing, isolating, and resolving software bugs, runtime crashes, test failures, and anomalous behaviors.
---

# Systematic Debugging Workflow

Use this skill whenever diagnosing defects, analyzing stack traces, fixing failing tests, or resolving unexplained system behavior.

---

## Phase 1: Reproduce & Isolate

1. **Capture the Failure State**:
   - Obtain the exact error message, stack trace, exit code, or failing test output.
   - Note the environment, configuration, and inputs leading to the failure.
2. **Create a Minimal Reproduction**:
   - Strip away unrelated components, plugins, or configurations.
   - Reduce the reproduction steps or create a targeted failing test case.
3. **Determine Scope**:
   - Is the failure deterministic or intermittent (flaky/race condition)?
   - Did it work previously? If so, identify recent changes or commits (`git bisect`/`git log`).

---

## Phase 2: Trace & Analyze

1. **Follow the Stack Trace Bottom-Up**:
   - Identify the exact line of execution and file where the exception was raised.
   - Trace upstream caller functions to locate where invalid state or arguments originated.
2. **Inspect State & Data Invariants**:
   - Check for `null` / `undefined` access, off-by-one errors, type mismatches, or mutated references.
   - Inspect boundary conditions (empty lists, maximum lengths, zero values, special characters).
3. **Verify Assumptions**:
   - Verify asynchronous timing (unhandled promises, race conditions, event ordering).
   - Check environment variables, file paths, permissions, and network dependencies.

---

## Phase 3: Formulate & Test Hypotheses

1. **State the Hypothesis**: Formulate a clear, falsifiable statement: *"The failure occurs because X receives Y under condition Z."*
2. **Test Without Guessing**:
   - Add minimal targeted logs or assertions to validate intermediate values.
   - Do not make speculative multi-file modifications hoping one works.
3. **Confirm the Root Cause**: Ensure you understand *why* the bug occurred, not merely where it surfaced.

---

## Phase 4: Implement Surgical Fix

1. **Apply the Minimal Fix**:
   - Address the root cause at the correct abstraction level.
   - Avoid adding defensive hacks (e.g., blanket try-catch or null checks) that silence errors without fixing the underlying flaw.
2. **Preserve Surrounding Behavior**:
   - Ensure the fix does not break related workflows or change public API contracts.
   - Maintain consistency with existing architecture and coding conventions.

---

## Phase 5: Verify & Prevent Regressions

1. **Run Regression Tests**:
   - Run the reproduction test to verify that the bug is fixed.
   - Run the full test suite to guarantee no side effects or regressions were introduced.
2. **Add a Regression Test**:
   - Add an automated unit or integration test reproducing the exact issue so it cannot reoccur.
3. **Clean Up**:
   - Remove all temporary debugging logs, breakpoints, and scratch files before committing.
