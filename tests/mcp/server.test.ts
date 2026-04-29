import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { resolve } from "node:path";
import type { AnalysisResult } from "../../src/types/index.js";

const FIXTURE = resolve(import.meta.dirname, "../../fixtures/nextjs/package.json");

// Deterministic stub for analyze()
const stubResult: AnalysisResult = {
  meta: { name: "fixture-nextjs", version: "1.0.0", packageManager: "unknown", analyzedAt: "2024-01-01T00:00:00.000Z" },
  stack: { framework: "nextjs", testing: ["vitest"], styling: ["tailwind"] },
  health: {
    score: 80,
    outdated: [{ name: "lodash", current: "4.17.21", latest: "4.17.22", severity: "patch" }],
    vulnerabilities: [{ name: "lodash", severity: "high", cveId: "CVE-2021-1234", summary: "Prototype pollution" }],
    duplicates: [],
  },
  bundleImpact: [{ name: "lodash", sizeGzip: "25 kB", treeshakeable: false, recommendation: "Use lodash-es" }],
  scripts: { missing: ["test"], suspicious: [] },
  licenses: { unique: ["MIT"], issues: [] },
  actions: [
    { priority: "high", action: "Update lodash" },
    { priority: "low", action: "Add test script" },
  ],
};

vi.mock("../../src/core/analyze.js", () => ({
  analyze: vi.fn().mockResolvedValue(stubResult),
}));

async function createTestClient(): Promise<Client> {
  // Import the server factory after mocks are set up
  const { createServer } = await import("../../src/mcp/index.js");
  const server = createServer();
  const client = new Client({ name: "test-client", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

describe("MCP server tools", () => {
  let client: Client;

  beforeEach(async () => {
    client = await createTestClient();
  });

  afterEach(async () => {
    await client.close();
  });

  it("lists all 6 tools", async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);
    expect(tools).toHaveLength(6);
    expect(names).toContain("analyze_package");
    expect(names).toContain("get_outdated");
    expect(names).toContain("get_vulnerabilities");
    expect(names).toContain("get_stack");
    expect(names).toContain("get_actions");
    expect(names).toContain("get_bundle_impact");
  });

  it("analyze_package returns JSON with meta, stack, health, actions", async () => {
    const result = await client.callTool({ name: "analyze_package", arguments: { path: FIXTURE } });
    expect(result.isError).toBeFalsy();
    const content = result.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(content[0].text) as AnalysisResult;
    expect(parsed.meta).toBeDefined();
    expect(parsed.stack).toBeDefined();
    expect(parsed.health).toBeDefined();
    expect(parsed.actions).toBeDefined();
  });

  it("get_outdated returns JSON array of OutdatedPackage[]", async () => {
    const result = await client.callTool({ name: "get_outdated", arguments: { path: FIXTURE } });
    expect(result.isError).toBeFalsy();
    const content = result.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(content[0].text) as unknown[];
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]).toMatchObject({ name: "lodash", current: "4.17.21", latest: "4.17.22", severity: "patch" });
  });

  it("get_vulnerabilities returns JSON array of Vulnerability[]", async () => {
    const result = await client.callTool({ name: "get_vulnerabilities", arguments: { path: FIXTURE } });
    expect(result.isError).toBeFalsy();
    const content = result.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(content[0].text) as unknown[];
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]).toMatchObject({ name: "lodash", severity: "high", cveId: "CVE-2021-1234" });
  });

  it("get_stack returns JSON of StackFingerprint", async () => {
    const result = await client.callTool({ name: "get_stack", arguments: { path: FIXTURE } });
    expect(result.isError).toBeFalsy();
    const content = result.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(content[0].text) as { framework: string; testing: string[]; styling: string[] };
    expect(parsed.framework).toBe("nextjs");
    expect(parsed.testing).toContain("vitest");
    expect(parsed.styling).toContain("tailwind");
  });

  it("get_actions returns JSON array of all actions", async () => {
    const result = await client.callTool({ name: "get_actions", arguments: { path: FIXTURE } });
    expect(result.isError).toBeFalsy();
    const content = result.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(content[0].text) as Array<{ priority: string; action: string }>;
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
  });

  it("get_actions with priority filter returns only matching actions", async () => {
    const result = await client.callTool({ name: "get_actions", arguments: { path: FIXTURE, priority: "high" } });
    expect(result.isError).toBeFalsy();
    const content = result.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(content[0].text) as Array<{ priority: string; action: string }>;
    expect(parsed.every((a) => a.priority === "high")).toBe(true);
    expect(parsed.length).toBe(1);
  });

  it("get_bundle_impact returns JSON array of BundleEntry[]", async () => {
    const result = await client.callTool({ name: "get_bundle_impact", arguments: { path: FIXTURE } });
    expect(result.isError).toBeFalsy();
    const content = result.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(content[0].text) as unknown[];
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]).toMatchObject({ name: "lodash", sizeGzip: "25 kB" });
  });

  it("returns error when path is missing", async () => {
    const result = await client.callTool({ name: "analyze_package", arguments: {} });
    expect(result.isError).toBe(true);
  });

  it("returns isError when analyze throws", async () => {
    const { analyze } = await import("../../src/core/analyze.js");
    vi.mocked(analyze).mockRejectedValueOnce(new Error("ENOENT: file not found"));
    const result = await client.callTool({ name: "analyze_package", arguments: { path: "/nonexistent/package.json" } });
    expect(result.isError).toBe(true);
    const content = result.content as Array<{ type: string; text: string }>;
    expect(content[0].text).toContain("ENOENT");
  });
});
