# New Feature Workflow

## Purpose

Standardized end-to-end workflow for planning, implementing, testing, and delivering new features.

## Workflow steps

### 1. Requirements & Scope
- Understand the user requirements and acceptance criteria.
- Clarify any ambiguous requirements before writing code.
- Define what is in scope and out of scope.

### 2. Architecture & Design
- Inspect existing codebase architecture and identify reusable components/utilities.
- Plan component interfaces, data models, and state flow.
- Explain the intended approach briefly before making changes.

### 3. Branch Setup
- Ensure the working tree is clean (`git status`).
- Create a dedicated feature branch:
  ```bash
  git checkout -b feat/<feature-name>
  ```

### 4. Implementation
- Implement the minimal code required to satisfy requirements.
- Follow established project patterns and conventions.
- Keep modules focused on a single responsibility.
- Handle edge cases, input validation, and error states.

### 5. Testing & Verification
- Write unit tests for new logic and integration tests for component interactions.
- Run all verification checks:
  - Unit / integration test suite
  - Linter and type checker
  - Build command
- Verify observable behavior directly.

### 6. Review & Diff Inspection
- Review the complete git diff (`git diff`).
- Ensure no accidental files, secrets, or debug artifacts remain.
- Verify no unrelated files or functionality were modified.

### 7. Commit & Delivery
- Commit changes using Conventional Commits:
  ```bash
  git commit -m "feat(<scope>): <description>"
  ```
- Summarize changes, testing performed, and any next steps.
