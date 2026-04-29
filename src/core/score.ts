const DEDUCTIONS = {
  outdated: { major: 10, minor: 3, patch: 1 },
  vulnerability: { critical: 15, high: 10, medium: 5, low: 1 },
  missingScript: 5,
  duplicateGroup: 5,
} as const;

interface ScoreInput {
  outdated: Array<{ severity: "major" | "minor" | "patch" }>;
  vulnerabilities: Array<{ severity: "critical" | "high" | "medium" | "low" }>;
  missingScripts: string[];
  duplicates: number;
}

export function computeScore(input: ScoreInput): number {
  let score = 100;

  for (const o of input.outdated) {
    score -= DEDUCTIONS.outdated[o.severity];
  }
  for (const v of input.vulnerabilities) {
    score -= DEDUCTIONS.vulnerability[v.severity];
  }
  score -= input.missingScripts.length * DEDUCTIONS.missingScript;
  score -= input.duplicates * DEDUCTIONS.duplicateGroup;

  return Math.max(0, score);
}
