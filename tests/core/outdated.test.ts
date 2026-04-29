import { describe, it, expect } from "vitest";
import { checkOutdated } from "../../src/core/outdated.js";

const mockFetch = (latestByPkg: Record<string, string>) =>
  async (url: string): Promise<{ json: () => Promise<unknown> }> => {
    const pkg = url.split("/").at(-2);
    const latest = pkg ? latestByPkg[pkg] : undefined;
    if (!latest) throw new Error(`mock: no entry for ${url}`);
    return { json: async () => ({ version: latest }) };
  };

describe("checkOutdated", () => {
  it("returns empty array when all deps are up to date", async () => {
    const result = await checkOutdated(
      { react: "18.2.0" },
      mockFetch({ react: "18.2.0" }),
    );
    expect(result).toHaveLength(0);
  });

  it("classifies major version bump", async () => {
    const result = await checkOutdated(
      { react: "17.0.0" },
      mockFetch({ react: "18.2.0" }),
    );
    expect(result[0]).toMatchObject({ name: "react", current: "17.0.0", latest: "18.2.0", severity: "major" });
  });

  it("classifies minor version bump", async () => {
    const result = await checkOutdated(
      { react: "18.1.0" },
      mockFetch({ react: "18.2.0" }),
    );
    expect(result[0]).toMatchObject({ name: "react", current: "18.1.0", latest: "18.2.0", severity: "minor" });
  });

  it("classifies patch version bump", async () => {
    const result = await checkOutdated(
      { react: "18.2.0" },
      mockFetch({ react: "18.2.1" }),
    );
    expect(result[0]).toMatchObject({ severity: "patch" });
  });

  it("skips package when registry fetch fails", async () => {
    const failFetch = async (_url: string): Promise<never> => {
      throw new Error("network error");
    };
    const result = await checkOutdated({ react: "18.2.0" }, failFetch);
    expect(result).toHaveLength(0);
  });

  it("checks multiple deps", async () => {
    const result = await checkOutdated(
      { react: "17.0.0", lodash: "3.0.0" },
      mockFetch({ react: "18.2.0", lodash: "4.17.21" }),
    );
    expect(result).toHaveLength(2);
  });
});
