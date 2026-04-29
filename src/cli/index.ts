#!/usr/bin/env node
import { Command } from "commander";
import { resolve } from "node:path";
import { analyze } from "../core/analyze.js";
import { formatJson, formatTable, formatActions } from "./output.js";
import type { Priority } from "../types/index.js";

const program = new Command();

program.name("package-lens").description("Structured package.json analysis").version("0.1.0");

function resolvePackageJson(pathArg: string | undefined): string {
  if (!pathArg) return resolve(process.cwd(), "package.json");
  if (pathArg.endsWith("package.json")) return resolve(pathArg);
  return resolve(pathArg, "package.json");
}

program
  .command("analyze [path]")
  .description("Analyze a package.json and report health")
  .option("-f, --format <format>", "output format: json | table", "table")
  .action(async (pathArg: string | undefined, opts: { format: string }) => {
    const pkgPath = resolvePackageJson(pathArg);
    let result;
    try {
      result = await analyze(pkgPath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`Error: ${msg}\n`);
      process.exit(1);
    }

    if (opts.format === "json") {
      process.stdout.write(formatJson(result) + "\n");
    } else {
      process.stdout.write(formatTable(result));
    }

    if (result.health.score < 50) {
      process.exit(1);
    }
  });

program
  .command("actions [path]")
  .description("List recommended actions for a package.json")
  .option("-p, --priority <priority>", "filter by priority: high | medium | low")
  .action(async (pathArg: string | undefined, opts: { priority?: string }) => {
    const pkgPath = resolvePackageJson(pathArg);
    let result;
    try {
      result = await analyze(pkgPath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`Error: ${msg}\n`);
      process.exit(1);
    }

    const priority = opts.priority as Priority | undefined;
    process.stdout.write(formatActions(result.actions, priority));
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Error: ${msg}\n`);
  process.exit(1);
});
