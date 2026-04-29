import { readFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";

export interface ParsedPackage {
  name: string;
  version: string;
  license: string | undefined;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  allDeps: Record<string, string>;
  packageManager: "npm" | "pnpm" | "yarn" | "unknown";
}

function stripRange(version: string): string {
  return version.replace(/^[\^~>=<]+/, "").trim();
}

async function fileExists(path: string): Promise<boolean> {
  return access(path).then(
    () => true,
    () => false,
  );
}

async function detectPackageManager(dir: string): Promise<ParsedPackage["packageManager"]> {
  if (await fileExists(join(dir, "pnpm-lock.yaml"))) return "pnpm";
  if (await fileExists(join(dir, "yarn.lock"))) return "yarn";
  if (await fileExists(join(dir, "package-lock.json"))) return "npm";
  return "unknown";
}

export async function parsePackageJson(path: string): Promise<ParsedPackage> {
  const raw = await readFile(path, "utf-8");
  const pkg = JSON.parse(raw) as Record<string, unknown>;

  const dependencies = stripRanges(pkg["dependencies"]);
  const devDependencies = stripRanges(pkg["devDependencies"]);
  const peerDependencies = stripRanges(pkg["peerDependencies"]);

  const allDeps = { ...dependencies, ...devDependencies, ...peerDependencies };

  const packageManager = await detectPackageManager(dirname(path));

  return {
    name: typeof pkg["name"] === "string" ? pkg["name"] : "",
    version: typeof pkg["version"] === "string" ? pkg["version"] : "0.0.0",
    license: typeof pkg["license"] === "string" ? pkg["license"] : undefined,
    scripts: asStringRecord(pkg["scripts"]),
    dependencies,
    devDependencies,
    peerDependencies,
    allDeps,
    packageManager,
  };
}

function stripRanges(obj: unknown): Record<string, string> {
  if (!obj || typeof obj !== "object") return {};
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>)
      .filter(([, v]) => typeof v === "string")
      .map(([k, v]) => [k, stripRange(v as string)]),
  );
}

function asStringRecord(obj: unknown): Record<string, string> {
  if (!obj || typeof obj !== "object") return {};
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).filter(([, v]) => typeof v === "string"),
  ) as Record<string, string>;
}
