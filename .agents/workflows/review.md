# Review Workflow

## Purpose

Standardized workflow for conducting thorough, actionable code reviews on pull requests, branches, and working changes.

## Workflow steps

### 1. Context & Scope
- Understand the user requirements, issue description, or PR objective.
- Identify the target branch and review boundaries (e.g., `git diff main...HEAD` or `git status`).
- Check whether changes stay within scope without modifying unrelated files.

### 2. Inspect Full Diff
- Review every modified, added, and deleted file.
- Look at the surrounding code to understand how changes integrate into the codebase.
- Check for accidental files, left-over debug code, or committed secrets/credentials.

### 3. Evaluate by Priority
Evaluate findings in order of importance:
1. **Correctness**: Logic bugs, edge cases, off-by-one errors, null/undefined safety.
2. **Security**: Input sanitization, authentication/authorization, secret leakage, injection.
3. **Reliability**: Error handling, unhandled rejections, resource leaks, timeouts.
4. **Performance**: Redundant computations, unindexed queries, memory leaks, re-renders.
5. **Maintainability**: Modularity, single responsibility, meaningful naming, clear contracts.
6. **Testing**: Test coverage, isolation, test quality, no skipped/flaky tests.
7. **Style**: Formatting, naming consistency (non-blocking).

### 4. Verify Automated Checks
- Run the project's build, linter, type-checker, and automated tests.
- Confirm all tests pass cleanly without warnings or unhandled exceptions.

### 5. Format Findings
Classify issues by severity:
- `[CRITICAL]`: Severe security flaws, data corruption, or system-breaking bugs.
- `[HIGH]`: Major logic defects, broken error handling, or performance bottlenecks.
- `[MEDIUM]`: Maintainability issues, architectural drift, or missing test coverage.
- `[LOW]`: Minor improvements, style inconsistencies, or documentation typos.
- `[INFO]`: Explanatory notes, positive observations, or non-blocking questions.

For each finding, provide:
- **Location**: File path and line range.
- **Problem**: Clear description of what is wrong.
- **Impact**: Why this issue matters.
- **Recommendation**: Concrete suggestion or code replacement.

### 6. Deliver Review Summary
Provide an overall review summary:
- Summary of findings by severity.
- Automated check & test results.
- Final recommendation (Approve, Approve with suggestions, or Request changes).
