import type { LicenseAudit } from "../types/index.js";

const RESTRICTED_LICENSES = ["GPL-2.0", "GPL-3.0", "AGPL-3.0", "AGPL-1.0", "LGPL-2.1", "LGPL-3.0"];

export function auditLicenses(
  prodLicenses: Record<string, string>,
  devLicenses: Record<string, string>,
): LicenseAudit {
  const allLicenses = [
    ...Object.values(prodLicenses),
    ...Object.values(devLicenses),
  ];
  const unique = [...new Set(allLicenses)].sort();

  const issues: string[] = [];
  for (const [pkg, license] of Object.entries(prodLicenses)) {
    if (RESTRICTED_LICENSES.some((r) => license.includes(r))) {
      issues.push(`${pkg} uses ${license} — incompatible with commercial/proprietary use`);
    }
  }

  return { unique, issues };
}
