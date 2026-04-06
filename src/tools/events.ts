// Copyright (c) 2026 Aaron Nunley. MIT License.
// This is an UNOFFICIAL SDK — not affiliated with or endorsed by Reclaim.ai.

import type { ReclaimClient } from "../client.js";
import type { ToolDefinition } from "./register.js";
import {
  ListEventsInputSchema,
  GetEventInputSchema,
  EventListOutputSchema,
  EventSchema,
} from "../types/schemas.js";
import type { CalendarEvent } from "../types/reclaim.js";
import type { ZodObject, ZodRawShape } from "zod";

// ---------------------------------------------------------------------------
// Response slimming
// ---------------------------------------------------------------------------

/**
 * Strip a raw Reclaim event to the fields an LLM actually needs.
 *
 * The API returns 40+ fields per event (~4 KB each). Most are internal
 * metadata (etag, version, mergeDetails, scoredType, etc.) that burn
 * context window for zero value. This keeps the useful ~10% and drops
 * the rest. Use get_event for the full unfiltered response when needed.
 */
function slimEvent(e: CalendarEvent): Record<string, unknown> {
  const slim: Record<string, unknown> = {
    eventId: e.eventId,
    title: e.title,
    start: e.eventStart ?? e.start,
    end: e.eventEnd ?? e.end,
    type: e.reclaimEventType ?? e.type,
    category: e.category ?? e.eventCategory,
    free: e.free,
    allDay: e.allDay,
  };

  // Conditionally include fields that are only useful when present
  if (e.numAttendees && (e.numAttendees as number) > 0) slim.numAttendees = e.numAttendees;
  if (e.onlineMeetingUrl) slim.meetingUrl = e.onlineMeetingUrl;
  if (e.location) slim.location = e.location;
  if (e.reclaimManaged) slim.reclaimManaged = true;
  if (e.description) {
    // Truncate long descriptions (Calendly invites, etc.) in list view.
    // Full description available via get_event.
    const desc = e.description as string;
    slim.description = desc.length > 200 ? desc.slice(0, 200) + "…" : desc;
  }
  if (e.rsvpStatus && (e.rsvpStatus as string) !== "None") slim.rsvpStatus = e.rsvpStatus;
  if (e.recurring) slim.recurring = true;

  return slim;
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

export function eventTools(client: ReclaimClient): ToolDefinition<ZodObject<ZodRawShape>>[] {
  return [
    {
      name: "list_events",
      title: "List Calendar Events",
      description:
        "List calendar events within a time range. " +
        "Returns a slim view of each event (title, times, type, attendees). " +
        "Use get_event with an eventId for full details. " +
        "Defaults to today if no range is specified.",
      inputSchema: ListEventsInputSchema,
      outputSchema: EventListOutputSchema,
      handler: async ({ start, end, calendarIds }) => {
        // Default to today if no range specified — avoids dumping an entire
        // week of events and blowing out context.
        if (!start && !end) {
          const today = new Date();
          start = today.toISOString().slice(0, 10);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          end = tomorrow.toISOString().slice(0, 10);
        }
        const events = await client.listEvents({ start, end, calendarIds });
        return { events: events.map(slimEvent), count: events.length };
      },
    },

    {
      name: "list_personal_events",
      title: "List Personal Events",
      description:
        "List Reclaim-managed personal events (tasks, habits, focus time). " +
        "These are the events Reclaim created or manages on your calendar. " +
        "Returns a slim view — use get_event for full details.",
      inputSchema: ListEventsInputSchema.pick({ start: true, end: true }),
      outputSchema: EventListOutputSchema,
      handler: async ({ start, end }) => {
        // Personal events endpoint doesn't support date filtering server-side,
        // so we filter client-side when a range is provided.
        let events = await client.listPersonalEvents();
        if (start || end) {
          const startMs = start ? new Date(start).getTime() : 0;
          const endMs = end ? new Date(end).getTime() : Infinity;
          events = events.filter((e) => {
            const eventStart = new Date(
              (e.eventStart as string) ?? e.start ?? "",
            ).getTime();
            return eventStart >= startMs && eventStart < endMs;
          });
        }
        return { events: events.map(slimEvent), count: events.length };
      },
    },

    {
      name: "get_event",
      title: "Get Event",
      description:
        "Retrieve full details of a single calendar event. " +
        "Returns the complete unfiltered API response.",
      inputSchema: GetEventInputSchema,
      outputSchema: EventSchema,
      handler: async ({ eventId, calendarId }) => {
        return client.getEvent(eventId, calendarId);
      },
    },
  ];
}
