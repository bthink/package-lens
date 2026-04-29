import { describe, it, expect } from "vitest";
import { checkVulnerabilities } from "../../src/core/vulnerabilities.js";

const makeOsvResponse = (vulns: Array<{ id: string; severity: string; summary: string }>): object => ({
  vulns: vulns.map((v) => ({
    id: v.id,
    summary: v.summary,
    database_specific: { severity: v.severity },
  })),
});

const mockPost =
  (responsesByPkg: Record<string, ReturnType<typeof makeOsvResponse>>) =>
  async (url: string, body: string): Promise<{ json: () => Promise<unknown> }> => {
    const parsed = JSON.parse(body) as { package?: { name?: string } };
    const name = parsed.package?.name ?? "";
    const response = responsesByPkg[name] ?? { vulns: [] };
    return { json: async () => response };
  };

describe("checkVulnerabilities", () => {
  it("returns empty array when no vulns found", async () => {
    const result = await checkVulnerabilities(
      { react: "18.2.0" },
      mockPost({ react: { vulns: [] } }),
    );
    expect(result).toHaveLength(0);
  });

  it("returns vulnerability with CVE id and severity", async () => {
    const result = await checkVulnerabilities(
      { "some-pkg": "1.0.0" },
      mockPost({
        "some-pkg": makeOsvResponse([
          { id: "CVE-2024-1234", severity: "HIGH", summary: "RCE via prototype pollution" },
        ]),
      }),
    );
    expect(result[0]).toMatchObject({
      name: "some-pkg",
      cveId: "CVE-2024-1234",
      severity: "high",
      summary: "RCE via prototype pollution",
    });
  });

  it("maps CRITICAL severity", async () => {
    const result = await checkVulnerabilities(
      { "bad-pkg": "1.0.0" },
      mockPost({
        "bad-pkg": makeOsvResponse([
          { id: "GHSA-xxxx-yyyy-zzzz", severity: "CRITICAL", summary: "bad" },
        ]),
      }),
    );
    expect(result[0]?.severity).toBe("critical");
  });

  it("skips package on network failure", async () => {
    const failPost = async (): Promise<never> => {
      throw new Error("network error");
    };
    const result = await checkVulnerabilities({ react: "18.2.0" }, failPost);
    expect(result).toHaveLength(0);
  });

  it("returns multiple vulns for one package", async () => {
    const result = await checkVulnerabilities(
      { "multi-vuln": "1.0.0" },
      mockPost({
        "multi-vuln": makeOsvResponse([
          { id: "CVE-2024-0001", severity: "HIGH", summary: "vuln 1" },
          { id: "CVE-2024-0002", severity: "MEDIUM", summary: "vuln 2" },
        ]),
      }),
    );
    expect(result).toHaveLength(2);
  });
});
