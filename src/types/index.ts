export type Severity = "low" | "medium" | "high" | "critical";
export type Priority = "low" | "medium" | "high";

export interface PackageMeta {
  name: string;
  version: string;
  packageManager: "npm" | "pnpm" | "yarn" | "unknown";
  analyzedAt: string;
}

export interface StackFingerprint {
  framework: string | null;
  testing: string[];
  styling: string[];
}

export interface OutdatedPackage {
  name: string;
  current: string;
  latest: string;
  severity: "major" | "minor" | "patch";
}

export interface Vulnerability {
  name: string;
  severity: Severity;
  cveId: string;
  summary: string;
}

export interface DuplicateGroup {
  category: string;
  packages: string[];
  recommendation: string;
}

export interface BundleEntry {
  name: string;
  sizeGzip: string;
  treeshakeable: boolean;
  recommendation: string | null;
}

export interface ScriptsAudit {
  missing: string[];
  suspicious: string[];
}

export interface LicenseAudit {
  unique: string[];
  issues: string[];
}

export interface RecommendedAction {
  priority: Priority;
  action: string;
}

export interface AnalysisResult {
  meta: PackageMeta;
  stack: StackFingerprint;
  health: {
    score: number;
    outdated: OutdatedPackage[];
    vulnerabilities: Vulnerability[];
    duplicates: DuplicateGroup[];
  };
  bundleImpact: BundleEntry[];
  scripts: ScriptsAudit;
  licenses: LicenseAudit;
  actions: RecommendedAction[];
}
