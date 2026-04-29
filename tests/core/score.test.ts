import { describe, it, expect } from "vitest";
import { computeScore } from "../../src/core/score.js";

const base = {
  outdated: [],
  vulnerabilities: [],
  missingScripts: [],
  duplicates: 0,
};

describe("computeScore", () => {
  it("returns 100 for a perfect project", () => {
    expect(computeScore(base)).toBe(100);
  });

  it("deducts 10 per outdated major", () => {
    const score = computeScore({
      ...base,
      outdated: [{ severity: "major" }, { severity: "major" }],
    });
    expect(score).toBe(80);
  });

  it("deducts 3 per outdated minor", () => {
    const score = computeScore({ ...base, outdated: [{ severity: "minor" }] });
    expect(score).toBe(97);
  });

  it("deducts 1 per outdated patch", () => {
    const score = computeScore({ ...base, outdated: [{ severity: "patch" }] });
    expect(score).toBe(99);
  });

  it("deducts 15 per critical vulnerability", () => {
    const score = computeScore({
      ...base,
      vulnerabilities: [{ severity: "critical" }],
    });
    expect(score).toBe(85);
  });

  it("deducts 10 per high vulnerability", () => {
    const score = computeScore({
      ...base,
      vulnerabilities: [{ severity: "high" }],
    });
    expect(score).toBe(90);
  });

  it("deducts 5 per missing standard script", () => {
    const score = computeScore({ ...base, missingScripts: ["build", "test"] });
    expect(score).toBe(90);
  });

  it("deducts 5 per duplicate group", () => {
    const score = computeScore({ ...base, duplicates: 2 });
    expect(score).toBe(90);
  });

  it("never goes below 0", () => {
    const score = computeScore({
      outdated: Array.from({ length: 20 }, () => ({ severity: "major" as const })),
      vulnerabilities: Array.from({ length: 10 }, () => ({ severity: "critical" as const })),
      missingScripts: ["build", "test", "lint", "dev"],
      duplicates: 10,
    });
    expect(score).toBe(0);
  });
});
