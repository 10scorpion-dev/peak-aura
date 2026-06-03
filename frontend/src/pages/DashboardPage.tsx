import { type FormEvent, useEffect, useMemo, useState } from "react";

import {
  createActivityLog,
  getDashboard,
  saveChecklist,
  saveWhoop,
  seedData,
  updateTaskStatus,
} from "../api";
import type {
  ActivityLogPayload,
  ChecklistUpdatePayload,
  DailyChecklist,
  DashboardData,
  Task,
  WhoopUpdatePayload,
} from "../types";

const quickLogCategories = [
  "water",
  "commute",
  "study",
  "gym",
  "golf",
  "meal",
  "sleep",
  "mood",
  "reflection",
  "other",
] as const;

const checklistFields: Array<{
  key: keyof Omit<DailyChecklist, "id" | "date" | "notes">;
  label: string;
}> = [
  { key: "wake_0530", label: "Wake 05:30" },
  { key: "gym_cardio_mobility", label: "Gym/Cardio/Mobility" },
  { key: "office_serious", label: "Office serious" },
  { key: "golf_done", label: "Golf done/light as planned" },
  { key: "dbe_block_done", label: "DBE block done" },
  { key: "error_log_updated", label: "Error log updated" },
  { key: "tomorrow_top3_done", label: "Tomorrow Top 3" },
  { key: "sleep_2245", label: "Sleep 22:45" },
];

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getChecklistDefaults(date: string): DailyChecklist {
  return {
    id: 0,
    date,
    wake_0530: false,
    gym_cardio_mobility: false,
    office_serious: false,
    golf_done: false,
    dbe_block_done: false,
    error_log_updated: false,
    tomorrow_top3_done: false,
    sleep_2245: false,
    notes: "",
  };
}

function formatTaskTime(task: Task): string {
  if (task.planned_start && task.planned_end) {
    return `${task.planned_start} - ${task.planned_end}`;
  }

  if (task.planned_start) {
    return task.planned_start;
  }

  if (task.planned_end) {
    return task.planned_end;
  }

  return "Flexible";
}

function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [seedLoading, setSeedLoading] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState<number | null>(null);
  const [savingChecklistKey, setSavingChecklistKey] = useState<string | null>(null);
  const [savingChecklistNotes, setSavingChecklistNotes] = useState(false);
  const [savingWhoop, setSavingWhoop] = useState(false);
  const [savingLog, setSavingLog] = useState(false);
  const [whoopForm, setWhoopForm] = useState({
    recovery_score: "",
    sleep_hours: "",
    hrv: "",
    resting_heart_rate: "",
    strain: "",
    notes: "",
  });
  const [logForm, setLogForm] = useState<ActivityLogPayload>({
    date: getTodayDateString(),
    category: "water",
    title: "",
    value: "",
    notes: "",
  });

  async function loadDashboard(date: string): Promise<void> {
    setLoading(true);
    setError("");

    try {
      const data = await getDashboard(date);
      setDashboard(data);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard.");
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    setLogForm((current) => ({
      ...current,
      date: selectedDate,
    }));
  }, [selectedDate]);

  useEffect(() => {
    const whoop = dashboard?.whoop_manual;

    setWhoopForm({
      recovery_score: whoop?.recovery_score?.toString() ?? "",
      sleep_hours: whoop?.sleep_hours?.toString() ?? "",
      hrv: whoop?.hrv?.toString() ?? "",
      resting_heart_rate: whoop?.resting_heart_rate?.toString() ?? "",
      strain: whoop?.strain?.toString() ?? "",
      notes: whoop?.notes ?? "",
    });
  }, [dashboard?.whoop_manual]);

  const checklist = dashboard?.checklist ?? getChecklistDefaults(selectedDate);

  const dbeCompletion = useMemo(() => {
    const dbeTasks = dashboard?.tasks.filter((task) => task.category === "DBE") ?? [];
    const doneTasks = dbeTasks.filter((task) => task.status === "done").length;

    return `${doneTasks}/${dbeTasks.length}`;
  }, [dashboard?.tasks]);

  async function handleSeed(): Promise<void> {
    setSeedLoading(true);
    setNotice("");
    setError("");

    try {
      const result = await seedData();
      setNotice(result.message);
      await loadDashboard(selectedDate);
    } catch (seedError) {
      console.error(seedError);
      setError(seedError instanceof Error ? seedError.message : "Failed to seed sprint data.");
    } finally {
      setSeedLoading(false);
    }
  }

  async function handleMarkDone(taskId: number): Promise<void> {
    setSavingTaskId(taskId);
    setNotice("");
    setError("");

    try {
      await updateTaskStatus(taskId, "done");
      await loadDashboard(selectedDate);
    } catch (taskError) {
      console.error(taskError);
      setError(taskError instanceof Error ? taskError.message : "Failed to update task.");
    } finally {
      setSavingTaskId(null);
    }
  }

  async function handleChecklistToggle(
    key: keyof Omit<DailyChecklist, "id" | "date" | "notes">,
    value: boolean
  ): Promise<void> {
    setSavingChecklistKey(key);
    setNotice("");
    setError("");

    try {
      const payload = { [key]: value } as ChecklistUpdatePayload;
      await saveChecklist(selectedDate, payload);
      await loadDashboard(selectedDate);
    } catch (checklistError) {
      console.error(checklistError);
      setError(checklistError instanceof Error ? checklistError.message : "Failed to save checklist.");
    } finally {
      setSavingChecklistKey(null);
    }
  }

  async function handleChecklistNotesSave(): Promise<void> {
    setSavingChecklistNotes(true);
    setNotice("");
    setError("");

    try {
      await saveChecklist(selectedDate, { notes: checklist.notes ?? "" });
      await loadDashboard(selectedDate);
      setNotice("Checklist notes saved.");
    } catch (checklistError) {
      console.error(checklistError);
      setError(checklistError instanceof Error ? checklistError.message : "Failed to save checklist notes.");
    } finally {
      setSavingChecklistNotes(false);
    }
  }

  async function handleWhoopSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSavingWhoop(true);
    setNotice("");
    setError("");

    const payload: WhoopUpdatePayload = {
      recovery_score: parseOptionalNumber(whoopForm.recovery_score),
      sleep_hours: parseOptionalNumber(whoopForm.sleep_hours),
      hrv: parseOptionalNumber(whoopForm.hrv),
      resting_heart_rate: parseOptionalNumber(whoopForm.resting_heart_rate),
      strain: parseOptionalNumber(whoopForm.strain),
      notes: whoopForm.notes.trim() || null,
    };

    try {
      await saveWhoop(selectedDate, payload);
      await loadDashboard(selectedDate);
      setNotice("WHOOP entry saved.");
    } catch (whoopError) {
      console.error(whoopError);
      setError(whoopError instanceof Error ? whoopError.message : "Failed to save WHOOP entry.");
    } finally {
      setSavingWhoop(false);
    }
  }

  async function handleLogSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSavingLog(true);
    setNotice("");
    setError("");

    try {
      await createActivityLog({
        ...logForm,
        title: logForm.title.trim(),
        value: logForm.value?.trim() || null,
        notes: logForm.notes?.trim() || null,
      });
      setLogForm({
        date: selectedDate,
        category: "water",
        title: "",
        value: "",
        notes: "",
      });
      await loadDashboard(selectedDate);
      setNotice("Quick log added.");
    } catch (logError) {
      console.error(logError);
      setError(logError instanceof Error ? logError.message : "Failed to create activity log.");
    } finally {
      setSavingLog(false);
    }
  }

  return (
    <main className="dashboard-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Peak Aura Lite</p>
          <h1>Daily Dashboard</h1>
          <p className="hero-copy">
            Track the day, close loops quickly, and keep DBE execution visible.
          </p>
        </div>

        <div className="toolbar">
          <label className="field">
            <span>Date</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>

          <button className="primary-button" onClick={() => void handleSeed()} disabled={seedLoading}>
            {seedLoading ? "Seeding..." : "Seed Sprint Data"}
          </button>
        </div>
      </section>

      {notice ? <div className="notice success">{notice}</div> : null}
      {error ? <div className="notice error">{error}</div> : null}

      {loading ? (
        <section className="panel">
          <p>Loading dashboard...</p>
        </section>
      ) : (
        <>
          <section className="stats-grid">
            <article className="stat-card">
              <span>Daily Score</span>
              <strong>{dashboard?.daily_score ?? 0}/100</strong>
            </article>
            <article className="stat-card">
              <span>WHOOP Recovery</span>
              <strong>
                {dashboard?.whoop_manual?.recovery_score != null
                  ? `${dashboard.whoop_manual.recovery_score}%`
                  : "-"}
              </strong>
            </article>
            <article className="stat-card">
              <span>Sleep Hours</span>
              <strong>
                {dashboard?.whoop_manual?.sleep_hours != null
                  ? dashboard.whoop_manual.sleep_hours
                  : "-"}
              </strong>
            </article>
            <article className="stat-card">
              <span>DBE Completion</span>
              <strong>{dbeCompletion}</strong>
            </article>
            <article className="stat-card">
              <span>Day Type</span>
              <strong>{dashboard?.day_plan?.day_type ?? "No plan"}</strong>
            </article>
          </section>

          <section className="content-grid">
            <div className="stack">
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Today's Plan</h2>
                    <p>{dashboard?.day_plan?.title ?? "No day plan for this date yet."}</p>
                  </div>
                </div>

                {dashboard?.tasks.length ? (
                  <div className="task-list">
                    {dashboard.tasks.map((task) => (
                      <article className="task-row" key={task.id}>
                        <div className="task-main">
                          <span className="task-time">{formatTaskTime(task)}</span>
                          <div>
                            <h3>{task.title}</h3>
                            <p>
                              <span className="pill">{task.category}</span>
                              <span className={`status status-${task.status}`}>{task.status}</span>
                            </p>
                          </div>
                        </div>

                        <button
                          className="secondary-button"
                          onClick={() => void handleMarkDone(task.id)}
                          disabled={task.status === "done" || savingTaskId === task.id}
                        >
                          {savingTaskId === task.id ? "Saving..." : task.status === "done" ? "Done" : "Mark Done"}
                        </button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p>No tasks found for this date.</p>
                )}
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Daily Checklist</h2>
                    <p>Each update saves immediately and refreshes the score.</p>
                  </div>
                </div>

                <div className="checklist-grid">
                  {checklistFields.map((field) => (
                    <label className="check-item" key={field.key}>
                      <input
                        type="checkbox"
                        checked={checklist[field.key]}
                        onChange={(event) => void handleChecklistToggle(field.key, event.target.checked)}
                        disabled={savingChecklistKey === field.key}
                      />
                      <span>{field.label}</span>
                    </label>
                  ))}
                </div>

                <label className="field">
                  <span>Checklist Notes</span>
                  <textarea
                    rows={3}
                    value={checklist.notes ?? ""}
                    onChange={(event) =>
                      setDashboard((current) =>
                        current
                          ? {
                              ...current,
                              checklist: {
                                ...(current.checklist ?? getChecklistDefaults(selectedDate)),
                                notes: event.target.value,
                              },
                            }
                          : current
                      )
                    }
                  />
                </label>

                <button
                  className="secondary-button"
                  onClick={() => void handleChecklistNotesSave()}
                  disabled={savingChecklistNotes}
                >
                  {savingChecklistNotes ? "Saving..." : "Save Checklist Notes"}
                </button>
              </section>
            </div>

            <div className="stack">
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Manual WHOOP Entry</h2>
                    <p>Log recovery and strain manually for the selected day.</p>
                  </div>
                </div>

                <form className="form-grid" onSubmit={handleWhoopSubmit}>
                  <label className="field">
                    <span>Recovery Score</span>
                    <input
                      type="number"
                      value={whoopForm.recovery_score}
                      onChange={(event) =>
                        setWhoopForm((current) => ({ ...current, recovery_score: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Sleep Hours</span>
                    <input
                      type="number"
                      step="0.1"
                      value={whoopForm.sleep_hours}
                      onChange={(event) =>
                        setWhoopForm((current) => ({ ...current, sleep_hours: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>HRV</span>
                    <input
                      type="number"
                      step="0.1"
                      value={whoopForm.hrv}
                      onChange={(event) =>
                        setWhoopForm((current) => ({ ...current, hrv: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Resting Heart Rate</span>
                    <input
                      type="number"
                      value={whoopForm.resting_heart_rate}
                      onChange={(event) =>
                        setWhoopForm((current) => ({ ...current, resting_heart_rate: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Strain</span>
                    <input
                      type="number"
                      step="0.1"
                      value={whoopForm.strain}
                      onChange={(event) =>
                        setWhoopForm((current) => ({ ...current, strain: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field field-wide">
                    <span>Notes</span>
                    <textarea
                      rows={3}
                      value={whoopForm.notes}
                      onChange={(event) =>
                        setWhoopForm((current) => ({ ...current, notes: event.target.value }))
                      }
                    />
                  </label>

                  <button className="primary-button field-wide" type="submit" disabled={savingWhoop}>
                    {savingWhoop ? "Saving..." : "Save WHOOP Entry"}
                  </button>
                </form>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Quick Log</h2>
                    <p>Add a fast activity entry without leaving the dashboard.</p>
                  </div>
                </div>

                <form className="form-grid" onSubmit={handleLogSubmit}>
                  <label className="field">
                    <span>Category</span>
                    <select
                      value={logForm.category}
                      onChange={(event) =>
                        setLogForm((current) => ({ ...current, category: event.target.value }))
                      }
                    >
                      {quickLogCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Title</span>
                    <input
                      type="text"
                      value={logForm.title}
                      onChange={(event) =>
                        setLogForm((current) => ({ ...current, title: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Value</span>
                    <input
                      type="text"
                      value={logForm.value ?? ""}
                      onChange={(event) =>
                        setLogForm((current) => ({ ...current, value: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field field-wide">
                    <span>Notes</span>
                    <textarea
                      rows={3}
                      value={logForm.notes ?? ""}
                      onChange={(event) =>
                        setLogForm((current) => ({ ...current, notes: event.target.value }))
                      }
                    />
                  </label>

                  <button className="primary-button field-wide" type="submit" disabled={savingLog}>
                    {savingLog ? "Saving..." : "Add Quick Log"}
                  </button>
                </form>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Activity Logs</h2>
                    <p>Recent entries for {selectedDate}.</p>
                  </div>
                </div>

                {dashboard?.activity_logs.length ? (
                  <div className="log-list">
                    {dashboard.activity_logs.map((log) => (
                      <article className="log-row" key={log.id}>
                        <div className="log-top">
                          <span className="pill">{log.category}</span>
                          <span className="muted">{log.created_at}</span>
                        </div>
                        <h3>{log.title}</h3>
                        {log.value ? <p>Value: {log.value}</p> : null}
                        {log.notes ? <p>{log.notes}</p> : null}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p>No activity logs yet for this date.</p>
                )}
              </section>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
