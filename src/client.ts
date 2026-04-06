// Copyright (c) 2026 Aaron Nunley. MIT License.
// This is an UNOFFICIAL SDK — not affiliated with or endorsed by Reclaim.ai.

/**
 * Thin HTTP client for the Reclaim.ai REST API.
 *
 * All methods return parsed JSON or throw ReclaimApiError.
 * The client is stateless — auth token is passed at construction.
 */

import {
  type Task,
  type TaskInput,
  type TaskUpdate,
  type Habit,
  type HabitInput,
  type CalendarEvent,
  type Analytics,
  type FocusSettings,
  ReclaimApiError,
} from "./types/reclaim.js";

const BASE_URL = "https://api.app.reclaim.ai/api";

export class ReclaimClient {
  private readonly headers: Record<string, string>;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Reclaim API key is required");
    }
    this.headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  // -------------------------------------------------------------------------
  // HTTP primitives
  // -------------------------------------------------------------------------

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>,
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== "") {
          url.searchParams.set(key, value);
        }
      }
    }

    const response = await fetch(url.toString(), {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let detail: unknown;
      try {
        detail = await response.json();
      } catch {
        detail = await response.text().catch(() => undefined);
      }
      throw new ReclaimApiError(
        `Reclaim API ${method} ${path} failed with status ${response.status}`,
        response.status,
        detail,
      );
    }

    // Some endpoints return 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  // -------------------------------------------------------------------------
  // Tasks
  // -------------------------------------------------------------------------

  async listTasks(): Promise<Task[]> {
    return this.request<Task[]>("GET", "/tasks");
  }

  async getTask(taskId: number): Promise<Task> {
    return this.request<Task>("GET", `/tasks/${taskId}`);
  }

  async createTask(input: TaskInput): Promise<Task> {
    return this.request<Task>("POST", "/tasks", input);
  }

  async updateTask(taskId: number, input: TaskUpdate): Promise<Task> {
    return this.request<Task>("PATCH", `/tasks/${taskId}`, input);
  }

  async deleteTask(taskId: number): Promise<void> {
    return this.request<void>("DELETE", `/tasks/${taskId}`);
  }

  async markTaskComplete(taskId: number): Promise<void> {
    return this.request<void>("POST", `/planner/done/task/${taskId}`);
  }

  async markTaskIncomplete(taskId: number): Promise<void> {
    return this.request<void>("POST", `/planner/unarchive/task/${taskId}`);
  }

  async startTask(taskId: number): Promise<void> {
    return this.request<void>("POST", `/planner/start/task/${taskId}`);
  }

  async stopTask(taskId: number): Promise<void> {
    return this.request<void>("POST", `/planner/stop/task/${taskId}`);
  }

  async addTimeToTask(taskId: number, minutes: number): Promise<void> {
    // Reclaim expects chunks (15-min increments)
    const chunks = Math.ceil(minutes / 15);
    return this.request<void>(
      "POST",
      `/planner/add-time/task/${taskId}`,
      { timeChunks: chunks },
    );
  }

  async logWork(taskId: number, minutes: number): Promise<void> {
    return this.request<void>(
      "POST",
      `/planner/log-work/task/${taskId}`,
      { minutes },
    );
  }

  async prioritizeTask(taskId: number): Promise<void> {
    return this.request<void>("POST", `/planner/prioritize/task/${taskId}`);
  }

  // -------------------------------------------------------------------------
  // Habits
  // -------------------------------------------------------------------------

  async listHabits(): Promise<Habit[]> {
    return this.request<Habit[]>("GET", "/assist/habits/daily");
  }

  async getHabit(habitId: number): Promise<Habit> {
    return this.request<Habit>("GET", `/assist/habits/daily/${habitId}`);
  }

  async createHabit(input: HabitInput): Promise<Habit> {
    return this.request<Habit>("POST", "/assist/habits/daily", input);
  }

  async updateHabit(habitId: number, input: Partial<HabitInput>): Promise<Habit> {
    return this.request<Habit>("PATCH", `/assist/habits/daily/${habitId}`, input);
  }

  async deleteHabit(habitId: number): Promise<void> {
    return this.request<void>("DELETE", `/assist/habits/daily/${habitId}`);
  }

  // -------------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------------

  async listEvents(options?: {
    start?: string;
    end?: string;
    calendarIds?: number[];
  }): Promise<CalendarEvent[]> {
    const params: Record<string, string> = {};
    if (options?.start) params.start = options.start;
    if (options?.end) params.end = options.end;
    if (options?.calendarIds) params.calendarIds = options.calendarIds.join(",");
    return this.request<CalendarEvent[]>("GET", "/events", undefined, params);
  }

  async listPersonalEvents(): Promise<CalendarEvent[]> {
    return this.request<CalendarEvent[]>("GET", "/events/personal");
  }

  async getEvent(eventId: string, calendarId?: number): Promise<CalendarEvent> {
    if (calendarId !== undefined) {
      return this.request<CalendarEvent>(
        "GET",
        `/events/${calendarId}/${eventId}`,
      );
    }
    return this.request<CalendarEvent>("GET", `/events/${eventId}`);
  }

  // -------------------------------------------------------------------------
  // Analytics
  // -------------------------------------------------------------------------

  async getAnalytics(options?: {
    start?: string;
    end?: string;
  }): Promise<Analytics> {
    const params: Record<string, string> = {};
    if (options?.start) params.start = options.start;
    if (options?.end) params.end = options.end;
    return this.request<Analytics>("GET", "/analytics", undefined, params);
  }

  // -------------------------------------------------------------------------
  // Focus
  // -------------------------------------------------------------------------

  async getFocusSettings(): Promise<FocusSettings> {
    return this.request<FocusSettings>("GET", "/assist/focus");
  }

  async updateFocusSettings(settings: Partial<FocusSettings>): Promise<FocusSettings> {
    return this.request<FocusSettings>("PATCH", "/assist/focus", settings);
  }

  // -------------------------------------------------------------------------
  // User (health check / connection verification)
  // -------------------------------------------------------------------------

  async getCurrentUser(): Promise<unknown> {
    return this.request<unknown>("GET", "/users/current");
  }
}
