import type { BundleEntry } from "../types/index.js";

type FetchFn = (url: string) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

interface BundlephobiaResponse {
  gzip?: number;
  hasJSModule?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1000) return `${(bytes / 1000).toFixed(1)}kB`;
  return `${bytes}B`;
}

const HEAVY_THRESHOLD_BYTES = 50_000;

function makeRecommendation(name: string, gzip: number, treeshakeable: boolean): string | null {
  if (!treeshakeable && gzip > HEAVY_THRESHOLD_BYTES) {
    return `consider ${name}-es or cherry-picking specific imports to reduce bundle size`;
  }
  return null;
}

const defaultFetch: FetchFn = async (url) => {
  const res = await (globalThis.fetch as typeof fetch)(url);
  return { ok: res.ok, json: () => res.json() as Promise<unknown> };
};

export async function getBundleImpact(
  deps: Record<string, string>,
  fetch: FetchFn = defaultFetch,
  topN = 10,
): Promise<BundleEntry[]> {
  const entries = await Promise.all(
    Object.entries(deps).map(async ([name, version]) => {
      try {
        // encode only `/` in scoped packages; leave `@` literal so URLs stay readable and testable
        const pkgStr = `${name}@${version}`.replace(/\//g, "%2F");
        const url = `https://bundlephobia.com/api/size?package=${pkgStr}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = (await res.json()) as BundlephobiaResponse;
        const gzip = data.gzip ?? 0;
        const treeshakeable = data.hasJSModule ?? false;
        return {
          name,
          sizeGzip: formatBytes(gzip),
          treeshakeable,
          recommendation: makeRecommendation(name, gzip, treeshakeable),
          _sortKey: gzip,
        };
      } catch {
        return null;
      }
    }),
  );

  return entries
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .sort((a, b) => b._sortKey - a._sortKey)
    .slice(0, topN)
    .map(({ _sortKey: _, ...rest }) => rest);
}
