---
trigger: always_on
---

# Testing Standards

When implementing or modifying functionality:

## Before writing tests

- Understand the existing testing framework.
- Inspect existing tests for project conventions.
- Reuse existing test utilities and fixtures.

## Test behavior

Tests should verify observable behavior rather than implementation details.

Include appropriate:

- Happy paths
- Edge cases
- Invalid inputs
- Error conditions
- Important boundary conditions

## After implementation

Run the smallest relevant test suite first.

Then, when appropriate, run:

- Full test suite
- Linter
- Type checker
- Build

## Failure handling

If tests fail:

1. Determine whether the failure is caused by the change.
2. Inspect the actual error.
3. Fix the underlying issue.
4. Re-run the relevant test.
5. Do not simply remove or weaken a failing test to make the suite pass.

Never claim tests passed unless they were actually executed.
- Ensure all tests pass without warnings, memory leaks, or unhandled promise rejections.