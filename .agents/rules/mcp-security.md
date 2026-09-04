---
trigger: always_on
---

# MCP Security Rules

## Principle

Use the minimum permissions necessary.

## External services

Before using an external MCP tool:

- Understand what it can access.
- Prefer read-only operations when possible.
- Never expose credentials in prompts.
- Never paste API keys into source files.

## GitHub

Do not automatically:

- Delete repositories
- Delete branches
- Force push
- Merge PRs
- Rewrite history

## Browser

Do not enter:

- Passwords
- API keys
- Authentication secrets
- Personal sensitive information

unless explicitly required and the user has approved the action.

## Secrets

Never:

- Read .env files unless explicitly required.
- Print credentials.
- Commit secrets.
- Put credentials into documentation.

## Destructive actions

Ask for explicit confirmation before destructive external actions.