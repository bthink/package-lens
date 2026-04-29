import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { analyze } from "../core/analyze.js";
import type { Priority } from "../types/index.js";

const TOOL_DEFS = [
  {
    name: "analyze_package",
    description: "Full analysis of a package.json file — returns meta, stack, health, bundle impact, scripts, licenses, and recommended actions.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "Absolute path to package.json" } },
      required: ["path"],
    },
  },
  {
    name: "get_outdated",
    description: "Returns outdated packages from the health analysis.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "Absolute path to package.json" } },
      required: ["path"],
    },
  },
  {
    name: "get_vulnerabilities",
    description: "Returns known CVE vulnerabilities found in dependencies.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "Absolute path to package.json" } },
      required: ["path"],
    },
  },
  {
    name: "get_stack",
    description: "Returns the detected tech stack fingerprint (framework, testing, styling).",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "Absolute path to package.json" } },
      required: ["path"],
    },
  },
  {
    name: "get_actions",
    description: "Returns recommended actions, optionally filtered by priority.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Absolute path to package.json" },
        priority: { type: "string", enum: ["low", "medium", "high"], description: "Filter actions by priority" },
      },
      required: ["path"],
    },
  },
  {
    name: "get_bundle_impact",
    description: "Returns bundle size impact data for dependencies.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "Absolute path to package.json" } },
      required: ["path"],
    },
  },
] as const;

function errorResponse(message: string): { isError: true; content: [{ type: "text"; text: string }] } {
  return { isError: true as const, content: [{ type: "text" as const, text: message }] };
}

function jsonResponse(value: unknown): { content: [{ type: "text"; text: string }] } {
  return { content: [{ type: "text" as const, text: JSON.stringify(value) }] };
}

export function createServer(): Server {
  const server = new Server(
    { name: "package-lens", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, () => ({ tools: TOOL_DEFS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const params = (args ?? {}) as Record<string, unknown>;
    const path = params["path"];

    if (typeof path !== "string" || path.trim() === "") {
      return errorResponse("Missing required parameter: path");
    }

    try {
      const result = await analyze(path);

      switch (name) {
        case "analyze_package":
          return jsonResponse(result);

        case "get_outdated":
          return jsonResponse(result.health.outdated);

        case "get_vulnerabilities":
          return jsonResponse(result.health.vulnerabilities);

        case "get_stack":
          return jsonResponse(result.stack);

        case "get_actions": {
          const rawPriority = params["priority"];
          const priority: Priority | undefined = (rawPriority === "low" || rawPriority === "medium" || rawPriority === "high")
            ? rawPriority
            : undefined;
          const actions = priority
            ? result.actions.filter((a) => a.priority === priority)
            : result.actions;
          return jsonResponse(actions);
        }

        case "get_bundle_impact":
          return jsonResponse(result.bundleImpact);

        default:
          return errorResponse(`Unknown tool: ${name}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return errorResponse(`Analysis failed: ${message}`);
    }
  });

  return server;
}

const __filename = fileURLToPath(import.meta.url);
const isMain =
  process.argv[1] === __filename ||
  process.argv[1] === __filename.replace(/\.js$/, ".ts");
if (isMain) {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
