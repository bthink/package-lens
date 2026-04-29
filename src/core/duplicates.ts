import type { DuplicateGroup } from "../types/index.js";

interface DuplicateRule {
  category: string;
  members: string[];
  recommendation: string;
}

const RULES: DuplicateRule[] = [
  {
    category: "date-utils",
    members: ["moment", "dayjs", "date-fns", "luxon"],
    recommendation: "remove moment/dayjs, keep date-fns or luxon (smaller, tree-shakeable)",
  },
  {
    category: "utility",
    members: ["lodash", "lodash-es", "ramda", "underscore"],
    recommendation: "remove lodash/ramda duplicates; prefer lodash-es for tree-shaking or use native array methods",
  },
  {
    category: "http-client",
    members: ["axios", "ky", "superagent", "got", "node-fetch"],
    recommendation: "consolidate to one HTTP client; ky or native fetch preferred for browser, got for Node",
  },
  {
    category: "state-management",
    members: ["redux", "@reduxjs/toolkit", "mobx", "zustand", "jotai", "recoil", "valtio"],
    recommendation: "use one state management solution; zustand or @reduxjs/toolkit for most cases",
  },
  {
    category: "validation",
    members: ["joi", "yup", "zod", "valibot", "ajv"],
    recommendation: "consolidate validation to one library; zod preferred for TypeScript projects",
  },
  {
    category: "css-in-js",
    members: ["styled-components", "@emotion/react", "@emotion/styled", "stitches"],
    recommendation: "use one CSS-in-JS solution",
  },
  {
    category: "test-runner",
    members: ["jest", "vitest", "mocha", "jasmine"],
    recommendation: "use one test runner; vitest preferred for Vite/TS projects",
  },
];

export function detectDuplicates(deps: Record<string, string>): DuplicateGroup[] {
  const installedPkgs = new Set(Object.keys(deps));
  const result: DuplicateGroup[] = [];

  for (const rule of RULES) {
    const found = rule.members.filter((m) => installedPkgs.has(m));
    if (found.length >= 2) {
      result.push({
        category: rule.category,
        packages: found,
        recommendation: rule.recommendation,
      });
    }
  }

  return result;
}
