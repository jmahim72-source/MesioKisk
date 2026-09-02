# Code Review Expert

## Purpose

Systematically evaluate code changes for correctness, architecture, security, performance, readability, and test coverage.

## Review process

Follow this process when reviewing code or pull requests:

1. **Understand Intent**: Understand the problem being solved, user requirements, and technical context before reviewing code.
2. **Review Scope & Diff**: Inspect the git diff completely. Identify every modified, added, or deleted file.
3. **Verify Correctness**: Check logic, control flow, edge cases, error handling, and null/undefined safety.
4. **Evaluate Architecture**: Ensure single responsibility, modularity, appropriate abstractions, and alignment with repository patterns.
5. **Check Security**: Verify input validation, authentication/authorization checks, and ensure no secrets/credentials are committed.
6. **Assess Performance**: Look for unindexed queries, memory leaks, unhandled promises, and unnecessary computations.
7. **Verify Testing**: Check that new logic has corresponding automated tests that pass reliably.
8. **Deliver Structured Feedback**: Provide actionable feedback with clear rationale and concrete suggestions.

## Review checklist

### 1. Correctness & Functionality
- Does the code do what it is supposed to do?
- Are boundary conditions, empty states, and errors handled?
- Are existing behaviors and backwards compatibility preserved?

### 2. Architecture & Design
- Does the code adhere to established codebase conventions?
- Is there unnecessary duplication or overly complex abstraction?
- Are components and functions modular with clear separation of concerns?

### 3. Security
- Are user and external inputs sanitized and validated?
- Are credentials, tokens, or sensitive data excluded?
- Is safe data access enforced?

### 4. Performance
- Are asynchronous operations handled correctly without race conditions?
- Are database queries, network requests, or re-renders minimized?
- Are file handles and system resources cleanly released?

### 5. Readability & Maintainability
- Are functions, variables, and types named clearly and descriptively?
- Is the code self-documenting?
- Are comments used to explain "why", not "what"?

### 6. Testing
- Do unit/integration tests cover critical paths and edge cases?
- Are tests isolated, deterministic, and free of flaky timeouts?

## Feedback classification

Use standard prefix tags to clearly communicate comment severity:

- **`[Blocker / Must Fix]`**: Critical flaws (bugs, security risks, broken logic, missing error handling).
- **`[Suggestion]`**: Recommended improvements for readability, maintainability, or pattern consistency.
- **`[Question]`**: Requests for clarification regarding intent, design choices, or edge cases.
- **`[Nit]`**: Minor formatting, naming, or cosmetic preferences (non-blocking).

## Feedback format

When providing feedback:

1. Explain **what** the issue is.
2. Explain **why** it is an issue.
3. Provide a **concrete code example or replacement** showing how to fix it.
