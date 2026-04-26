---
title: "Coding Conventions"
dimension: specs
category: general
keywords:
  - typescript
  - naming
  - style
  - convention
readMode: required
priority: high
---

# Coding Conventions

## Naming

- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces
- Use UPPER_SNAKE_CASE for constants

## Formatting

- 2-space indentation
- Single quotes for strings
- Trailing commas in multi-line constructs

## Patterns

- Prefer composition over inheritance
- Use early returns to reduce nesting
- Keep functions under 30 lines when practical

## Error Handling

- Always handle errors explicitly
- Prefer typed errors over generic catch-all
- Log errors with sufficient context
- [rule:style] Prefer pure functions, list comprehensions, avoid mutable state
- [rule:style] Strict PEP 8 compliance with max line length 88 (Black formatter)
- [rule:style] Prefer early returns / guard clauses over deep nesting
- [rule:typing] Use type hints for all function signatures and class attributes
- [rule:naming] snake_case for variables and functions
- [rule:naming] PascalCase for classes, interfaces, type aliases
- [rule:naming] UPPER_SNAKE_CASE for constants
- [rule:naming] Prefix interfaces with "I" (TypeScript)
