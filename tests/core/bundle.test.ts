import { describe, it, expect } from "vitest";
import { getBundleImpact } from "../../src/core/bundle.js";

const mockFetch =
  (responsesByPkg: Record<string, { gzip: number; hasJSModule: boolean }>) =>
  async (url: string): Promise<{ ok: boolean; json: () => Promise<unknown> }> => {
    const match = Object.entries(responsesByPkg).find(([pkg]) => url.includes(pkg));
    if (!match) return { ok: false, json: async () => ({}) };
    const [, data] = match;
    return { ok: true, json: async () => data };
  };

describe("getBundleImpact", () => {
  it("returns top packages sorted by gzip size descending", async () => {
    const result = await getBundleImpact(
      { lodash: "4.17.21", react: "18.2.0" },
      mockFetch({
        "lodash@4.17.21": { gzip: 71000, hasJSModule: false },
        "react@18.2.0": { gzip: 6000, hasJSModule: true },
      }),
    );
    expect(result[0]?.name).toBe("lodash");
    expect(result[1]?.name).toBe("react");
  });

  it("marks non-tree-shakeable packages", async () => {
    const result = await getBundleImpact(
      { lodash: "4.17.21" },
      mockFetch({ "lodash@4.17.21": { gzip: 71000, hasJSModule: false } }),
    );
    expect(result[0]?.treeshakeable).toBe(false);
  });

  it("marks tree-shakeable packages", async () => {
    const result = await getBundleImpact(
      { react: "18.2.0" },
      mockFetch({ "react@18.2.0": { gzip: 6000, hasJSModule: true } }),
    );
    expect(result[0]?.treeshakeable).toBe(true);
  });

  it("formats size as human-readable string", async () => {
    const result = await getBundleImpact(
      { lodash: "4.17.21" },
      mockFetch({ "lodash@4.17.21": { gzip: 71000, hasJSModule: false } }),
    );
    expect(result[0]?.sizeGzip).toMatch(/kB|B/);
  });

  it("skips packages that fail bundlephobia fetch", async () => {
    const failFetch = async (): Promise<{ ok: boolean; json: () => Promise<unknown> }> => ({
      ok: false,
      json: async () => ({}),
    });
    const result = await getBundleImpact({ lodash: "4.17.21" }, failFetch);
    expect(result).toHaveLength(0);
  });

  it("limits results to top N (default 10)", async () => {
    const deps = Object.fromEntries(
      Array.from({ length: 15 }, (_, i) => [`pkg-${i}`, "1.0.0"]),
    );
    const responses = Object.fromEntries(
      Array.from({ length: 15 }, (_, i) => [`pkg-${i}@1.0.0`, { gzip: i * 1000, hasJSModule: false }]),
    );
    const result = await getBundleImpact(deps, mockFetch(responses));
    expect(result.length).toBeLessThanOrEqual(10);
  });
});
