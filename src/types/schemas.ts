// Copyright (c) 2026 Aaron Nunley. MIT License.
// This is an UNOFFICIAL SDK — not affiliated with or endorsed by Reclaim.ai.

/**
 * Zod schemas for tool input validation and v2-ready output schemas.
 *
 * Input schemas are used by the MCP SDK for runtime validation.
 * Output schemas are defined now but only wired when we migrate to SDK v2
 * (which supports `outputSchema` + `structuredContent`).
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared enums
// ---------------------------------------------------------------------------

export const TaskStatusSchema = z.enum([
  "NEW",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETE",
  "CANCELLED",
  "ARCHIVED",
]);

export const TaskPrioritySchema = z.enum(["P1", "P2", "P3", "P4"]);

export const EventCategorySchema = z.enum(["WORK", "PERSONAL"]);

export const RsvpStatusSchema = z.enum([
  "ACCEPTED",
  "DECLINED",
  "TENTATIVE",
  "NEEDS_ACTION",
]);

// ---------------------------------------------------------------------------
// Task schemas
// ---------------------------------------------------------------------------

export const TaskSchema = z.object({
  id: z.number(),
  title: z.string(),
  notes: z.string().optional(),
  eventCategory: EventCategorySchema.optional(),
  priority: TaskPrioritySchema.optional(),
  status: TaskStatusSchema.optional(),
  timeChunksRequired: z.number().optional(),
  timeChunksSpent: z.number().optional(),
  timeChunksRemaining: z.number().optional(),
  minChunkSize: z.number().optional(),
  maxChunkSize: z.number().optional(),
  due: z.string().optional(),
  snoozeUntil: z.string().optional(),
  onDeck: z.boolean().optional(),
  deleted: z.boolean().optional(),
  atRisk: z.boolean().optional(),
  created: z.string().optional(),
  updated: z.string().optional(),
  finished: z.string().optional(),
});

export const TaskListOutputSchema = z.object({
  tasks: z.array(TaskSchema),
  count: z.number(),
});

export const CreateTaskInputSchema = z.object({
  title: z.string().describe("Task title"),
  notes: z.string().optional().describe("Task description or notes"),
  eventCategory: EventCategorySchema.optional().describe("WORK or PERSONAL"),
  priority: TaskPrioritySchema.optional().describe("Priority level: P1 (highest) to P4 (lowest)"),
  timeChunksRequired: z.number().optional().describe("Time needed in 15-minute chunks (e.g. 4 = 1 hour)"),
  due: z.string().optional().describe("Due date (YYYY-MM-DD or ISO 8601 datetime)"),
  snoozeUntil: z.string().optional().describe("Don't schedule before this date (YYYY-MM-DD or ISO 8601 datetime)"),
  onDeck: z.boolean().optional().describe("Whether the task is on deck (prioritized for today)"),
  minChunkSize: z.number().optional().describe("Minimum scheduling block in 15-min chunks"),
  maxChunkSize: z.number().optional().describe("Maximum scheduling block in 15-min chunks"),
  alwaysPrivate: z.boolean().optional().describe("Hide task title on shared calendars"),
});

export const UpdateTaskInputSchema = z.object({
  taskId: z.number().describe("Task ID to update"),
  title: z.string().optional().describe("New task title"),
  notes: z.string().optional().describe("New task notes"),
  eventCategory: EventCategorySchema.optional().describe("WORK or PERSONAL"),
  priority: TaskPrioritySchema.optional().describe("Priority: P1-P4"),
  timeChunksRequired: z.number().optional().describe("Updated time needed in 15-min chunks"),
  due: z.string().optional().describe("New due date (YYYY-MM-DD or ISO 8601 datetime)"),
  snoozeUntil: z.string().optional().describe("New snooze-until date (YYYY-MM-DD or ISO 8601 datetime)"),
  onDeck: z.boolean().optional().describe("On-deck status"),
  minChunkSize: z.number().optional().describe("Min scheduling block in 15-min chunks"),
  maxChunkSize: z.number().optional().describe("Max scheduling block in 15-min chunks"),
  alwaysPrivate: z.boolean().optional().describe("Calendar privacy"),
});

export const TaskIdInputSchema = z.object({
  taskId: z.number().describe("Task ID"),
});

export const ListTasksInputSchema = z.object({
  status: TaskStatusSchema.optional().describe("Filter by status"),
  includeCompleted: z.boolean().optional().describe("Include completed/archived tasks (default: false)"),
});

export const AddTimeInputSchema = z.object({
  taskId: z.number().describe("Task ID"),
  minutes: z.number().describe("Minutes to add (will be rounded to nearest 15-min chunk)"),
});

export const LogWorkInputSchema = z.object({
  taskId: z.number().describe("Task ID"),
  minutes: z.number().describe("Minutes of work to log"),
});

// ---------------------------------------------------------------------------
// Habit schemas
// ---------------------------------------------------------------------------

export const HabitSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  notes: z.string().optional(),
  eventCategory: EventCategorySchema.optional(),
  enabled: z.boolean().optional(),
  durationMin: z.number().optional(),
  durationMax: z.number().optional(),
  created: z.string().optional(),
  updated: z.string().optional(),
});

export const HabitListOutputSchema = z.object({
  habits: z.array(HabitSchema),
  count: z.number(),
});

export const CreateHabitInputSchema = z.object({
  title: z.string().describe("Habit title"),
  notes: z.string().optional().describe("Habit description"),
  eventCategory: EventCategorySchema.optional().describe("WORK or PERSONAL"),
  durationMin: z.number().optional().describe("Minimum duration in minutes"),
  durationMax: z.number().optional().describe("Maximum duration in minutes"),
  idealDay: z.string().optional().describe("Preferred day of the week"),
  idealTime: z.string().optional().describe("Preferred time of day (e.g. 'MORNING', 'AFTERNOON')"),
  recurrence: z.string().optional().describe("Recurrence pattern"),
  defenseAggression: z.string().optional().describe("How aggressively to defend this time slot"),
  alwaysPrivate: z.boolean().optional().describe("Hide on shared calendars"),
});

export const UpdateHabitInputSchema = z.object({
  habitId: z.number().describe("Habit ID to update"),
  title: z.string().optional().describe("New habit title"),
  notes: z.string().optional().describe("New description"),
  eventCategory: EventCategorySchema.optional().describe("WORK or PERSONAL"),
  durationMin: z.number().optional().describe("New minimum duration in minutes"),
  durationMax: z.number().optional().describe("New maximum duration in minutes"),
  idealDay: z.string().optional().describe("Preferred day"),
  idealTime: z.string().optional().describe("Preferred time"),
  defenseAggression: z.string().optional().describe("Defense aggression level"),
  alwaysPrivate: z.boolean().optional().describe("Calendar privacy"),
});

export const HabitIdInputSchema = z.object({
  habitId: z.number().describe("Habit ID"),
});

// ---------------------------------------------------------------------------
// Event schemas
// ---------------------------------------------------------------------------

export const EventSchema = z.object({
  eventId: z.string(),
  calendarId: z.number().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  allDay: z.boolean().optional(),
  rsvpStatus: RsvpStatusSchema.optional(),
  type: z.string().optional(),
});

export const EventListOutputSchema = z.object({
  events: z.array(EventSchema),
  count: z.number(),
});

export const ListEventsInputSchema = z.object({
  start: z.string().optional().describe("Start of date range (YYYY-MM-DD). Defaults to now."),
  end: z.string().optional().describe("End of date range (YYYY-MM-DD). Defaults to 7 days from now."),
  calendarIds: z.array(z.number()).optional().describe("Filter to specific calendar IDs"),
});

export const GetEventInputSchema = z.object({
  eventId: z.string().describe("Event ID"),
  calendarId: z.number().optional().describe("Calendar ID (required for some operations)"),
});

export const SetRsvpInputSchema = z.object({
  eventId: z.string().describe("Event ID"),
  calendarId: z.number().describe("Calendar ID"),
  status: RsvpStatusSchema.describe("RSVP status to set"),
});

// ---------------------------------------------------------------------------
// Focus schemas
// ---------------------------------------------------------------------------

export const FocusSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  minDuration: z.number().optional(),
  maxDuration: z.number().optional(),
  defenseAggression: z.string().optional(),
});

export const UpdateFocusInputSchema = z.object({
  enabled: z.boolean().optional().describe("Enable/disable focus time"),
  minDuration: z.number().optional().describe("Minimum focus block duration in minutes"),
  maxDuration: z.number().optional().describe("Maximum focus block duration in minutes"),
  defenseAggression: z.string().optional().describe("How aggressively to defend focus blocks"),
});

// ---------------------------------------------------------------------------
// Analytics schemas
// ---------------------------------------------------------------------------

export const AnalyticsInputSchema = z.object({
  start: z.string().optional().describe("Start of analysis period (YYYY-MM-DD)"),
  end: z.string().optional().describe("End of analysis period (YYYY-MM-DD)"),
});

export const AnalyticsOutputSchema = z.object({
  data: z.unknown(),
});
