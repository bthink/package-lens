import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "core/index": "src/core/index.ts",
    "cli/index": "src/cli/index.ts",
    "mcp/index": "src/mcp/index.ts",
  },
  format: ["esm"],
  target: "node22",
  clean: true,
  dts: true,
  sourcemap: true,
});
