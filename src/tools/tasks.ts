// Copyright (c) 2026 Aaron Nunley. MIT License.
// This is an UNOFFICIAL SDK — not affiliated with or endorsed by Reclaim.ai.

import type { ReclaimClient } from "../client.js";
import type { ToolDefinition } from "./register.js";
import {
  CreateTaskInputSchema,
  UpdateTaskInputSchema,
  TaskIdInputSchema,
  ListTasksInputSchema,
  AddTimeInputSchema,
  LogWorkInputSchema,
  TaskListOutputSchema,
  TaskSchema,
} from "../types/schemas.js";
import type { Task } from "../types/reclaim.js";
import type { z, ZodObject, ZodRawShape } from "zod";

// ---------------------------------------------------------------------------
// Date normalization
// ---------------------------------------------------------------------------

/** Match bare YYYY-MM-DD (no time component). */
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Reclaim's task API requires full ISO 8601 datetimes. If the caller passes a
 * bare date string (YYYY-MM-DD), expand it:
 *   - `due`         → end of day (23:59:00) in local timezone
 *   - `snoozeUntil` → start of day (00:00:00) in local timezone
 *
 * Already-complete datetimes pass through untouched.
 */
function normalizeDateFields(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...input };

  // Build a UTC offset string like "-07:00" from the server's local timezone.
  const tzOffset = (() => {
    const off = new Date().getTimezoneOffset(); // minutes, negative = ahead of UTC
    const sign = off <= 0 ? "+" : "-";
    const abs = Math.abs(off);
    const h = String(Math.floor(abs / 60)).padStart(2, "0");
    const m = String(abs % 60).padStart(2, "0");
    return `${sign}${h}:${m}`;
  })();

  if (typeof out.due === "string" && DATE_ONLY_RE.test(out.due)) {
    out.due = `${out.due}T23:59:00${tzOffset}`;
  }
  if (typeof out.snoozeUntil === "string" && DATE_ONLY_RE.test(out.snoozeUntil)) {
    out.snoozeUntil = `${out.snoozeUntil}T00:00:00${tzOffset}`;
  }

  return out;
}

// ---------------------------------------------------------------------------
// Response slimming
// ---------------------------------------------------------------------------

/**
 * Strip a raw Reclaim task to the fields useful in a list context.
 * Use get_task for the full unfiltered response.
 */
function slimTask(t: Task): Record<string, unknown> {
  const slim: Record<string, unknown> = {
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    eventCategory: t.eventCategory,
    timeChunksRequired: t.timeChunksRequired,
    timeChunksSpent: t.timeChunksSpent,
    timeChunksRemaining: t.timeChunksRemaining,
  };

  if (t.notes) slim.notes = t.notes;
  if (t.due) slim.due = t.due;
  if (t.snoozeUntil) slim.snoozeUntil = t.snoozeUntil;
  if (t.onDeck) slim.onDeck = true;
  if (t.atRisk) slim.atRisk = true;

  return slim;
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

export function taskTools(client: ReclaimClient): ToolDefinition<ZodObject<ZodRawShape>>[] {
  return [
    {
      name: "list_tasks",
      title: "List Tasks",
      description:
        "List Reclaim tasks. By default returns only active tasks (excludes completed/archived). " +
        "Set includeCompleted=true to see everything. " +
        "Returns a slim view — use get_task for full details.",
      inputSchema: ListTasksInputSchema,
      outputSchema: TaskListOutputSchema,
      handler: async ({ status, includeCompleted }) => {
        let tasks = await client.listTasks();

        if (!includeCompleted) {
          tasks = tasks.filter(
            (t) =>
              t.status !== "COMPLETE" &&
              t.status !== "ARCHIVED" &&
              t.status !== "CANCELLED" &&
              !t.deleted,
          );
        }

        if (status) {
          tasks = tasks.filter((t) => t.status === status);
        }

        return { tasks: tasks.map(slimTask), count: tasks.length };
      },
    },

    {
      name: "get_task",
      title: "Get Task",
      description:
        "Retrieve full details of a single task. " +
        "Returns the complete unfiltered API response.",
      inputSchema: TaskIdInputSchema,
      outputSchema: TaskSchema,
      handler: async ({ taskId }) => {
        return client.getTask(taskId);
      },
    },

    {
      name: "create_task",
      title: "Create Task",
      description:
        "Create a new task in Reclaim for auto-scheduling. " +
        "Time is specified in 15-minute chunks (e.g. timeChunksRequired=4 means 1 hour). " +
        "Priority goes from P1 (highest) to P4 (lowest).",
      inputSchema: CreateTaskInputSchema,
      outputSchema: TaskSchema,
      handler: async (input) => {
        return client.createTask(
          normalizeDateFields(input) as z.infer<typeof CreateTaskInputSchema>,
        );
      },
    },

    {
      name: "update_task",
      title: "Update Task",
      description: "Update properties of an existing task. Only include fields you want to change.",
      inputSchema: UpdateTaskInputSchema,
      outputSchema: TaskSchema,
      handler: async ({ taskId, ...updates }) => {
        return client.updateTask(taskId, normalizeDateFields(updates));
      },
    },

    {
      name: "delete_task",
      title: "Delete Task",
      description: "Permanently delete a task. This cannot be undone.",
      inputSchema: TaskIdInputSchema,
      outputSchema: undefined,
      handler: async ({ taskId }) => {
        await client.deleteTask(taskId);
        return { deleted: true, taskId };
      },
    },

    {
      name: "mark_task_complete",
      title: "Mark Task Complete",
      description: "Mark a task as complete. The task will be archived by Reclaim.",
      inputSchema: TaskIdInputSchema,
      outputSchema: undefined,
      handler: async ({ taskId }) => {
        await client.markTaskComplete(taskId);
        return { completed: true, taskId };
      },
    },

    {
      name: "mark_task_incomplete",
      title: "Reopen Task",
      description: "Reopen a completed or archived task so it returns to the planner.",
      inputSchema: TaskIdInputSchema,
      outputSchema: undefined,
      handler: async ({ taskId }) => {
        await client.markTaskIncomplete(taskId);
        return { reopened: true, taskId };
      },
    },

    {
      name: "start_task",
      title: "Start Task Timer",
      description: "Start the timer on a task. Reclaim will begin tracking time spent.",
      inputSchema: TaskIdInputSchema,
      outputSchema: undefined,
      handler: async ({ taskId }) => {
        await client.startTask(taskId);
        return { started: true, taskId };
      },
    },

    {
      name: "stop_task",
      title: "Stop Task Timer",
      description: "Stop the timer on a currently running task.",
      inputSchema: TaskIdInputSchema,
      outputSchema: undefined,
      handler: async ({ taskId }) => {
        await client.stopTask(taskId);
        return { stopped: true, taskId };
      },
    },

    {
      name: "add_time_to_task",
      title: "Add Time to Task",
      description:
        "Add more scheduled time to a task. Specify minutes — " +
        "they'll be rounded up to the nearest 15-minute chunk.",
      inputSchema: AddTimeInputSchema,
      outputSchema: undefined,
      handler: async ({ taskId, minutes }) => {
        await client.addTimeToTask(taskId, minutes);
        return { taskId, minutesAdded: minutes };
      },
    },

    {
      name: "log_work",
      title: "Log Work on Task",
      description: "Record time spent working on a task without using the timer.",
      inputSchema: LogWorkInputSchema,
      outputSchema: undefined,
      handler: async ({ taskId, minutes }) => {
        await client.logWork(taskId, minutes);
        return { taskId, minutesLogged: minutes };
      },
    },

    {
      name: "prioritize_task",
      title: "Prioritize Task",
      description: "Bump a task to the top of the planner queue for immediate scheduling.",
      inputSchema: TaskIdInputSchema,
      outputSchema: undefined,
      handler: async ({ taskId }) => {
        await client.prioritizeTask(taskId);
        return { prioritized: true, taskId };
      },
    },
  ];
}
