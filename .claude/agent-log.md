# Agent Log

## Format: task | outcome | what to remember

- Etap 0: repo setup (TS strict, Vitest, tsup, ESLint, Prettier, GitHub Actions, fixtures) | all green | package manager is npm (not pnpm); vitest.config.ts includes both tests/ and src/**/*.test.ts; fixtures/ has 3 real package.json files used in integration tests
- Etap 1: core analyzer TDD (10 modules) | 80/80 tests pass | all network-dependent modules (outdated, vulnerabilities, bundle) use dependency injection — pass custom fetch/post fn in tests, never hit real network; licenses audit takes pre-resolved license strings (not per-dep registry fetch — post-MVP); analyze() silently returns partial results on sub-analyzer failure (never throws)
- Etap 3 CLI | 115 tests green, build clean | score-based exit code uses process.exit(1) after stdout write - order matters
- CLI integration tests spawn tsx/esm subprocess; score=0 in CI (no network) so tests must be dynamic on status
- formatTable/formatActions live in src/cli/output.ts separate from index.ts - eases unit testing without process spawning
