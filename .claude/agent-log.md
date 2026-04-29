# Agent Log

## Format: task | outcome | what to remember

- Etap 0: repo setup (TS strict, Vitest, tsup, ESLint, Prettier, GitHub Actions, fixtures) | all green | package manager is npm (not pnpm); vitest.config.ts includes both tests/ and src/**/*.test.ts; fixtures/ has 3 real package.json files used in integration tests
- Etap 1: core analyzer TDD (10 modules) | 80/80 tests pass | all network-dependent modules (outdated, vulnerabilities, bundle) use dependency injection — pass custom fetch/post fn in tests, never hit real network; licenses audit takes pre-resolved license strings (not per-dep registry fetch — post-MVP); analyze() silently returns partial results on sub-analyzer failure (never throws)
