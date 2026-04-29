import type { RecommendedAction, OutdatedPackage, Vulnerability, DuplicateGroup, Priority, PackageMeta } from "../types/index.js";

interface ActionsInput {
  outdated: OutdatedPackage[];
  vulnerabilities: Vulnerability[];
  duplicates: DuplicateGroup[];
  missingScripts: string[];
  suspiciousScripts: string[];
  licenseIssues: string[];
  packageManager?: PackageMeta["packageManager"];
}

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function installCmd(pm: PackageMeta["packageManager"] | undefined, pkg: string, version: string): string {
  const spec = `${pkg}@${version}`;
  switch (pm) {
    case "pnpm": return `pnpm add ${spec}`;
    case "yarn": return `yarn add ${spec}`;
    default: return `npm install ${spec}`;
  }
}

export function generateActions(input: ActionsInput): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

  for (const vuln of input.vulnerabilities) {
    const priority: Priority = vuln.severity === "critical" || vuln.severity === "high" ? "high" : "medium";
    actions.push({ priority, action: `patch ${vuln.name} — ${vuln.cveId}: ${vuln.summary}` });
  }

  for (const pkg of input.outdated) {
    const priority: Priority = pkg.severity === "major" ? "high" : "medium";
    const cmd = installCmd(input.packageManager, pkg.name, pkg.latest);
    actions.push({ priority, action: `upgrade ${pkg.name} from ${pkg.current} to ${pkg.latest} — run: ${cmd}` });
  }

  for (const dup of input.duplicates) {
    actions.push({ priority: "medium", action: dup.recommendation });
  }

  for (const script of input.missingScripts) {
    actions.push({ priority: "medium", action: `add missing \`${script}\` script to package.json` });
  }

  for (const script of input.suspiciousScripts) {
    actions.push({ priority: "medium", action: `replace placeholder \`${script}\` script with real implementation` });
  }

  for (const issue of input.licenseIssues) {
    actions.push({ priority: "high", action: issue });
  }

  return actions.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}
