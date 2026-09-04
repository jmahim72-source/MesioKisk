---
description: Standard workflow for implementing features in the MediKiosk healthcare kiosk system.
---

# MediKiosk Feature Workflow

## Phase 1 — Understand

Inspect:

- Repository
- Architecture
- Existing implementation
- Git status
- Relevant GitHub issues
- Existing documentation

Do not modify code.

## Phase 2 — Research

If external technical information is required:

- Search official documentation.
- Verify current APIs.
- Avoid relying on outdated information.

## Phase 3 — Plan

Create:

- Problem statement
- Proposed solution
- Files affected
- Architecture impact
- Testing strategy
- Security considerations

## Phase 4 — Implement

Implement the smallest appropriate change.

Follow existing project conventions.

## Phase 5 — Test

Run:

- Unit tests
- Integration tests
- Lint
- Type checks
- Build

where applicable.

## Phase 6 — Browser verification

If the feature affects the UI:

- Start the application.
- Use the browser.
- Test the relevant user flow.
- Check console errors.
- Check important edge cases.

## Phase 7 — Review

Inspect:

- Git diff
- Security
- Performance
- Maintainability
- Tests

## Phase 8 — GitHub

If requested:

- Prepare commit
- Prepare PR description
- Link relevant issue
- Summarize testing

Never merge or perform destructive GitHub operations automatically.

## Final report

Provide:

- What changed
- Why
- Files changed
- Tests
- Browser verification
- Git status
- Remaining concerns