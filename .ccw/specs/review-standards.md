---
title: "Review Standards"
dimension: specs
category: review
keywords:
  - review
  - checklist
  - gate
  - approval
  - standard
readMode: required
priority: medium
---

# Review Standards

## Code Review Checklist

- Correctness: Does it do what it claims?
- Clarity: Is the intent obvious without comments?
- Tests: Are changes covered by tests?
- Security: No new vulnerabilities introduced?
- Performance: No unnecessary allocations or O(n²) loops?

## Approval Gates

- All CI checks must pass
- At least one approving review required
- No unresolved conversations

## Style

- Follow existing project conventions
- Keep PRs focused and reviewable (< 400 lines preferred)
