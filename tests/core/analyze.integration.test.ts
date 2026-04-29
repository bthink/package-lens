import { describe, it, expect } from "vitest";
import { analyze } from "../../src/core/analyze.js";
import { resolve } from "node:path";

const FIXTURES = resolve(import.meta.dirname, "../../fixtures");

// These tests run analyze() with real sub-functions but no real network calls
// (network calls silently fallback to empty arrays on failure in CI)

describe("analyze() integration", () => {
  it("returns valid AnalysisResult shape for nextjs fixture", async () => {
    const result = await analyze(`${FIXTURES}/nextjs/package.json`);

    expect(result.meta.name).toBe("fixture-nextjs");
    expect(result.meta.packageManager).toBe("unknown");
    expect(result.meta.analyzedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    expect(result.stack.framework).toBe("nextjs");
    expect(result.stack.testing).toContain("vitest");
    expect(result.stack.styling).toContain("tailwind");

    expect(result.health.score).toBeGreaterThanOrEqual(0);
    expect(result.health.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(result.health.outdated)).toBe(true);
    expect(Array.isArray(result.health.vulnerabilities)).toBe(true);

    // nextjs fixture has moment + date-fns → duplicate detected
    expect(result.health.duplicates.length).toBeGreaterThan(0);

    expect(Array.isArray(result.bundleImpact)).toBe(true);
    expect(Array.isArray(result.actions)).toBe(true);
  });

  it("detects missing build script in express fixture", async () => {
    const result = await analyze(`${FIXTURES}/express/package.json`);
    expect(result.scripts.missing).toContain("build");
  });

  it("detects suspicious placeholder test in express fixture", async () => {
    const result = await analyze(`${FIXTURES}/express/package.json`);
    expect(result.scripts.suspicious).toContain("test");
  });

  it("detects lodash+ramda duplicate in express fixture", async () => {
    const result = await analyze(`${FIXTURES}/express/package.json`);
    const utilDup = result.health.duplicates.find((d) => d.category === "utility");
    expect(utilDup).toBeDefined();
  });

  it("result serializes to valid JSON", async () => {
    const result = await analyze(`${FIXTURES}/vite/package.json`);
    const json = JSON.stringify(result);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
