// Copyright (c) 2026 Aaron Nunley. MIT License.
// This is an UNOFFICIAL SDK — not affiliated with or endorsed by Reclaim.ai.

import type { ReclaimClient } from "../client.js";
import type { ToolDefinition } from "./register.js";
import { AnalyticsInputSchema, AnalyticsOutputSchema } from "../types/schemas.js";
import type { ZodObject, ZodRawShape } from "zod";

export function analyticsTools(client: ReclaimClient): ToolDefinition<ZodObject<ZodRawShape>>[] {
  return [
    {
      name: "get_analytics",
      title: "Get Productivity Analytics",
      description:
        "Get personal productivity analytics from Reclaim. " +
        "Returns time allocation, focus time stats, and scheduling insights. " +
        "Note: this endpoint may return 403 depending on plan tier or API key scope.",
      inputSchema: AnalyticsInputSchema,
      outputSchema: AnalyticsOutputSchema,
      handler: async ({ start, end }) => {
        return client.getAnalytics({ start, end });
      },
    },
  ];
}
