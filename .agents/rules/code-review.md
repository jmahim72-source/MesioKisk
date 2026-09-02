---
trigger: always_on
---

# Code Review Guidelines

## Core Principles

- **Constructive & Actionable**: Provide clear, specific feedback with explanations and concrete suggestions or code snippets.
- **Maintain High Standards**: Focus on correctness, security, maintainability, architectural integrity, and readability.
- **Distinguish Severity**: Clearly indicate whether a comment is a blocker (must fix), recommendation, or a minor nitpick.

## Review Checklist

### 1. Correctness & Functionality
- Does the code accurately satisfy all user requirements and task specifications?
- Are edge cases, empty states, null/undefined values, and potential error conditions handled gracefully?
- Are exceptions caught and logged or propagated appropriately?
- Are existing behaviors and backwards compatibility preserved where expected?

### 2. Architecture & Design
- Does the implementation adhere to the established project architecture and design patterns?
- Are components, functions, and modules focused on a single responsibility (SRP)?
- Is there unnecessary coupling or duplicate logic that could be refactored or reused?
- Are abstractions warranted, or is the solution unnecessarily complex?

### 3. Security & Safety
- Are all user and external inputs properly validated and sanitized?
- Are credentials, API keys, tokens, or sensitive data kept out of source code and commits?
- Does the change adhere to the principle of least privilege and safe data access?

### 4. Performance & Resource Efficiency
- Are there obvious performance bottlenecks (e.g., unindexed queries, redundant computations, memory leaks)?
- Are async operations handled properly without unhandled promise rejections or race conditions?
- Are heavy resources, file handles, or network connections cleanly disposed of?

### 5. Code Quality & Readability
- Are functions, variables, and classes named meaningfully and descriptively?
- Is the code self-documenting, with comments reserved for explaining "why" rather than "what"?
- Does the code follow repository style conventions and formatting rules?

### 6. Testing & Verification
- Are new features and bug fixes accompanied by relevant unit or integration tests?
- Do existing and new automated tests pass without flake or failure?
- Is test setup clear, isolated, and representative of real-world scenarios?

## Feedback Classification

When commenting on code or PRs, use clear prefixes to convey intent:
- **[Blocker / Must Fix]**: Critical issues (bugs, security flaws, broken contracts, missing error handling).
- **[Suggestion]**: Recommended improvement for better readability, performance, or pattern alignment.
- **[Question]**: Clarification request regarding intent, design decision, or edge case handling.
- **[Nit]**: Minor aesthetic or style preference (non-blocking).
