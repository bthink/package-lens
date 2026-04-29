# Handoff — stan na 2026-04-29

## Co jest zrobione

### Etap 0 (Setup) ✅
- `npm test` zielony od zera
- TypeScript strict (NodeNext module resolution, `noUncheckedIndexedAccess`)
- Vitest + tsup + ESLint (flat config) + Prettier
- GitHub Actions CI: typecheck → lint → test → build na push/PR do main/develop
- Struktura: `src/{core,mcp,cli,types}`, `tests/`, `fixtures/{nextjs,vite,express}`
- `CLAUDE.md` z architekturą

### Etap 1 (Core analyzer) ✅
80 testów, 12 plików testowych. Każdy moduł pisany TDD.

| Moduł | Plik | Co robi |
|---|---|---|
| Parser | `src/core/parser.ts` | czyta package.json, stripuje semver range prefixes, wykrywa package manager z lockfile |
| Stack | `src/core/stack.ts` | fingerprint: framework/testing/styling via słownik |
| Outdated | `src/core/outdated.ts` | npm registry `/latest`, major/minor/patch klasyfikacja |
| Vulnerabilities | `src/core/vulnerabilities.ts` | osv.dev POST API, mapuje severity |
| Duplicates | `src/core/duplicates.ts` | słownik 7 grup (date-utils, utility, http-client, state, validation, css-in-js, test-runner) |
| Bundle | `src/core/bundle.ts` | bundlephobia REST, top 10 wg gzip, fallback na 404 |
| Scripts | `src/core/scripts.ts` | missing standard scripts + placeholder detection (echo/exit 0) |
| Licenses | `src/core/licenses.ts` | GPL/AGPL flagowanie tylko w prod deps |
| Score | `src/core/score.ts` | 0-100, dedukcje per outdated/vuln/missing script/duplicate |
| Actions | `src/core/actions.ts` | agreguje wyniki → `{priority, action}[]`, sortowane high→medium |
| Analyze | `src/core/analyze.ts` | orkiestrator, public API: `analyze(path) → AnalysisResult` |

Publiczne API przez `src/core/index.ts`:
```ts
import { analyze } from "package-lens";
const result = await analyze("./package.json");
```

## Co jest następne

### Etap 2 — MCP server (2-3 dni)
Plik wejściowy: `src/mcp/index.ts` (teraz placeholder).

Zaimplementować:
1. `@modelcontextprotocol/sdk` — stdio transport (decyzja z PRD: stdio, nie http)
2. Tool `analyze_package` — pełny `AnalysisResult` jako JSON string
3. Tools cząstkowe: `get_outdated`, `get_vulnerabilities`, `get_stack`, `get_actions`, `get_bundle_impact`
4. Test ręczny w Claude Code przez `.mcp.json` w katalogu projektu

Każdy tool przyjmuje `{ path: string }` i opcjonalne filtry.

### Etap 3 — CLI (1-2 dni)
Plik wejściowy: `src/cli/index.ts` (teraz placeholder).
Commander, komendy `analyze` i `actions`, `--format json|table`.

## Ważne decyzje architektoniczne

- **DI dla sieci**: `checkOutdated`, `checkVulnerabilities`, `getBundleImpact` przyjmują `fetch`/`post` jako parametr. W testach — mock. W produkcji — `globalThis.fetch`. Nigdy nie mockować modułu.
- **Partial results**: `analyze()` nigdy nie rzuca. Sub-analyzery wracają `[]` na błąd sieciowy. Score liczy się z tego co wróciło.
- **Licenses uproszczone**: `auditLicenses` dostaje pre-resolved `{ pkgName → licenseString }`. Faktyczne fetchowanie licencji per-dep z registry to post-MVP.
- **Scoped packages w bundlephobia URL**: `@scope/pkg@version` → `@scope%2Fpkg@version` (tylko `/` encode, nie `@`).
- **ESM only**: wszystkie importy z `.js` extension (NodeNext resolution). Nie używać `require()`.

## Komendy

```bash
npm test                          # wszystkie testy
npx vitest run tests/core/score.test.ts  # jeden plik
npm run typecheck                 # tsc --noEmit
npm run lint                      # eslint src tests
npm run build                     # tsup → dist/
```
