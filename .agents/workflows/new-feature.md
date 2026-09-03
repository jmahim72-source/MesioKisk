---
description: 
---

# New Feature Workflow

## Goal

Safely implement a new feature in the existing project.

## Steps

### 1. Inspect

Inspect:

- Repository structure
- Git status
- Relevant source files
- Existing tests
- Existing architecture

Do not modify anything yet.

### 2. Understand

Determine:

- What the feature should do
- Which components are affected
- Existing patterns to follow
- Potential side effects

### 3. Plan

Create a concise implementation plan.

Include:

- Files to modify
- Files to create
- Main implementation steps
- Testing strategy

Wait for approval before major architectural changes.

### 4. Implement

Implement the smallest appropriate change.

Follow existing project conventions.

Do not modify unrelated code.

### 5. Test

Run:

- Relevant tests
- Lint
- Type checking
- Build

when applicable.

### 6. Review

Inspect the complete git diff.

Look for:

- Bugs
- Security issues
- Unnecessary changes
- Missing tests
- Accidental files

### 7. Report

Provide:

- What changed
- Files changed
- Tests run
- Test results
- Remaining concerns
