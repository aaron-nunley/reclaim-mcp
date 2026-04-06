// Copyright (c) 2026 Aaron Nunley. MIT License.
// This is an UNOFFICIAL SDK — not affiliated with or endorsed by Reclaim.ai.

import type { ReclaimClient } from "../client.js";
import type { ToolDefinition } from "./register.js";
import {
  CreateHabitInputSchema,
  UpdateHabitInputSchema,
  HabitIdInputSchema,
  HabitListOutputSchema,
  HabitSchema,
} from "../types/schemas.js";
import type { Habit } from "../types/reclaim.js";
import type { z, ZodObject, ZodRawShape } from "zod";

// ---------------------------------------------------------------------------
// Response slimming
// ---------------------------------------------------------------------------

/**
 * Strip a raw Reclaim habit to the fields useful in a list context.
 *
 * Drops oneOffPolicy (day-by-day schedule, ~800 chars each) and
 * reservedWords (localized lunch synonyms, etc.) from list responses.
 * Use get_habit for the full unfiltered response.
 */
function slimHabit(h: Habit): Record<string, unknown> {
  const slim: Record<string, unknown> = {
    id: h.id,
    title: h.title,
    enabled: h.enabled,
    eventCategory: h.eventCategory,
    durationMin: h.durationMin,
    durationMax: h.durationMax,
    idealTime: h.idealTime,
    defenseAggression: h.defenseAggression,
    priority: h.priority,
  };

  if (h.defendedDescription) slim.description = h.defendedDescription;
  if (h.snoozeUntil) slim.snoozeUntil = h.snoozeUntil;
  if (h.notification) slim.notification = true;
  if (h.autoDecline) slim.autoDecline = true;
  if (h.timesPerPeriod) slim.timesPerPeriod = h.timesPerPeriod;

  return slim;
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

export function habitTools(client: ReclaimClient): ToolDefinition<ZodObject<ZodRawShape>>[] {
  return [
    {
      name: "list_habits",
      title: "List Habits",
      description:
        "List all smart habits configured in Reclaim. " +
        "Returns a slim view — use get_habit for full details including schedule policy.",
      inputSchema: HabitIdInputSchema.partial() as unknown as ZodObject<ZodRawShape>,
      outputSchema: HabitListOutputSchema,
      handler: async () => {
        const habits = await client.listHabits();
        return { habits: habits.map(slimHabit), count: habits.length };
      },
    },

    {
      name: "get_habit",
      title: "Get Habit",
      description:
        "Retrieve full details of a single habit, including schedule policy. " +
        "Returns the complete unfiltered API response.",
      inputSchema: HabitIdInputSchema,
      outputSchema: HabitSchema,
      handler: async ({ habitId }) => {
        return client.getHabit(habitId);
      },
    },

    {
      name: "create_habit",
      title: "Create Habit",
      description:
        "Create a new smart habit for auto-scheduling. " +
        "Reclaim will find time on the calendar based on your preferences.",
      inputSchema: CreateHabitInputSchema,
      outputSchema: HabitSchema,
      handler: async (input) => {
        return client.createHabit(input as z.infer<typeof CreateHabitInputSchema>);
      },
    },

    {
      name: "update_habit",
      title: "Update Habit",
      description: "Update properties of an existing habit. Only include fields you want to change.",
      inputSchema: UpdateHabitInputSchema,
      outputSchema: HabitSchema,
      handler: async ({ habitId, ...updates }) => {
        return client.updateHabit(habitId, updates);
      },
    },

    {
      name: "delete_habit",
      title: "Delete Habit",
      description: "Permanently delete a habit. This cannot be undone.",
      inputSchema: HabitIdInputSchema,
      outputSchema: undefined,
      handler: async ({ habitId }) => {
        await client.deleteHabit(habitId);
        return { deleted: true, habitId };
      },
    },
  ];
}
