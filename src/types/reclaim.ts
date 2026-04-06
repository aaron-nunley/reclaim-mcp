// Copyright (c) 2026 Aaron Nunley. MIT License.
// This is an UNOFFICIAL SDK — not affiliated with or endorsed by Reclaim.ai.

/**
 * Core Reclaim.ai API types.
 *
 * Derived from the public Reclaim API (https://api.app.reclaim.ai/api/)
 * and community implementations. These types represent the API's response
 * shapes as observed — Reclaim does not publish formal OpenAPI response schemas
 * for all endpoints.
 */

// ---------------------------------------------------------------------------
// Enums (as union types for lightweight serialization)
// ---------------------------------------------------------------------------

export type TaskStatus =
  | "NEW"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETE"
  | "CANCELLED"
  | "ARCHIVED";

export type TaskPriority = "P1" | "P2" | "P3" | "P4";

export type EventCategory = "WORK" | "PERSONAL";

export type RsvpStatus = "ACCEPTED" | "DECLINED" | "TENTATIVE" | "NEEDS_ACTION";

// ---------------------------------------------------------------------------
// Task
// ---------------------------------------------------------------------------

export interface Task {
  id: number;
  title: string;
  notes?: string;
  eventCategory?: EventCategory;
  eventSubType?: string;
  priority?: TaskPriority;
  timeChunksRequired?: number;
  timeChunksSpent?: number;
  timeChunksRemaining?: number;
  minChunkSize?: number;
  maxChunkSize?: number;
  status?: TaskStatus;
  due?: string;
  snoozeUntil?: string;
  eventColor?: string;
  deleted?: boolean;
  onDeck?: boolean;
  created?: string;
  updated?: string;
  finished?: string;
  adjusted?: boolean;
  atRisk?: boolean;
  timeSchemeId?: string;
  index?: number;
  alwaysPrivate?: boolean;
  sortKey?: number;
  type?: "TASK" | "HABIT";
  [key: string]: unknown;
}

export interface TaskInput {
  title: string;
  notes?: string;
  eventCategory?: EventCategory;
  eventSubType?: string;
  priority?: TaskPriority;
  timeChunksRequired?: number;
  onDeck?: boolean;
  due?: string;
  snoozeUntil?: string;
  eventColor?: string;
  minChunkSize?: number;
  maxChunkSize?: number;
  alwaysPrivate?: boolean;
}

export interface TaskUpdate {
  title?: string;
  notes?: string;
  eventCategory?: EventCategory;
  priority?: TaskPriority;
  timeChunksRequired?: number;
  onDeck?: boolean;
  due?: string;
  snoozeUntil?: string;
  eventColor?: string;
  minChunkSize?: number;
  maxChunkSize?: number;
  alwaysPrivate?: boolean;
}

// ---------------------------------------------------------------------------
// Habit
// ---------------------------------------------------------------------------

export interface Habit {
  id: number;
  title?: string;
  notes?: string;
  eventCategory?: EventCategory;
  enabled?: boolean;
  defenseAggression?: string;
  recurrence?: string;
  durationMin?: number;
  durationMax?: number;
  idealDay?: string;
  idealTime?: string;
  snoozeUntil?: string;
  autoDecline?: boolean;
  alwaysPrivate?: boolean;
  created?: string;
  updated?: string;
  [key: string]: unknown;
}

export interface HabitInput {
  title: string;
  notes?: string;
  eventCategory?: EventCategory;
  durationMin?: number;
  durationMax?: number;
  idealDay?: string;
  idealTime?: string;
  recurrence?: string;
  defenseAggression?: string;
  alwaysPrivate?: boolean;
}

// ---------------------------------------------------------------------------
// Event
// ---------------------------------------------------------------------------

export interface CalendarEvent {
  eventId: string;
  calendarId?: number;
  title?: string;
  description?: string;
  location?: string;
  start?: string;
  end?: string;
  allDay?: boolean;
  free?: boolean;
  color?: string;
  rsvpStatus?: RsvpStatus;
  type?: string;
  sourceDetails?: Record<string, unknown>;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface Analytics {
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Focus
// ---------------------------------------------------------------------------

export interface FocusSettings {
  enabled?: boolean;
  minDuration?: number;
  maxDuration?: number;
  defenseAggression?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// API Error
// ---------------------------------------------------------------------------

export class ReclaimApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = "ReclaimApiError";
  }
}
