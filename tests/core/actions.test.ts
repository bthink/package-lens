import { describe, it, expect } from "vitest";
import { generateActions } from "../../src/core/actions.js";

describe("generateActions", () => {
  it("returns empty when nothing to fix", () => {
    const result = generateActions({
      outdated: [],
      vulnerabilities: [],
      duplicates: [],
      missingScripts: [],
      suspiciousScripts: [],
      licenseIssues: [],
    });
    expect(result).toHaveLength(0);
  });

  it("generates high-priority action for critical vulnerability", () => {
    const result = generateActions({
      outdated: [],
      vulnerabilities: [{ name: "bad-pkg", severity: "critical", cveId: "CVE-2024-1234", summary: "RCE" }],
      duplicates: [],
      missingScripts: [],
      suspiciousScripts: [],
      licenseIssues: [],
    });
    expect(result[0]?.priority).toBe("high");
    expect(result[0]?.action).toMatch(/bad-pkg/);
  });

  it("generates high-priority action for outdated major", () => {
    const result = generateActions({
      outdated: [{ name: "react", current: "17.0.0", latest: "18.2.0", severity: "major" }],
      vulnerabilities: [],
      duplicates: [],
      missingScripts: [],
      suspiciousScripts: [],
      licenseIssues: [],
    });
    expect(result[0]?.priority).toBe("high");
    expect(result[0]?.action).toMatch(/react/);
  });

  it("generates medium-priority action for duplicate group", () => {
    const result = generateActions({
      outdated: [],
      vulnerabilities: [],
      duplicates: [{ category: "date-utils", packages: ["moment", "date-fns"], recommendation: "remove moment" }],
      missingScripts: [],
      suspiciousScripts: [],
      licenseIssues: [],
    });
    expect(result[0]?.priority).toBe("medium");
    expect(result[0]?.action).toMatch(/moment|date-fns/);
  });

  it("generates medium-priority action for missing test script", () => {
    const result = generateActions({
      outdated: [],
      vulnerabilities: [],
      duplicates: [],
      missingScripts: ["test"],
      suspiciousScripts: [],
      licenseIssues: [],
    });
    expect(result[0]?.priority).toBe("medium");
    expect(result[0]?.action).toMatch(/test/);
  });

  it("sorts actions: high before medium", () => {
    const result = generateActions({
      outdated: [{ name: "react", current: "17.0.0", latest: "18.2.0", severity: "major" }],
      vulnerabilities: [],
      duplicates: [{ category: "date-utils", packages: ["moment", "date-fns"], recommendation: "remove moment" }],
      missingScripts: [],
      suspiciousScripts: [],
      licenseIssues: [],
    });
    expect(result[0]?.priority).toBe("high");
    expect(result[result.length - 1]?.priority).toBe("medium");
  });
});
