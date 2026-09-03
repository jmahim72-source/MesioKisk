---
trigger: always_on
---

# Code Review Standards

When reviewing code, analyze it in this order:

## 1. Correctness

Look for:

- Bugs
- Incorrect assumptions
- Edge cases
- Race conditions
- Incorrect state handling
- Incorrect error handling

## 2. Security

Look for:

- Hardcoded secrets
- Injection vulnerabilities
- Authentication/authorization problems
- Unsafe input handling
- Insecure file operations
- Sensitive data exposure

## 3. Performance

Look for:

- Unnecessary repeated work
- Inefficient algorithms
- N+1 queries
- Excessive network calls
- Memory problems
- Blocking operations

Do not optimize code without evidence that optimization is useful.

## 4. Maintainability

Look for:

- Duplication
- Poor naming
- Excessive complexity
- Large functions
- Tight coupling
- Unclear responsibilities

## 5. Testing

Check whether important behavior is adequately tested.

## Review output

For each important issue provide:

- Severity
- File/location
- Problem
- Why it matters
- Recommended fix

Prioritize real problems over stylistic preferences.