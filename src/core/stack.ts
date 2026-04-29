import type { StackFingerprint } from "../types/index.js";

const FRAMEWORK_MAP: Array<[string | RegExp, string]> = [
  ["next", "nextjs"],
  ["@remix-run/react", "remix"],
  ["@remix-run/node", "remix"],
  ["astro", "astro"],
  ["@sveltejs/kit", "sveltekit"],
  ["svelte", "svelte"],
  ["nuxt", "nuxt"],
  ["vite", "vite"],
  ["gatsby", "gatsby"],
  ["@angular/core", "angular"],
];

const TESTING_MAP: Array<[string | RegExp, string]> = [
  ["vitest", "vitest"],
  ["jest", "jest"],
  ["@playwright/test", "playwright"],
  ["cypress", "cypress"],
  ["mocha", "mocha"],
  ["jasmine", "jasmine"],
];

const STYLING_MAP: Array<[string | RegExp, string]> = [
  ["tailwindcss", "tailwind"],
  ["styled-components", "styled-components"],
  ["@emotion/react", "emotion"],
  ["@emotion/styled", "emotion"],
  ["sass", "sass"],
  ["less", "less"],
  ["stitches", "stitches"],
  ["@vanilla-extract/css", "vanilla-extract"],
];

function match(deps: Record<string, string>, map: Array<[string | RegExp, string]>): string[] {
  const found = new Set<string>();
  for (const [key, label] of map) {
    if (typeof key === "string" && key in deps) {
      found.add(label);
    } else if (key instanceof RegExp) {
      if (Object.keys(deps).some((d) => key.test(d))) found.add(label);
    }
  }
  return [...found];
}

export function detectStack(allDeps: Record<string, string>): StackFingerprint {
  const frameworks = match(allDeps, FRAMEWORK_MAP);

  // Next.js takes precedence over vite if both somehow present
  const framework = frameworks[0] ?? null;

  return {
    framework,
    testing: match(allDeps, TESTING_MAP),
    styling: match(allDeps, STYLING_MAP),
  };
}
