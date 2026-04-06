// Copyright (c) 2026 Aaron Nunley. MIT License.
// This is an UNOFFICIAL SDK — not affiliated with or endorsed by Reclaim.ai.

/**
 * Tool registration bridge — v1 today, v2 tomorrow.
 *
 * Every tool in this project is defined as a ToolDefinition and registered
 * through this module. When the MCP SDK v2 goes stable, the migration is:
 *
 *   1. Change imports: @modelcontextprotocol/server
 *   2. Swap server.tool() → server.registerTool() in registerTool()
 *   3. Wire outputSchema and structuredContent
 *   4. Grep for TODO(v2) for any remaining breadcrumbs
 *
 * See V2_MIGRATION.md for the full checklist.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { z } from "zod";

export interface ToolDefinition<TInput extends z.ZodObject<z.ZodRawShape>> {
  /** Tool name — must be unique across all tools. */
  name: string;

  /** Human-readable title. v1 ignores this; v2 surfaces it. */
  // TODO(v2): pass title to server.registerTool()
  title: string;

  /** Description shown to the LLM. */
  description: string;

  /** Zod schema for input validation. */
  inputSchema: TInput;

  /**
   * Zod schema describing the output shape.
   * Defined now for documentation; wired to `outputSchema` in v2.
   */
  // TODO(v2): pass to server.registerTool({ outputSchema })
  outputSchema?: z.ZodType;

  /** The handler. Returns a plain object — serialization happens here. */
  handler: (args: z.infer<TInput>) => Promise<unknown>;
}

/**
 * Register a tool with the MCP server.
 *
 * In v1: calls server.tool() with positional args.
 * In v2: will call server.registerTool() with named options + structuredContent.
 */
export function registerTool<TInput extends z.ZodObject<z.ZodRawShape>>(
  server: McpServer,
  def: ToolDefinition<TInput>,
): void {
  server.tool(
    def.name,
    def.description,
    // v1 expects the .shape property, not the ZodObject itself
    def.inputSchema.shape,
    async (args) => {
      try {
        const result = await def.handler(args as z.infer<TInput>);
        const text =
          result === undefined
            ? "OK"
            : JSON.stringify(result, null, 2);

        return {
          content: [{ type: "text" as const, text }],
          // TODO(v2): add structuredContent: result
        };
      } catch (error) {
        let message: string;
        if (
          error instanceof Error &&
          "status" in error &&
          "detail" in error
        ) {
          // ReclaimApiError — include the API's error detail
          const detail = (error as { detail?: unknown }).detail;
          const detailStr = detail
            ? "\n" + (typeof detail === "string" ? detail : JSON.stringify(detail, null, 2))
            : "";
          message = error.message + detailStr;
        } else {
          message = error instanceof Error ? error.message : String(error);
        }
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    },
  );
}

/**
 * Convenience for registering an array of tool definitions.
 */
export function registerTools(
  server: McpServer,
  definitions: ToolDefinition<z.ZodObject<z.ZodRawShape>>[],
): void {
  for (const def of definitions) {
    registerTool(server, def);
  }
}
