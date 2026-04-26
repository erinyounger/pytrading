---
title: "Architecture Constraints"
dimension: specs
category: planning
keywords:
  - architecture
  - module
  - layer
  - pattern
readMode: required
priority: high
---

# Architecture Constraints

## Module Boundaries

- Each module owns its data and exposes a public API
- No circular dependencies between modules
- Shared utilities live in a dedicated shared layer

## Layer Separation

- Presentation layer must not import data layer directly
- Business logic must be independent of framework specifics
- Configuration must be externalized, not hardcoded

## Dependency Rules

- External dependencies require justification
- Prefer standard library when available
- Pin dependency versions for reproducibility
- [rule:arch] Strict layer separation: UI → API → Service → Data (no skipping layers)
- [rule:arch] Service/business logic must be stateless (state in DB/cache only)
- [rule:arch] Use built-in/native APIs over third-party libraries when possible
- [rule:arch] Follow official FastAPI/React conventions and best practices
- [rule:file] Tests in a dedicated tests/ or __tests__/ directory
- [rule:doc] All public functions and classes must have docstrings (Google/NumPy style)
- [rule:doc] Comments explain "why", not "what" — code should be self-documenting
- [rule:perf] Large modules/routes must use lazy loading / code splitting
- [rule:perf] API endpoints must respond within 200ms (p95)
- [rule:security] No API keys, passwords, or tokens in source code — use env vars
- [rule:quality] All code must pass linter checks before commit (enforced by pre-commit)
