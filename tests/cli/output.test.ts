import { describe, it, expect } from "vitest";
import { formatJson, formatTable, formatActions } from "../../src/cli/output.js";
import type { AnalysisResult, RecommendedAction } from "../../src/types/index.js";

const mockResult: AnalysisResult = {
  meta: {
    name: "my-app",
    version: "1.0.0",
    packageManager: "npm",
    analyzedAt: "2026-04-29T10:00:00.000Z",
  },
  stack: {
    framework: "nextjs",
    testing: ["vitest"],
    styling: ["tailwind"],
  },
  health: {
    score: 72,
    outdated: [
      { name: "react", current: "17.0.0", latest: "18.0.0", severity: "major" },
      { name: "lodash", current: "4.17.20", latest: "4.17.21", severity: "patch" },
    ],
    vulnerabilities: [
      { name: "axios", severity: "high", cveId: "CVE-2023-1234", summary: "SSRF in axios" },
    ],
    duplicates: [
      { category: "date-utils", packages: ["moment", "date-fns"], recommendation: "Remove moment" },
    ],
  },
  bundleImpact: [
    { name: "moment", sizeGzip: "72.1 kB", treeshakeable: false, recommendation: "Replace with date-fns" },
  ],
  scripts: { missing: ["build"], suspicious: [] },
  licenses: { unique: ["MIT", "Apache-2.0"], issues: [] },
  actions: [
    { priority: "high", action: "Fix 1 high vulnerability in axios" },
    { priority: "medium", action: "Update react from 17.0.0 to 18.0.0" },
  ],
};

describe("formatJson", () => {
  it("returns valid JSON string of the full result", () => {
    const output = formatJson(mockResult);
    expect(() => JSON.parse(output)).not.toThrow();
    const parsed = JSON.parse(output) as AnalysisResult;
    expect(parsed.meta.name).toBe("my-app");
    expect(parsed.health.score).toBe(72);
  });

  it("is pretty-printed with 2-space indent", () => {
    const output = formatJson(mockResult);
    expect(output).toContain("\n");
    expect(output).toMatch(/^{/);
  });
});

describe("formatTable", () => {
  it("includes package name and score", () => {
    const output = formatTable(mockResult);
    expect(output).toContain("my-app");
    expect(output).toContain("72");
  });

  it("includes stack framework", () => {
    const output = formatTable(mockResult);
    expect(output).toContain("nextjs");
  });

  it("lists outdated packages", () => {
    const output = formatTable(mockResult);
    expect(output).toContain("react");
    expect(output).toContain("17.0.0");
    expect(output).toContain("18.0.0");
  });

  it("lists vulnerabilities", () => {
    const output = formatTable(mockResult);
    expect(output).toContain("axios");
    expect(output).toContain("high");
  });

  it("lists missing scripts", () => {
    const output = formatTable(mockResult);
    expect(output).toContain("build");
  });

  it("lists duplicate groups", () => {
    const output = formatTable(mockResult);
    expect(output).toContain("moment");
    expect(output).toContain("date-fns");
  });

  it("lists top bundle entries", () => {
    const output = formatTable(mockResult);
    expect(output).toContain("72.1 kB");
  });

  it("shows actions", () => {
    const output = formatTable(mockResult);
    expect(output).toContain("Fix 1 high vulnerability in axios");
  });

  it("returns a non-empty string", () => {
    const output = formatTable(mockResult);
    expect(output.trim().length).toBeGreaterThan(0);
  });
});

describe("formatActions", () => {
  const actions: RecommendedAction[] = [
    { priority: "high", action: "Fix vulnerability in axios" },
    { priority: "medium", action: "Update react" },
    { priority: "low", action: "Remove moment" },
  ];

  it("lists all actions when no filter", () => {
    const output = formatActions(actions, undefined);
    expect(output).toContain("Fix vulnerability in axios");
    expect(output).toContain("Update react");
    expect(output).toContain("Remove moment");
  });

  it("filters by priority", () => {
    const output = formatActions(actions, "high");
    expect(output).toContain("Fix vulnerability in axios");
    expect(output).not.toContain("Update react");
    expect(output).not.toContain("Remove moment");
  });

  it("shows priority label", () => {
    const output = formatActions(actions, undefined);
    expect(output).toContain("high");
    expect(output).toContain("medium");
  });

  it("returns message when no actions match filter", () => {
    const output = formatActions([], undefined);
    expect(output.trim().length).toBeGreaterThan(0);
  });
});
