import { describe, it, expect } from "vitest";
import { parsePackageJson } from "../../src/core/parser.js";
import { resolve } from "node:path";

const FIXTURES = resolve(import.meta.dirname, "../../fixtures");

describe("parsePackageJson", () => {
  it("reads name and version", async () => {
    const result = await parsePackageJson(`${FIXTURES}/nextjs/package.json`);
    expect(result.name).toBe("fixture-nextjs");
    expect(result.version).toBe("1.0.0");
  });

  it("merges dependencies and devDependencies into allDeps", async () => {
    const result = await parsePackageJson(`${FIXTURES}/nextjs/package.json`);
    expect(result.allDeps["next"]).toBe("14.2.0");
    expect(result.allDeps["vitest"]).toBe("1.6.0");
  });

  it("keeps production deps separate", async () => {
    const result = await parsePackageJson(`${FIXTURES}/nextjs/package.json`);
    expect(result.dependencies["react"]).toBe("18.2.0");
    expect(result.devDependencies["typescript"]).toBe("5.4.0");
  });

  it("strips semver range prefixes from allDeps", async () => {
    const result = await parsePackageJson(`${FIXTURES}/nextjs/package.json`);
    // all values should be clean versions without ^ or ~
    for (const v of Object.values(result.allDeps)) {
      expect(v).not.toMatch(/^[\^~]/);
    }
  });

  it("detects npm package manager when package-lock.json exists", async () => {
    // fixtures have no lockfile → unknown
    const result = await parsePackageJson(`${FIXTURES}/nextjs/package.json`);
    expect(result.packageManager).toBe("unknown");
  });

  it("collects scripts", async () => {
    const result = await parsePackageJson(`${FIXTURES}/nextjs/package.json`);
    expect(result.scripts["build"]).toBe("next build");
    expect(result.scripts["lint"]).toBe("next lint");
  });

  it("reads license field", async () => {
    const result = await parsePackageJson(`${FIXTURES}/vite/package.json`);
    expect(result.license).toBeUndefined();
  });

  it("throws on non-existent path", async () => {
    await expect(parsePackageJson("/no/such/file.json")).rejects.toThrow();
  });
});
