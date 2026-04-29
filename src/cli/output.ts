import chalk from "chalk";
import type { AnalysisResult, Priority, RecommendedAction } from "../types/index.js";

export function formatJson(result: AnalysisResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatTable(result: AnalysisResult): string {
  const lines: string[] = [];

  const scoreColor =
    result.health.score >= 80
      ? chalk.green
      : result.health.score >= 50
        ? chalk.yellow
        : chalk.red;

  lines.push(chalk.bold(`\n${result.meta.name} @ ${result.meta.version}`));
  lines.push(`${"Score:".padEnd(16)} ${scoreColor(String(result.health.score))}/100`);
  lines.push(`${"Package manager:".padEnd(16)} ${result.meta.packageManager}`);

  // Stack
  const stackParts: string[] = [];
  if (result.stack.framework) stackParts.push(result.stack.framework);
  stackParts.push(...result.stack.testing, ...result.stack.styling);
  if (stackParts.length > 0) {
    lines.push(`${"Stack:".padEnd(16)} ${stackParts.join(", ")}`);
  }

  // Vulnerabilities
  if (result.health.vulnerabilities.length > 0) {
    lines.push(chalk.bold("\nVulnerabilities"));
    for (const v of result.health.vulnerabilities) {
      const sevColor =
        v.severity === "critical" || v.severity === "high" ? chalk.red : chalk.yellow;
      lines.push(`  ${sevColor(v.severity.padEnd(8))} ${v.name}  ${chalk.dim(v.cveId)}  ${v.summary}`);
    }
  }

  // Outdated
  if (result.health.outdated.length > 0) {
    lines.push(chalk.bold("\nOutdated packages"));
    for (const pkg of result.health.outdated) {
      const sevColor =
        pkg.severity === "major"
          ? chalk.red
          : pkg.severity === "minor"
            ? chalk.yellow
            : chalk.dim;
      lines.push(
        `  ${pkg.name.padEnd(30)} ${pkg.current} → ${chalk.green(pkg.latest)}  ${sevColor(pkg.severity)}`,
      );
    }
  }

  // Duplicates
  if (result.health.duplicates.length > 0) {
    lines.push(chalk.bold("\nDuplicate packages"));
    for (const dup of result.health.duplicates) {
      lines.push(`  ${chalk.yellow(dup.category.padEnd(16))} ${dup.packages.join(", ")}  ${chalk.dim(dup.recommendation)}`);
    }
  }

  // Bundle
  if (result.bundleImpact.length > 0) {
    lines.push(chalk.bold("\nBundle impact (top)"));
    for (const entry of result.bundleImpact) {
      const rec = entry.recommendation ? `  ${chalk.dim(entry.recommendation)}` : "";
      lines.push(`  ${entry.name.padEnd(30)} ${chalk.cyan(entry.sizeGzip)}${rec}`);
    }
  }

  // Scripts
  if (result.scripts.missing.length > 0) {
    lines.push(chalk.bold("\nMissing scripts"));
    lines.push(`  ${result.scripts.missing.join(", ")}`);
  }
  if (result.scripts.suspicious.length > 0) {
    lines.push(chalk.bold("\nSuspicious scripts"));
    lines.push(`  ${result.scripts.suspicious.join(", ")}`);
  }

  // Licenses
  if (result.licenses.issues.length > 0) {
    lines.push(chalk.bold("\nLicense issues"));
    lines.push(`  ${result.licenses.issues.join(", ")}`);
  }

  // Actions
  if (result.actions.length > 0) {
    lines.push(chalk.bold("\nRecommended actions"));
    for (const action of result.actions) {
      const priorityColor =
        action.priority === "high"
          ? chalk.red
          : action.priority === "medium"
            ? chalk.yellow
            : chalk.dim;
      lines.push(`  ${priorityColor(`[${action.priority}]`.padEnd(10))} ${action.action}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

export function formatActions(
  actions: RecommendedAction[],
  filter: Priority | undefined,
): string {
  const filtered = filter ? actions.filter((a) => a.priority === filter) : actions;

  if (filtered.length === 0) {
    return chalk.dim("No actions found.\n");
  }

  const lines: string[] = [""];
  for (const action of filtered) {
    const priorityColor =
      action.priority === "high"
        ? chalk.red
        : action.priority === "medium"
          ? chalk.yellow
          : chalk.dim;
    lines.push(`  ${priorityColor(`[${action.priority}]`.padEnd(10))} ${action.action}`);
  }
  lines.push("");
  return lines.join("\n");
}
