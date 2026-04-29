---
tags: [projekt, packagelens, roadmap]
created: 2026-04-28
status: active
target_mvp: 2026-05-26
---

# PackageLens - Roadmap MVP

[[PRD]] | [[Dashboard]]

**Cel:** MVP gotowe do pokazania na rozmowie kwalifikacyjnej (PackageLens MCP server + cienki front w React jako case study).

**Termin:** 4 tygodnie, czyli **2026-05-26**.

**Filozofia:** każdy ticket = max 1 dzień pracy. Większy = źle dobrany, rozbij. Definition of Done przy każdym kroku.

---

## Etap 0 - Setup (1-2 dni) ✅ DONE 2026-04-29

- [x] **0.1 Sprawdzić czy nazwa `package-lens` wolna na npm** — wolna ✅
- [x] **0.2 Init repo** (TS strict, Vitest, tsup, ESLint, Prettier, GitHub Actions CI)
  - DoD: `npm test` przechodzi pusty, CI zielony ✅
- [x] **0.3 Struktura katalogów**: `src/core/`, `src/mcp/`, `src/cli/`, `src/types/`, `tests/`, `fixtures/`
  - Struktura opisana w CLAUDE.md ✅

## Etap 1 - Core analyzer (3-5 dni) ✅ DONE 2026-04-29 — 80 testów

Sercem jest funkcja `analyze(path: string): AnalysisResult`. Pisana TDD.

- [x] **1.1 Parser package.json** (dependencies, devDependencies, scripts, license)
- [x] **1.2 Tech stack fingerprint** (Next.js, Vite, Remix, Astro, SvelteKit, Vitest, Jest, Playwright, Tailwind, styled-components, emotion)
- [x] **1.3 Outdated check** via npm registry `/latest` — DI fetch, major/minor/patch
- [x] **1.4 Vulnerabilities** via osv.dev API — DI post, severity mapping
- [x] **1.5 Duplicate detection** — słownik 7 grup (date-utils, utility, http-client, state-management, validation, css-in-js, test-runner)
- [x] **1.6 Bundle size top N** via bundlephobia — top 10 wg gzip, fallback na 404
- [x] **1.7 Scripts audit** — missing standard scripts + placeholder detection
- [x] **1.8 License audit** — GPL/AGPL flagowanie w prod deps
- [x] **1.9 Score health 0-100** — formuła w `src/core/score.ts`
- [x] **1.10 Actions generator** + `analyze()` orkiestrator — `src/core/analyze.ts`

## Etap 2 - MCP server (2-3 dni)

- [ ] **2.1 Setup `@modelcontextprotocol/sdk`, transport stdio**
- [ ] **2.2 Tool `analyze_package`** (pełny wynik)
- [ ] **2.3 Tools cząstkowe**: `get_outdated`, `get_vulnerabilities`, `get_stack`, `get_actions`, `get_bundle_impact`
- [ ] **2.4 Test ręczny w Claude Code** (config w `.mcp.json`, wywołanie tool z agenta)
  - DoD: agent dostaje wynik bez błędów, parsuje JSON

## Etap 3 - CLI (1-2 dni)

- [ ] **3.1 `commander` setup, komenda `analyze`**
- [ ] **3.2 `--format json|table`** (table = console.table dla actions)
- [ ] **3.3 Komenda `actions --min-priority high`**
- [ ] **3.4 README z przykładami użycia**

## Etap 4 - Front React (case study) (3-5 dni)

**To nie było w PRD - dorzucam jako element pod portfolio i pod role React+AI.** Cienka aplikacja Next.js, która wywołuje analyzer i wyświetla raport. Pokazuje że umiem łączyć backend AI tooling z frontem.

- [ ] **4.1 Init `package-lens-web`** (Next.js 15 App Router + Tailwind + shadcn/ui)
- [ ] **4.2 Endpoint `/api/analyze`** (POST z `package.json` content) wywołuje core analyzer
- [ ] **4.3 Strona `/`**: drag-drop / paste package.json, "Analyze" button
- [ ] **4.4 Komponent `<HealthScore />`** (gauge / progress)
- [ ] **4.5 Komponent `<ActionsList />`** (lista akcji z priority badges)
- [ ] **4.6 Komponent `<StackBadges />`** (framework, test, styling)
- [ ] **4.7 Streaming wyników** (Vercel AI SDK style - jeśli analyzer zwraca etapami)
- [ ] **4.8 Deploy na Vercel** + custom domain albo subdomena
  - DoD: można wkleić package.json i dostać wizualny raport w < 5s

## Etap 5 - Polish + dystrybucja (1-2 dni)

- [ ] **5.1 README rooturepo** (problem, demo gif, install, MCP config snippet, link do live demo)
- [ ] **5.2 Publikacja na npm** (`npm publish`)
- [ ] **5.3 LinkedIn post** o premierze (link do [[WpisyLinkedin]])
- [ ] **5.4 Wpis na [[03_Knowledge/IT/IT]]** z lekcjami z budowy MCP server
- [ ] **5.5 Aktualizacja [[GitHub-AboutMe]]** o link do projektu
- [ ] **5.6 Aktualizacja [[Tracker]] - PackageLens jako pkt w "Co podnosi szanse"**

---

## Risk register

| Ryzyko | Prawdopodobieństwo | Mitigacja |
|---|---|---|
| Bundlephobia API rate limit | średnie | cache w pamięci + fallback na size z npm registry |
| Nazwa `package-lens` zajęta | niskie | backup names: `pkg-lens`, `npm-lens`, `deps-lens` |
| osv.dev format niezgodny z oczekiwanym | niskie | adapter, snapshot test |
| Front przejmuje energię od core | wysokie | front DOPIERO po Etap 3 zielonym |
| Scope creep (monorepo, GH Action) | wysokie | wszystko poza listą = [[Parking]] albo [[97_Inbox]] |

---

## Definition of Done dla MVP

1. `npx package-lens analyze ./package.json` zwraca prawidłowy JSON dla 3 fixture projektów
2. MCP server działa w Claude Code (test z realnym agentem)
3. Front aplikacja na Vercel, public URL, działa na obcym package.json
4. README z gif demo + instrukcja MCP config
5. Opublikowane na npm
6. LinkedIn post wysłany

Po DoD: dorzucamy do CV / portfolio i wracamy do [[PersonalDashboard]] albo następnego priorytetu.

---

## Tracking dzienny

Codzienny progres notuję w [[Dashboard]] (pole "Następny ruch w PackageLens"). Tutaj odhaczamy ticketów po każdej sesji.
