# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm test              # run all tests (vitest run)
npm test -- --reporter=verbose  # verbose output
npx vitest run tests/core/parser.test.ts  # run single test file
npm run typecheck     # tsc --noEmit
npm run lint          # eslint src tests
npm run build         # tsup (outputs to dist/)
npm run dev           # tsx src/cli/index.ts (local CLI)
```

## Architecture

Three entry points built with `tsup`, each emitted as ESM to `dist/`:

| Entry | Source | Purpose |
|-------|--------|---------|
| `core/index` | `src/core/index.ts` | Public analyzer API — exports `analyze()` and types |
| `cli/index` | `src/cli/index.ts` | `package-lens` binary (commander) |
| `mcp/index` | `src/mcp/index.ts` | MCP stdio server (`@modelcontextprotocol/sdk`) |

All three consume `src/core/` — the CLI and MCP server are thin shells around it.

### Core analyzer pipeline (`src/core/`)

`analyze(path: string): Promise<AnalysisResult>` is the single public function. It orchestrates:

1. **Parser** — reads `package.json` (+ optional lockfile) into normalized internal shape
2. **Stack fingerprint** — maps package names to framework/test/styling categories via a static dictionary
3. **Outdated check** — fetches `https://registry.npmjs.org/<pkg>/latest` per dependency
4. **Vulnerabilities** — queries `osv.dev` API (no auth required); preferred over `npm audit`
5. **Duplicate detection** — static dictionary of known functional pairs (moment↔date-fns, lodash↔ramda, etc.)
6. **Bundle impact** — hits bundlephobia REST API; fallback to npm registry `dist.size` on timeout
7. **Scripts audit** — checks for missing standard scripts; detects placeholder `test` scripts (e.g. `echo "no tests"`)
8. **License audit** — flags GPL/AGPL in `dependencies` (not devDependencies)
9. **Score** — 0-100, deducted per outdated major (−10), CVE high/critical (−15), missing `test` script (−5)
10. **Actions generator** — aggregates findings into `{ priority, action }` list

### Types (`src/types/index.ts`)

Single source of truth for all data shapes. `AnalysisResult` is the canonical output — matches the JSON schema in PRD.md exactly. All internal modules import types from here.

### Test fixtures (`fixtures/`)

Three representative `package.json` files used in integration tests:
- `fixtures/nextjs/` — Next.js 14, React 18, has duplicate date libs (moment + date-fns) and lodash
- `fixtures/vite/` — Vite 5, React 18, minimal
- `fixtures/express/` — Express 4, has duplicates (lodash + ramda, moment), suspicious `test` script placeholder

Integration tests should run `analyze()` against these fixtures and snapshot the result shape (not exact values, since registry data changes).

### Output contract

`analyze()` always returns valid JSON matching `AnalysisResult`. Never throw — return partial results with empty arrays on individual analyzer failures. Each sub-analyzer is independently fallible.

### MCP tools (Etap 2)

Six tools exposed over stdio transport:
`analyze_package`, `get_outdated`, `get_vulnerabilities`, `get_stack`, `get_actions`, `get_bundle_impact`.
All accept a `path` param pointing to `package.json`.

### ESM-only

All source uses `.js` extensions in imports (TypeScript NodeNext resolution). Never use CommonJS `require()`.
