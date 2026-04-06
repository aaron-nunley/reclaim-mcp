#!/usr/bin/env node

// Copyright (c) 2026 Aaron Nunley. MIT License.
// This is an UNOFFICIAL SDK — not affiliated with or endorsed by Reclaim.ai.

/**
 * reclaim-mcp — MCP server for Reclaim.ai
 *
 * Exposes Reclaim.ai task management, habits, calendar events, focus time,
 * and analytics as MCP tools for use with Claude, Copilot, and other
 * MCP-compatible clients.
 *
 * Usage:
 *   RECLAIM_API_KEY=your_key node dist/index.js
 *
 * Or via .mcp.json:
 *   {
 *     "mcpServers": {
 *       "reclaim": {
 *         "command": "npx",
 *         "args": ["reclaim-mcp"],
 *         "env": { "RECLAIM_API_KEY": "your_key" }
 *       }
 *     }
 *   }
 */

// TODO(v2): Change imports to @modelcontextprotocol/server
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { ReclaimClient } from "./client.js";
import { registerTools } from "./tools/register.js";
import { taskTools } from "./tools/tasks.js";
import { habitTools } from "./tools/habits.js";
import { eventTools } from "./tools/events.js";
import { focusTools } from "./tools/focus.js";
import { analyticsTools } from "./tools/analytics.js";

import type { ZodObject, ZodRawShape } from "zod";
import type { ToolDefinition } from "./tools/register.js";

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

const apiKey = process.env.RECLAIM_API_KEY;

if (!apiKey) {
  // stderr only — stdout is the JSON-RPC transport
  console.error(
    "Error: RECLAIM_API_KEY environment variable is required.\n" +
    "Get your API key from Reclaim.ai → Settings → Integrations → API.\n" +
    "Then set it: RECLAIM_API_KEY=your_key npx reclaim-mcp",
  );
  process.exit(1);
}

const client = new ReclaimClient(apiKey);

// TODO(v2): pass instructions to McpServer options
const server = new McpServer({
  name: "reclaim-mcp",
  version: "0.1.0",
});

// ---------------------------------------------------------------------------
// Register all tools
// ---------------------------------------------------------------------------

const allTools: ToolDefinition<ZodObject<ZodRawShape>>[] = [
  ...taskTools(client),
  ...habitTools(client),
  ...eventTools(client),
  ...focusTools(client),
  ...analyticsTools(client),
];

registerTools(server, allTools);

// ---------------------------------------------------------------------------
// Connect transport
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr — never stdout (that's the JSON-RPC stream)
  console.error(
    `reclaim-mcp v0.1.0 running — ${allTools.length} tools registered`,
  );
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
