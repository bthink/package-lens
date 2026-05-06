# package-lens

Structured `package.json` analysis for AI agents and developers. Works as an **MCP server** (Claude Code, Cursor, Windsurf) and a **CLI**.

**Web UI → [package-lens.vercel.app](https://package-lens.vercel.app)** — drop a `package.json`, get a full report + AI-ready agent prompt.

Existing tools (`npm audit`, `npm outdated`, `depcheck`) solve one slice of the problem and produce human-readable text that's hard for LLMs to process. `package-lens` gives you one structured JSON report covering dependency health, bundle impact, tech stack, scripts, and licenses — with concrete recommended actions.

## Install

```bash
npm install -g package-lens
```

## CLI

```bash
# full analysis — table output (default)
package-lens analyze ./package.json

# JSON output (LLM-friendly)
package-lens analyze ./package.json --format json

# recommended actions only, filtered by priority
package-lens actions ./package.json --priority high

# analyze current directory
package-lens analyze
```

Example table output:

```
my-app @ 2.1.0
Score:           72/100
Package manager: pnpm
Stack:           nextjs, vitest, tailwind

Outdated packages
  react    18.2.0 → 19.2.5  major
  moment   2.29.4 → 2.30.1  minor

Duplicate packages
  date-utils: moment + date-fns → remove moment, keep date-fns

Recommended actions
  [high]   upgrade react to 19.2.5
  [medium] replace moment with date-fns (already installed)
```

Exit code `1` when health score < 50 — useful in CI pipelines.

## MCP server (Claude Code, Cursor, Windsurf)

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "package-lens": {
      "type": "stdio",
      "command": "package-lens-mcp"
    }
  }
}
```

Or with `npx` (no global install required):

```json
{
  "mcpServers": {
    "package-lens": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "package-lens-mcp"]
    }
  }
}
```

Available tools:

| Tool | Description |
|------|-------------|
| `analyze_package` | Full report — meta, stack, health, bundle, scripts, licenses, actions |
| `get_outdated` | Outdated packages only |
| `get_vulnerabilities` | CVE vulnerabilities only |
| `get_stack` | Tech stack fingerprint (framework, testing, styling) |
| `get_actions` | Recommended actions, optionally filtered by priority |
| `get_bundle_impact` | Bundle size impact for top dependencies |

All tools accept a `path` parameter pointing to `package.json`.

## Output format

```json
{
  "meta": {
    "name": "my-app",
    "packageManager": "pnpm",
    "analyzedAt": "2026-04-29T10:00:00Z"
  },
  "stack": {
    "framework": "nextjs",
    "testing": ["vitest", "playwright"],
    "styling": ["tailwind"]
  },
  "health": {
    "score": 72,
    "outdated": [
      { "name": "react", "current": "18.2.0", "latest": "19.2.5", "severity": "major" }
    ],
    "vulnerabilities": [],
    "duplicates": [
      { "category": "date-utils", "packages": ["moment", "date-fns"], "recommendation": "remove moment, keep date-fns" }
    ]
  },
  "bundleImpact": [
    { "name": "lodash", "gzip": 71000, "treeshakeable": false, "recommendation": "use lodash-es or cherry-pick" }
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
    { "priority": "high", "action": "upgrade react to 19.2.5" },
    { "priority": "medium", "action": "replace moment with date-fns (already installed)" }
  ]
}
```

## Requirements

- Node.js 22+

## License

MIT
