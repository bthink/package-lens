import type { ScriptsAudit } from "../types/index.js";

const STANDARD_SCRIPTS = ["build", "test", "lint", "dev"];

const PLACEHOLDER_PATTERNS = [/^echo\b/, /^exit\s+0$/, /^true$/, /^:\s*$/];

function isPlaceholder(cmd: string): boolean {
  return PLACEHOLDER_PATTERNS.some((p) => p.test(cmd.trim()));
}

export function auditScripts(scripts: Record<string, string>): ScriptsAudit {
  const missing = STANDARD_SCRIPTS.filter((s) => !(s in scripts));

  const suspicious = Object.entries(scripts)
    .filter(([, cmd]) => isPlaceholder(cmd))
    .map(([name]) => name);

  return { missing, suspicious };
}
