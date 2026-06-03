import axios from "axios";

import type {
  ActivityLog,
  ActivityLogPayload,
  ChecklistUpdatePayload,
  DailyJournal,
  DayPlan,
  DayPriorityUpdatePayload,
  DailyChecklist,
  DashboardData,
  JournalEntryPayload,
  PeakCalendarEvent,
  PeakCalendarEventCreatePayload,
  PeakCalendarEventUpdatePayload,
  Sprint,
  Task,
  TaskStatus,
  WhoopManualEntry,
  WhoopUpdatePayload,
} from "../types";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

function handleApiError(error: unknown, fallbackMessage: string): never {
  console.error(fallbackMessage, error);

  if (axios.isAxiosError(error)) {
    const detail =
      typeof error.response?.data?.detail === "string"
        ? error.response.data.detail
        : error.message;

    throw new Error(detail || fallbackMessage);
  }

  throw new Error(fallbackMessage);
}

export async function getDashboard(date: string): Promise<DashboardData> {
  try {
    const response = await api.get<DashboardData>(`/dashboard/${date}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to load dashboard data.");
  }
}

export async function getSprints(): Promise<Sprint[]> {
  try {
    const response = await api.get<Sprint[]>("/sprints");
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to load sprint data.");
  }
}

export async function getSprintDays(sprintId: number): Promise<DayPlan[]> {
  try {
    const response = await api.get<DayPlan[]>(`/sprints/${sprintId}/days`);
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to load sprint days.");
  }
}

export async function getPeakCalendarEvents(params: {
  start_date: string;
  end_date: string;
  sprint_id?: number | null;
}): Promise<PeakCalendarEvent[]> {
  try {
    const response = await api.get<PeakCalendarEvent[]>("/peak-calendar/events", {
      params: {
        start_date: params.start_date,
        end_date: params.end_date,
        sprint_id: params.sprint_id ?? undefined,
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to load calendar events.");
  }
}

export async function createPeakCalendarEvent(
  payload: PeakCalendarEventCreatePayload
): Promise<PeakCalendarEvent> {
  try {
    const response = await api.post<PeakCalendarEvent>("/peak-calendar/events", payload);
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to create calendar event.");
  }
}

export async function updatePeakCalendarEvent(
  eventId: number,
  payload: PeakCalendarEventUpdatePayload
): Promise<PeakCalendarEvent> {
  try {
    const response = await api.patch<PeakCalendarEvent>(
      `/peak-calendar/events/${eventId}`,
      payload
    );
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to update calendar event.");
  }
}

export async function deletePeakCalendarEvent(eventId: number): Promise<void> {
  try {
    await api.delete(`/peak-calendar/events/${eventId}`);
  } catch (error) {
    handleApiError(error, "Failed to delete calendar event.");
  }
}

export async function seedData(): Promise<{
  status: string;
  message: string;
  sprint_id: number;
  day_plans_created?: number;
  tasks_created?: number;
}> {
  try {
    const response = await api.post("/seed");
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to seed backend data.");
  }
}

export async function seedJournalOptions(): Promise<any> {
  try {
    const response = await api.post("/journal/seed-options");
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to seed journal options.");
  }
}

export async function getJournal(date: string): Promise<DailyJournal> {
  try {
    const response = await api.get<DailyJournal>(`/journal/${date}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to load daily journal.");
  }
}

export async function updateJournal(
  date: string,
  entries: JournalEntryPayload[]
): Promise<DailyJournal> {
  try {
    const response = await api.patch<DailyJournal>(`/journal/${date}`, {
      entries,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to update daily journal.");
  }
}

export async function getJournalSummary(date: string): Promise<any> {
  try {
    const response = await api.get(`/journal/${date}/summary`);
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to load journal summary.");
  }
}

export async function updateTaskStatus(
  taskId: number,
  status: TaskStatus
): Promise<Task> {
  try {
    const response = await api.patch<Task>(`/tasks/${taskId}/status`, { status });
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to update task status.");
  }
}

export async function updateDayPriority(
  date: string,
  payload: DayPriorityUpdatePayload
): Promise<DayPlan> {
  try {
    const response = await api.patch<DayPlan>(`/days/${date}/priority`, payload);
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to update today's priority.");
  }
}

export async function createActivityLog(
  payload: ActivityLogPayload
): Promise<ActivityLog> {
  try {
    const response = await api.post<ActivityLog>("/logs", payload);
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to create activity log.");
  }
}

export async function updateChecklist(
  date: string,
  payload: ChecklistUpdatePayload
): Promise<DailyChecklist> {
  try {
    const response = await api.patch<DailyChecklist>(`/checklist/${date}`, payload);
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to update daily checklist.");
  }
}

export async function saveChecklist(
  date: string,
  payload: ChecklistUpdatePayload
): Promise<DailyChecklist> {
  try {
    const response = await api.patch<DailyChecklist>(`/checklist/${date}`, payload);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      try {
        const response = await api.post<DailyChecklist>(`/checklist/${date}`, payload);
        return response.data;
      } catch (createError) {
        handleApiError(createError, "Failed to save daily checklist.");
      }
    }

    handleApiError(error, "Failed to save daily checklist.");
  }
}

export async function updateWhoop(
  date: string,
  payload: WhoopUpdatePayload
): Promise<WhoopManualEntry> {
  try {
    const response = await api.patch<WhoopManualEntry>(`/whoop/${date}`, payload);
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to update WHOOP entry.");
  }
}

export async function saveWhoop(
  date: string,
  payload: WhoopUpdatePayload
): Promise<WhoopManualEntry> {
  try {
    const response = await api.patch<WhoopManualEntry>(`/whoop/${date}`, payload);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      try {
        const response = await api.post<WhoopManualEntry>(`/whoop/${date}`, payload);
        return response.data;
      } catch (createError) {
        handleApiError(createError, "Failed to save WHOOP entry.");
      }
    }

    handleApiError(error, "Failed to save WHOOP entry.");
  }
}

export { api };
