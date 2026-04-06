// Copyright (c) 2026 Aaron Nunley. MIT License.
// This is an UNOFFICIAL SDK — not affiliated with or endorsed by Reclaim.ai.

import type { ReclaimClient } from "../client.js";
import type { ToolDefinition } from "./register.js";
import {
  UpdateFocusInputSchema,
  FocusSettingsSchema,
} from "../types/schemas.js";
import { z, type ZodObject, type ZodRawShape } from "zod";

export function focusTools(client: ReclaimClient): ToolDefinition<ZodObject<ZodRawShape>>[] {
  return [
    {
      name: "get_focus_settings",
      title: "Get Focus Time Settings",
      description:
        "Get the current focus time configuration — duration, defense level, and enabled state. " +
        "Note: this endpoint may return 403 depending on plan tier or API key scope.",
      inputSchema: z.object({}),
      outputSchema: FocusSettingsSchema,
      handler: async () => {
        return client.getFocusSettings();
      },
    },

    {
      name: "update_focus_settings",
      title: "Update Focus Time Settings",
      description:
        "Update focus time settings. Control whether focus time is enabled, " +
        "how long focus blocks are, and how aggressively they're defended. " +
        "Note: this endpoint may return 403 depending on plan tier or API key scope.",
      inputSchema: UpdateFocusInputSchema,
      outputSchema: FocusSettingsSchema,
      handler: async (input) => {
        return client.updateFocusSettings(input);
      },
    },
  ];
}
