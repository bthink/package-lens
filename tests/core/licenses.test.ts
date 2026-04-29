import { describe, it, expect } from "vitest";
import { auditLicenses } from "../../src/core/licenses.js";

describe("auditLicenses", () => {
  it("returns unique licenses from production dependencies", () => {
    const result = auditLicenses(
      { react: "MIT", express: "MIT", lodash: "MIT" },
      {},
    );
    expect(result.unique).toEqual(["MIT"]);
  });

  it("deduplicates licenses", () => {
    const result = auditLicenses({ react: "MIT", express: "ISC" }, {});
    expect(result.unique).toHaveLength(2);
    expect(result.unique).toContain("MIT");
    expect(result.unique).toContain("ISC");
  });

  it("flags GPL-3.0 in production deps as issue", () => {
    const result = auditLicenses({ "some-gpl-pkg": "GPL-3.0" }, {});
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0]).toMatch(/GPL/);
  });

  it("flags AGPL in production deps as issue", () => {
    const result = auditLicenses({ "agpl-pkg": "AGPL-3.0" }, {});
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("does not flag GPL in devDependencies", () => {
    const result = auditLicenses({}, { "gpl-dev-tool": "GPL-3.0" });
    expect(result.issues).toHaveLength(0);
  });

  it("does not flag MIT, ISC, Apache-2.0", () => {
    const result = auditLicenses(
      { a: "MIT", b: "ISC", c: "Apache-2.0" },
      {},
    );
    expect(result.issues).toHaveLength(0);
  });

  it("handles missing license field gracefully", () => {
    const result = auditLicenses({ "no-license-pkg": "UNKNOWN" }, {});
    expect(result.unique).toContain("UNKNOWN");
  });
});
