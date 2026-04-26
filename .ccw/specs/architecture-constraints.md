---
title: "Architecture Constraints"
dimension: specs
category: planning
keywords:
  - architecture
  - layer
  - constraint
  - dependency
readMode: required
priority: high
scope: project
---

# Architecture Constraints

## Architecture Principles

- [rule:arch] No circular dependencies between modules
- [rule:arch] Strict layer separation: Controller → Service → Model → DB (no skipping layers)
- [rule:arch] Stateless services: business logic must be stateless (state in DB/cache only)
- [rule:arch] Use dependency injection for testability, no hardcoded dependencies

## Technology Constraints

- [rule:build] No new dependencies without explicit justification and review
- [rule:build] Pin dependency versions (use exact versions, not ranges)
- [rule:build] Prefer native/built-in APIs over third-party libraries when possible
- [rule:build] Follow official FastAPI and React conventions and best practices

## Performance Constraints

- [rule:perf] API endpoints must respond within 200ms (p95)
- [rule:perf] Use async/await for I/O operations in FastAPI
- [rule:perf] Database connections must use connection pooling

## Security Constraints

- [rule:security] All user input must be validated with Pydantic models
- [rule:security] No API keys, passwords, or tokens in source code — use environment variables
- [rule:security] All database queries must use SQLAlchemy ORM (parameterized by default)
