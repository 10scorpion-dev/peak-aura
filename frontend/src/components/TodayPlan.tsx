import { useState } from "react";

import { updateTaskStatus } from "../api";
import type { Task, TaskStatus } from "../types";
import { getCategoryStyles } from "../utils/categoryStyles";

interface TodayPlanProps {
  tasks: Task[];
  onUpdated: () => void | Promise<void>;
}

const statusStyles: Record<TaskStatus, string> = {
  planned: "border-slate-400/15 bg-slate-400/10 text-slate-200",
  done: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  missed: "border-amber-400/20 bg-amber-400/10 text-amber-100",
  failed: "border-rose-400/20 bg-rose-400/10 text-rose-200",
};

const statusOptions: Array<{ value: TaskStatus; label: string }> = [
  { value: "planned", label: "Planned" },
  { value: "done", label: "Done" },
  { value: "missed", label: "Missed" },
  { value: "failed", label: "Failed" },
];

function normalizeTaskStatus(status: Task["status"]): TaskStatus {
  return status === "skipped" ? "failed" : status;
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

export default function TodayPlan({ tasks, onUpdated }: TodayPlanProps) {
  const [savingTaskId, setSavingTaskId] = useState<number | null>(null);

  async function handleStatusChange(taskId: number, status: TaskStatus): Promise<void> {
    setSavingTaskId(taskId);

    try {
      await updateTaskStatus(taskId, status);
      await onUpdated();
    } catch (error) {
      console.error("Failed to update task status.", error);
    } finally {
      setSavingTaskId(null);
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-panel backdrop-blur sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Mission Timeline</h2>
          <p className="mt-1 text-sm text-slate-400">
            Your planned operating blocks for the day.
          </p>
        </div>
      </div>

      {tasks.length ? (
        <div className="space-y-1.5">
          {tasks.map((task, index) => {
            const categoryStyles = getCategoryStyles(task.category);
            const normalizedStatus = normalizeTaskStatus(task.status);

            return (
              <article
                key={task.id}
                className="grid grid-cols-[1.35rem_minmax(0,1fr)] gap-2.5"
              >
                <div className="relative flex justify-center">
                  <span
                    className={`relative z-10 mt-3 h-2.5 w-2.5 rounded-full ring-4 ring-slate-950/85 ${categoryStyles.dot}`}
                  />
                  {index !== tasks.length - 1 ? (
                    <span className="absolute bottom-[-0.5rem] top-5 w-px bg-white/10" />
                  ) : null}
                </div>

                <div
                  className={`rounded-2xl border border-white/10 border-l-2 bg-slate-950/38 px-3.5 py-2.5 transition hover:border-white/14 hover:bg-slate-950/46 ${categoryStyles.border}`}
                >
                  <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${categoryStyles.text}`}
                      >
                        {formatTaskTime(task)}
                      </p>
                      <h3 className="mt-1.5 text-sm font-semibold leading-6 text-white sm:text-base">
                        {task.title}
                      </h3>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${categoryStyles.badge}`}
                        >
                          {task.category}
                        </span>
                        {task.evidence_required ? (
                          <span className="rounded-full border border-fuchsia-400/18 bg-fuchsia-400/10 px-2.5 py-1 text-[11px] font-semibold text-fuchsia-200">
                            Evidence
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex min-w-[9rem] flex-col gap-1 lg:items-end">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Status
                      </label>
                      <select
                        value={normalizedStatus}
                        onChange={(event) =>
                          void handleStatusChange(task.id, event.target.value as TaskStatus)
                        }
                        disabled={savingTaskId === task.id}
                        className={`min-h-[38px] w-full rounded-xl border px-3 py-2 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60 lg:w-[9rem] ${statusStyles[normalizedStatus]}`}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {savingTaskId === task.id ? (
                        <p className="text-[11px] text-slate-500">Saving...</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-5 text-sm text-slate-400">
          No plan loaded. Seed sprint data to begin.
        </p>
      )}
    </section>
  );
}
