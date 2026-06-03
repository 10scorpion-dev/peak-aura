export type TaskStatus = "planned" | "done" | "missed" | "failed";
export type TaskStatusValue = TaskStatus | "skipped";

export interface Sprint {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  main_mission: string;
  secondary_tracks: string | null;
  maintenance_tracks: string | null;
  definition_of_done: string | null;
}

export interface DayPlan {
  id: number;
  sprint_id: number | null;
  date: string;
  title: string;
  day_type: string;
  today_priority: string | null;
  planned_wake_time: string | null;
  planned_sleep_time: string | null;
  notes: string | null;
}

export interface Task {
  id: number;
  sprint_id: number | null;
  day_plan_id: number | null;
  date?: string | null;
  title: string;
  description?: string | null;
  location?: string | null;
  category: string;
  source?: string;
  is_routine?: boolean;
  recurrence_rule?: string | null;
  planned_start: string | null;
  planned_end: string | null;
  status: TaskStatusValue;
  evidence_required: boolean;
  evidence_note: string | null;
}

export interface PeakCalendarEvent {
  id: number;
  title: string;
  date: string | null;
  category: string;
  planned_start: string | null;
  planned_end: string | null;
  status: TaskStatusValue;
  description: string | null;
  location: string | null;
  source: string;
  is_routine: boolean;
  evidence_required: boolean;
}

export interface ActivityLog {
  id: number;
  date: string;
  category: string;
  title: string;
  value: string | null;
  numeric_value: number | null;
  unit: string | null;
  sensitivity: string | null;
  notes: string | null;
  created_at: string;
}

export interface DailyChecklist {
  id: number;
  date: string;
  wake_0530: boolean;
  gym_cardio_mobility: boolean;
  office_serious: boolean;
  golf_done: boolean;
  dbe_block_done: boolean;
  error_log_updated: boolean;
  tomorrow_top3_done: boolean;
  sleep_2245: boolean;
  notes: string | null;
}

export interface WhoopManualEntry {
  id: number;
  date: string;
  recovery_score: number | null;
  sleep_hours: number | null;
  strain: number | null;
  spo2: number | null;
  resting_heart_rate: number | null;
  hrv: number | null;
  calories_burned: number | null;
  calorie_intake: number | null;
  sleep_debt: number | null;
  notes: string | null;
}

export interface DashboardData {
  date: string;
  day_plan: DayPlan | null;
  tasks: Task[];
  activity_logs: ActivityLog[];
  checklist: DailyChecklist | null;
  whoop_manual: WhoopManualEntry | null;
  daily_score: number;
}

export interface ActivityLogPayload {
  date: string;
  category: string;
  title: string;
  value?: string | null;
  numeric_value?: number | null;
  unit?: string | null;
  sensitivity?: string | null;
  notes?: string | null;
}

export interface ChecklistUpdatePayload {
  wake_0530?: boolean;
  gym_cardio_mobility?: boolean;
  office_serious?: boolean;
  golf_done?: boolean;
  dbe_block_done?: boolean;
  error_log_updated?: boolean;
  tomorrow_top3_done?: boolean;
  sleep_2245?: boolean;
  notes?: string | null;
}

export interface WhoopUpdatePayload {
  recovery_score?: number | null;
  sleep_hours?: number | null;
  strain?: number | null;
  spo2?: number | null;
  resting_heart_rate?: number | null;
  hrv?: number | null;
  calories_burned?: number | null;
  calorie_intake?: number | null;
  sleep_debt?: number | null;
  notes?: string | null;
}

export interface DayPriorityUpdatePayload {
  today_priority?: string | null;
}

export interface JournalOption {
  id: number;
  key: string;
  label: string;
  category: string;
  input_type: "boolean" | "number" | "text" | "scale";
  default_unit?: string | null;
  description?: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface JournalItem {
  option_key: string;
  label: string;
  category: string;
  input_type: string;
  default_unit?: string | null;
  boolean_value?: boolean | null;
  number_value?: number | null;
  text_value?: string | null;
  unit?: string | null;
  notes?: string | null;
}

export interface JournalCategory {
  category: string;
  items: JournalItem[];
}

export interface DailyJournal {
  date: string;
  categories: JournalCategory[];
}

export interface JournalEntryPayload {
  option_key: string;
  boolean_value?: boolean | null;
  number_value?: number | null;
  text_value?: string | null;
  unit?: string | null;
  notes?: string | null;
}

export interface PeakCalendarEventCreatePayload {
  date: string;
  title: string;
  category: string;
  planned_start?: string | null;
  planned_end?: string | null;
  description?: string | null;
  location?: string | null;
  sprint_id?: number | null;
  evidence_required?: boolean;
  is_routine?: boolean;
}

export interface PeakCalendarEventUpdatePayload {
  date?: string;
  title?: string;
  category?: string;
  planned_start?: string | null;
  planned_end?: string | null;
  description?: string | null;
  location?: string | null;
  status?: TaskStatus;
  evidence_required?: boolean;
  is_routine?: boolean;
}
