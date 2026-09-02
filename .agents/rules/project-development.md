---
trigger: always_on
---

# Project Development Rules

## Understand before modifying

Before implementing a feature:

1. Inspect the repository structure.
2. Read the relevant existing files.
3. Identify the current architecture.
4. Identify existing patterns that should be reused.
5. Explain the implementation plan briefly.

## Architecture

- Follow the existing project architecture.
- Do not introduce a new architectural pattern without a clear reason.
- Keep business logic separate from presentation/UI logic where appropriate.
- Keep modules focused on a single responsibility.
- Avoid unnecessary coupling.

## Changes

- Make the smallest change that correctly solves the problem.
- Do not rewrite working code unnecessarily.
- Do not rename or move files without a reason.
- Do not change APIs or interfaces without checking their consumers.
- Preserve backwards compatibility when appropriate.

## Testing

Every meaningful feature or bug fix should have appropriate verification.

Prefer:

- Unit tests for isolated logic.
- Integration tests for interactions between components.
- End-to-end tests for critical user flows.

Do not claim something works without actually verifying it.

## Completion criteria

A task is not complete merely because the code was written.

Before considering the task complete:

- Code compiles/builds.
- Relevant tests pass.
- Relevant lint/type checks pass.
- No obvious errors remain.
- Git diff has been reviewed.
- No unrelated changes were introduced.