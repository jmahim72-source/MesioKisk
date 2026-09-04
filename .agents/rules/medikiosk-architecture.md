---
trigger: always_on
---

# MediKiosk Architecture

## Source of truth

The actual MediKiosk implementation is the source of truth.

Documentation must not contradict the code.

## Architecture decisions

Before introducing a significant architectural change:

1. Inspect the existing architecture.
2. Explain the problem.
3. Identify alternatives.
4. Explain trade-offs.
5. Propose the change.

## Simplicity

Prefer the simplest architecture that satisfies MediKiosk requirements.

Avoid unnecessary:

- Microservices
- Infrastructure
- Dependencies
- Abstractions
- External services

## Safety

MediKiosk is a healthcare-related project.

Never treat AI-generated medical information as automatically correct.

Clearly separate:

- Software functionality
- Medical/clinical logic
- User-facing information

Any medical/clinical decision logic must be explicitly defined and reviewed rather than invented by the coding agent.
