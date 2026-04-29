---
paths:
  - "**/*.test.ts"
  - "**/*.spec.ts"
  - "**/*Tests.cs"
  - "**/tests/**"
  - "**/e2e/**"
  - "**/*.test.*"
  - "**/*.spec.*"
---

# Testing rules (auto-load on test files)

- **Framework**: [xUnit / Vitest / Jest / Playwright — pick and enforce]
- **Naming**: test method `Should_<Outcome>_When_<Condition>`, test class `<ClassUnderTest>Tests`
- **Structure**: Arrange / Act / Assert — blank lines between each block
- **Coverage target**: [e.g. 80% on Application layer, 100% on Domain entities]
- **Fixtures**: reuse via base classes or fixture factories, never copy-paste setup
- **Mocks**: mock external IO only (DB, HTTP, clock). Never mock value objects or pure functions
- **Async**: always `await` tasks. Never `.Result` or `.Wait()`
- **Data**: use builders / object mothers for test data, not inline literals repeated across tests
- **Snapshots**: OK for stable UI rendering, never for JSON with timestamps or IDs
- **e2e**: use `data-testid` selectors, never CSS class or text selectors

Full reference: `docs/coding-rules.md` §Testing.
