import type { Vulnerability, Severity } from "../types/index.js";

type PostFn = (url: string, body: string) => Promise<{ json: () => Promise<unknown> }>;

interface OsvVuln {
  id: string;
  summary?: string;
  database_specific?: { severity?: string };
}

interface OsvResponse {
  vulns?: OsvVuln[];
}

const SEVERITY_MAP: Record<string, Severity> = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

function normalizeSeverity(raw: string | undefined): Severity {
  return SEVERITY_MAP[raw?.toUpperCase() ?? ""] ?? "low";
}

const OSV_URL = "https://api.osv.dev/v1/query";

const defaultPost: PostFn = async (url, body) => {
  const res = await (globalThis.fetch as typeof fetch)(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  return { json: () => res.json() as Promise<unknown> };
};

export async function checkVulnerabilities(
  deps: Record<string, string>,
  post: PostFn = defaultPost,
): Promise<Vulnerability[]> {
  const results = await Promise.all(
    Object.entries(deps).map(async ([name, version]) => {
      try {
        const body = JSON.stringify({
          version,
          package: { name, ecosystem: "npm" },
        });
        const res = await post(OSV_URL, body);
        const data = (await res.json()) as OsvResponse;
        return (data.vulns ?? []).map(
          (v): Vulnerability => ({
            name,
            severity: normalizeSeverity(v.database_specific?.severity),
            cveId: v.id,
            summary: v.summary ?? "",
          }),
        );
      } catch {
        return [];
      }
    }),
  );

  return results.flat();
}
