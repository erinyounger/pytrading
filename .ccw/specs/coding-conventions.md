---
title: "Coding Conventions"
dimension: specs
category: general
keywords:
  - python
  - naming
  - style
  - convention
  - pep8
readMode: required
priority: high
scope: project
---

# Coding Conventions

## Coding Style

- [rule:style] PEP 8 strict compliance with max line length 88 (Black formatter)
- [rule:style] Functional style: prefer pure functions, list comprehensions, avoid mutable state
- [rule:style] Early returns / guard clauses over deep nesting

## Naming Conventions

- [rule:naming] snake_case for variables and functions (e.g., get_user_name)
- [rule:naming] PascalCase for classes (e.g., UserService)
- [rule:naming] UPPER_SNAKE_CASE for constants (e.g., MAX_RETRIES)
- [rule:naming] Prefix private methods/attributes with underscore (e.g., _internal_method)

## File Structure

- [rule:file] Separate tests/ directory at project root (not co-located with source)
- [rule:file] Use __init__.py for all Python packages
- [rule:file] One main export per file

## Documentation

- [rule:doc] All public functions and classes must have docstrings
- [rule:doc] Comments explain 'why', not 'what' — code should be self-documenting
