---
name: code-architect
description: Generates, refactors, or audits production-grade backend code. Use when the user asks to build new features, fix architectural bugs, or write robust test cases.
---

# Code Architect Protocol

When this skill is loaded, enforce strict adherence to these software engineering standards:

## 1. Code Generation Rules

- **No Stubs:** Write fully realized, copy-pasteable logic. Do not leave `// TODO` or placeholder blocks.
- **Strong Typing:** Explicitly type all inputs, outputs, and interface boundaries.
- **Fail-Fast Mechanics:** Implement robust error boundaries, explicit exception handling, and early return guards.

## 2. Technical Stack Context

- Target Runtime: Node.js v22 (LTS) using TypeScript.
- Design Patterns: Prioritize dependency injection and data mapper patterns.

## 3. Implementation Verification Steps

Before outputting any code block, mentally verify:

1. Are edge cases (null values, network timeouts) explicitly caught?
2. Does this code introduce tight coupling or violate SOLID principles?
