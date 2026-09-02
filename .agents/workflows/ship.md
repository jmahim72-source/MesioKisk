# Ship Workflow

## Purpose

Systematic workflow for validating, merging, releasing, and deploying production-ready code safely.

## Workflow steps

### 1. Pre-Ship Verification
- Ensure working tree is clean (`git status`).
- Run the full verification suite locally:
  - Unit and integration test suites.
  - Linter and static analysis checks.
  - Type checker (e.g., TypeScript / mypy).
  - Production build command (`build`).
- Confirm zero failures, errors, or unhandled warnings.

### 2. Hygiene & Secret Audit
- Review the complete diff against `main` (`git diff main...HEAD`).
- Verify no sensitive data (API keys, secrets, credentials, `.env` files) is committed.
- Verify no temporary debugging code, console logs, or scratch files are left behind.
- Ensure any relevant documentation or changelog entries are updated.

### 3. Sync & Rebase
- Fetch the latest changes from the upstream base branch:
  ```bash
  git fetch origin main
  git rebase origin/main
  ```
- If conflicts arise, resolve them carefully, re-run tests, and verify integrity.

### 4. Review & Approvals
- Verify that all code review comments and blockers are resolved.
- Confirm required approvals are met.
- Ensure all remote CI/CD pipeline checks pass.

### 5. Merge
- Merge into `main` using the established repository strategy:
  - **Squash & Merge**: For clean, single-commit feature histories.
  - **Rebase & Merge**: For multi-commit features with intentional atomic history.
- Ensure the merge commit message follows Conventional Commits.

### 6. Release & Tagging (if applicable)
- Create and push semantic version tags when cutting releases:
  ```bash
  git tag -a vX.Y.Z -m "Release vX.Y.Z"
  git push origin vX.Y.Z
  ```
- Publish release notes and changelogs.

### 7. Post-Deployment Smoke Test
- Monitor the deployment pipeline to confirm successful rollout.
- Run smoke tests or verify health endpoints in the target environment.
- Monitor error logs and metrics for anomalies.
- Have a rollback strategy ready if critical issues surface.
