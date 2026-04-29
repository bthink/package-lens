import { parsePackageJson } from "./parser.js";
import { detectStack } from "./stack.js";
import { checkOutdated } from "./outdated.js";
import { checkVulnerabilities } from "./vulnerabilities.js";
import { detectDuplicates } from "./duplicates.js";
import { getBundleImpact } from "./bundle.js";
import { auditScripts } from "./scripts.js";
import { auditLicenses } from "./licenses.js";
import { computeScore } from "./score.js";
import { generateActions } from "./actions.js";
import type { AnalysisResult } from "../types/index.js";

export async function analyze(packageJsonPath: string): Promise<AnalysisResult> {
  const pkg = await parsePackageJson(packageJsonPath);

  const [outdated, vulnerabilities, bundleImpact] = await Promise.all([
    checkOutdated(pkg.allDeps),
    checkVulnerabilities(pkg.dependencies),
    getBundleImpact(pkg.allDeps),
  ]);

  const stack = detectStack(pkg.allDeps);
  const duplicates = detectDuplicates(pkg.allDeps);
  const scripts = auditScripts(pkg.scripts);

  // licenses: for now use the license field from package.json itself;
  // per-dep license fetching is a post-MVP enhancement
  const prodLicenses = pkg.license ? { [pkg.name]: pkg.license } : {};
  const licenses = auditLicenses(prodLicenses, {});

  const score = computeScore({
    outdated,
    vulnerabilities,
    missingScripts: scripts.missing,
    duplicates: duplicates.length,
  });

  const actions = generateActions({
    outdated,
    vulnerabilities,
    duplicates,
    missingScripts: scripts.missing,
    suspiciousScripts: scripts.suspicious,
    licenseIssues: licenses.issues,
  });

  return {
    meta: {
      name: pkg.name,
      version: pkg.version,
      packageManager: pkg.packageManager,
      analyzedAt: new Date().toISOString(),
    },
    stack,
    health: { score, outdated, vulnerabilities, duplicates },
    bundleImpact,
    scripts,
    licenses,
    actions,
  };
}
