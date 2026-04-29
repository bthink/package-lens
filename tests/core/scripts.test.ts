import { describe, it, expect } from "vitest";
import { auditScripts } from "../../src/core/scripts.js";

describe("auditScripts", () => {
  it("reports no missing scripts when all standard scripts present", () => {
    const result = auditScripts({ build: "tsc", test: "vitest run", lint: "eslint .", dev: "tsx" });
    expect(result.missing).toHaveLength(0);
  });

  it("reports missing build script", () => {
    const result = auditScripts({ test: "vitest run" });
    expect(result.missing).toContain("build");
  });

  it("reports missing test script", () => {
    const result = auditScripts({ build: "tsc" });
    expect(result.missing).toContain("test");
  });

  it("detects echo placeholder test script as suspicious", () => {
    const result = auditScripts({ test: 'echo "no tests yet"', build: "tsc" });
    expect(result.suspicious).toContain("test");
  });

  it("detects exit 0 placeholder as suspicious", () => {
    const result = auditScripts({ test: "exit 0", build: "tsc" });
    expect(result.suspicious).toContain("test");
  });

  it("does not flag real test script as suspicious", () => {
    const result = auditScripts({ test: "vitest run", build: "tsc" });
    expect(result.suspicious).not.toContain("test");
  });

  it("returns empty missing and suspicious for empty scripts", () => {
    const result = auditScripts({});
    expect(result.missing).toContain("build");
    expect(result.missing).toContain("test");
    expect(result.suspicious).toHaveLength(0);
  });
});
