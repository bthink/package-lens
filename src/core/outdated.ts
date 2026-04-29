import type { OutdatedPackage } from "../types/index.js";

type FetchFn = (url: string) => Promise<{ json: () => Promise<unknown> }>;

function compareSemver(
  current: string,
  latest: string,
): OutdatedPackage["severity"] | null {
  const parse = (v: string): [number, number, number] => {
    const [major = 0, minor = 0, patch = 0] = v.split(".").map(Number);
    return [major, minor, patch];
  };

  const [cMaj, cMin, cPat] = parse(current);
  const [lMaj, lMin, lPat] = parse(latest);

  if (lMaj > cMaj) return "major";
  if (lMaj === cMaj && lMin > cMin) return "minor";
  if (lMaj === cMaj && lMin === cMin && lPat > cPat) return "patch";
  return null;
}

export async function checkOutdated(
  deps: Record<string, string>,
  fetch: FetchFn = globalThis.fetch as unknown as FetchFn,
): Promise<OutdatedPackage[]> {
  const results = await Promise.all(
    Object.entries(deps).map(async ([name, current]) => {
      try {
        const encodedName = name.replace("/", "%2F");
        const res = await fetch(`https://registry.npmjs.org/${encodedName}/latest`);
        const data = (await res.json()) as { version?: string };
        const latest = data.version ?? current;
        const severity = compareSemver(current, latest);
        if (!severity) return null;
        return { name, current, latest, severity } satisfies OutdatedPackage;
      } catch {
        return null;
      }
    }),
  );

  return results.filter((r): r is OutdatedPackage => r !== null);
}
