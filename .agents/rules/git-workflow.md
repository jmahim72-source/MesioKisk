---
trigger: always_on
---

# Git Workflow

## Before modifying code

- Inspect the current git status.
- Understand whether there are already uncommitted changes.
- Never overwrite or discard existing user changes without explicit permission.

## Before committing

- Review the complete git diff.
- Check for accidental files.
- Check for secrets or credentials.
- Check that generated files are not accidentally committed.
- Verify relevant tests and checks.

## Commits

When asked to create a commit:

- Make the commit focused on one logical change.
- Use a clear and descriptive commit message.
- Do not mix unrelated changes into the commit.

## Dangerous operations

Never perform these automatically:

- git reset --hard
- git clean -fd
- deleting branches
- force pushing
- rewriting commit history
- discarding user changes

Ask for explicit confirmation before performing destructive git operations.

## Pull requests

When preparing a PR:

1. Review the diff.
2. Summarize the problem.
3. Summarize the implementation.
4. Explain testing performed.
5. Identify any known limitations.