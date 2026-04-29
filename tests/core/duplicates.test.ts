import { describe, it, expect } from "vitest";
import { detectDuplicates } from "../../src/core/duplicates.js";

describe("detectDuplicates", () => {
  it("detects moment + date-fns as duplicate date utils", () => {
    const result = detectDuplicates({ moment: "2.29.4", "date-fns": "3.6.0" });
    expect(result).toHaveLength(1);
    expect(result[0]?.category).toBe("date-utils");
    expect(result[0]?.packages).toContain("moment");
    expect(result[0]?.packages).toContain("date-fns");
  });

  it("detects lodash + ramda as duplicate utility libs", () => {
    const result = detectDuplicates({ lodash: "4.17.21", ramda: "0.29.0" });
    expect(result).toHaveLength(1);
    expect(result[0]?.category).toBe("utility");
  });

  it("detects axios + ky as duplicate http clients", () => {
    const result = detectDuplicates({ axios: "1.6.0", ky: "1.0.0" });
    expect(result).toHaveLength(1);
    expect(result[0]?.category).toBe("http-client");
  });

  it("returns empty when no duplicates", () => {
    const result = detectDuplicates({ react: "18.2.0", next: "14.0.0" });
    expect(result).toHaveLength(0);
  });

  it("does not flag a single member of a known group", () => {
    const result = detectDuplicates({ moment: "2.29.4" });
    expect(result).toHaveLength(0);
  });

  it("detects multiple duplicate groups at once (express fixture)", () => {
    const result = detectDuplicates({
      lodash: "4.17.21",
      ramda: "0.29.0",
      moment: "2.29.4",
      "date-fns": "3.6.0",
    });
    expect(result).toHaveLength(2);
  });

  it("includes a recommendation string", () => {
    const result = detectDuplicates({ moment: "2.29.4", "date-fns": "3.6.0" });
    expect(typeof result[0]?.recommendation).toBe("string");
    expect(result[0]?.recommendation.length).toBeGreaterThan(0);
  });
});
