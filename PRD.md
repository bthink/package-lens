# PackageLens - PRD

[[01_Projects]] | **Roadmapa wykonawcza: [[Roadmap]]** | **Status w: [[Dashboard]]**

---

## Cel projektu

Narzędzie do analizy pliku `package.json`, zaprojektowane jako **MCP server** - czyli pierwszorzędny obywatel ekosystemu agentów AI (Claude Code, Cursor, Windsurf, etc.). Człowiek może używać go przez CLI, agent - przez protokół MCP.

**Problem:** Istniejące narzędzia (`npm audit`, `npm outdated`, `depcheck`) rozwiązują jeden wycinek problemu i produkują output dla ludzi - czyli tekst, który jest trudny do przetworzenia przez LLM. Brakuje narzędzia, które daje **jedno, ustrukturyzowane, kompletne spojrzenie** na projekt z perspektywy zależności.

---

## Dla kogo

**Główny użytkownik:** Developer pracujący z asystentem AI (Claude Code, Cursor), który chce żeby agent sam wiedział co się dzieje z zależnościami projektu bez ręcznego wklejania outputów.

**Drugorzędny:** Developer używający CLI w terminalu lub CI/CD pipeline.

---

## Zakres MVP

### Wejście
- ścieżka do `package.json` (lokalnie)
- opcjonalnie: `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml` (dla dokładniejszych danych)

### Analiza - co narzędzie sprawdza

**1. Dependency health**
- które paczki są outdated (current vs latest via npm registry)
- czy są znane CVE (via `npm audit` lub osv.dev API)
- duplicate packages - kilka paczek robiących to samo (np. `lodash` + `ramda`, `moment` + `date-fns`)

**2. Tech stack fingerprint**
- detekcja frameworka (Next.js, Vite, Remix, Astro, etc.)
- detekcja środowiska testowego (Vitest, Jest, Playwright, etc.)
- detekcja stylingowania (Tailwind, CSS Modules, styled-components, etc.)
- output: structured tags, nie tekst

**3. Bundle size estimate**
- top N najcięższych zależności via bundlephobia API
- flaga: czy dana paczka ma tree-shaking support

**4. Scripts audit**
- czy są standardowe skrypty: `build`, `test`, `lint`, `dev`
- czy `test` script faktycznie cokolwiek uruchamia (nie jest placeholder)

**5. Licencje**
- lista unikalnych licencji w projekcie
- flaga jeśli jest coś niekompatybilnego z MIT/commercial use

**6. AI-ready recommendations**
- sugestie alternatyw dla heavy/deprecated paczek
- sugestie konsolidacji duplikatów
- sformułowane jako konkretne akcje, nie opisy

### Wyjście

Zawsze **JSON** jako format bazowy - zoptymalizowany pod LLM (krótkie klucze, bez redundancji, severity levels jako enums).

Dla CLI - opcjonalnie rendered table / pretty print.

Przykładowa struktura outputu:

```json
{
  "meta": {
    "name": "my-app",
    "packageManager": "pnpm",
    "analyzedAt": "2026-04-08T10:00:00Z"
  },
  "stack": {
    "framework": "nextjs@14",
    "testing": ["vitest", "playwright"],
    "styling": ["tailwind"]
  },
  "health": {
    "score": 72,
    "outdated": [
      { "name": "react", "current": "18.2.0", "latest": "19.1.0", "severity": "minor" }
    ],
    "vulnerabilities": [],
    "duplicates": [
      { "category": "date-utils", "packages": ["moment", "date-fns"], "recommendation": "remove moment, keep date-fns" }
    ]
  },
  "bundleImpact": [
    { "name": "lodash", "size": "71kB", "treeshakeable": false, "recommendation": "use lodash-es or cherry-pick" }
  ],
  "scripts": {
    "missing": ["lint"],
    "suspicious": []
  },
  "licenses": {
    "unique": ["MIT", "ISC", "Apache-2.0"],
    "issues": []
  },
  "actions": [
    { "priority": "high", "action": "upgrade react to 19.1.0" },
    { "priority": "medium", "action": "replace moment with date-fns (already installed)" }
  ]
}
```

---

## Interfejsy

### 1. MCP Server (priorytet #1)

Narzędzie rejestruje się jako MCP server i eksponuje tools:

| Tool | Opis |
|------|------|
| `analyze_package` | pełna analiza - zwraca cały JSON |
| `get_outdated` | tylko outdated deps |
| `get_vulnerabilities` | tylko CVE |
| `get_stack` | tylko tech stack fingerprint |
| `get_actions` | tylko lista recommended actions |
| `get_bundle_impact` | tylko bundle size top N |

Każde narzędzie przyjmuje `path` (ścieżka do package.json) i opcjonalne filtry.

### 2. CLI

```bash
# pełna analiza
package-lens analyze ./package.json

# tylko akcje - przydatne w CI
package-lens actions ./package.json --min-priority high

# format
package-lens analyze ./package.json --format json   # default
package-lens analyze ./package.json --format table  # human
```

### 3. API (post-MVP)

REST endpoint do integracji z CI/CD bez instalowania narzędzia lokalnie.

---

## Tech stack

| Warstwa | Wybór | Powód |
|---------|-------|-------|
| Język | TypeScript strict | natywny dla ekosystemu npm |
| Runtime | Node.js 22+ | LTS, natywne fetch |
| MCP | `@modelcontextprotocol/sdk` | oficjalny SDK |
| CLI | `commander` | lekki, popularny |
| npm registry | `npm-registry-fetch` lub raw fetch | oficjalne API |
| Bundlephobia | REST API (publiczne) | brak auth, darmowe |
| Testy | Vitest | szybki, TS-native |
| Build | `tsup` | zero-config bundler |
| Dystrybucja | npm (`package-lens`) | globalny install |

---

## Poza scope MVP

- analiza monorepo (workspace)
- analiza node_modules (zainstalowanych vs deklarowanych)
- UI webowy
- przechowywanie historii analiz
- integracja z GitHub Actions jako action

---

## Metryki sukcesu

- MCP server działa w Claude Code i Cursor bez dodatkowej konfiguracji
- `analyze_package` zwraca wynik w < 5s dla typowego projektu
- output JSON parsuje się bez błędów przez `JSON.parse`
- CLI przechodzi własne testy integracyjne na 3 fixture projektach (Next.js, Vite, Express)

---

## Otwarte pytania

- [ ] Czy bundlephobia API ma rate limiting który będzie problemem?
- [ ] osv.dev vs `npm audit` jako źródło CVE - osv.dev ma publiczne API bez auth, preferować
- [ ] Nazwa `package-lens` - sprawdzić czy wolna na npm
- [ ] Czy MCP server powinien działać jako `stdio` (lokalny) czy `http` (zdalny)?  
      Decyzja: **stdio na start** - prostsze, nie wymaga hostingu

---

## Powiązane notatki

- [[Analizator packagejson]] - oryginalny pomysł
- [[MCP]] - wiedza o MCP serverach
- [[AI]]
