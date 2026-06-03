import type { Task } from "../types";

interface CurrentCommandProps {
  tasks: Task[];
}

function normalizeStatus(status: Task["status"]): string {
  return status === "skipped" ? "failed" : status;
}

function getTaskTime(task: Task | undefined): string {
  if (!task) {
    return "";
  }

  if (task.planned_start && task.planned_end) {
    return `${task.planned_start} - ${task.planned_end}`;
  }

  if (task.planned_start) {
    return task.planned_start;
  }

  if (task.planned_end) {
    return task.planned_end;
  }

  return "Unscheduled";
}

function getTaskMeta(task: Task | undefined): string {
  if (!task) {
    return "";
  }

  const details = [getTaskTime(task), task.category, normalizeStatus(task.status)].filter(Boolean);
  return details.join(" | ");
}

export default function CurrentCommand({ tasks }: CurrentCommandProps) {
  const hasTasks = tasks.length > 0;
  const currentFocusIndex = tasks.findIndex((task) => task.status !== "done");
  const currentFocus = currentFocusIndex >= 0 ? tasks[currentFocusIndex] : undefined;
  const nextBlock = currentFocusIndex >= 0 ? tasks[currentFocusIndex + 1] : undefined;
  const openDbeTask = tasks.some((task) => task.category === "DBE" && task.status !== "done");

  const currentFocusTitle = !hasTasks
    ? "No plan loaded."
    : currentFocus
      ? currentFocus.title
      : "All planned tasks are closed.";
  const nextBlockTitle = !hasTasks
    ? "Seed sprint data to begin."
    : nextBlock
      ? nextBlock.title
      : "No next block queued.";
  const missionRisk = !hasTasks
    ? "No mission data available."
    : openDbeTask
      ? "DBE study block is still open."
      : "Mission-critical DBE work is closed.";

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-panel backdrop-blur sm:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.09),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(148,163,184,0.08),transparent_32%)]" />

      <div className="relative">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/85">
            Next Best Action
          </p>
          <p className="mt-2 text-sm text-slate-400">
            The day moves one closed loop at a time.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-2xl border border-white/8 bg-slate-950/35 p-3.5 sm:p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Do Now
            </p>
            <p className="mt-3 text-base font-semibold leading-6 text-white sm:text-lg">
              {currentFocusTitle}
            </p>
            {currentFocus ? (
              <p className="mt-2 break-words text-sm text-slate-400">{getTaskMeta(currentFocus)}</p>
            ) : null}
          </article>

          <article className="rounded-2xl border border-white/8 bg-slate-950/35 p-3.5 sm:p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Up Next
            </p>
            <p className="mt-3 text-base font-semibold leading-6 text-white sm:text-lg">
              {nextBlockTitle}
            </p>
            {nextBlock ? (
              <p className="mt-2 break-words text-sm text-slate-400">{getTaskMeta(nextBlock)}</p>
            ) : null}
          </article>

          <article className="rounded-2xl border border-cyan-400/12 bg-cyan-400/[0.04] p-3.5 md:col-span-2 sm:p-4 xl:col-span-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Mission Risk
            </p>
            <p className="mt-3 text-base font-semibold leading-6 text-white sm:text-lg">{missionRisk}</p>
            <p className="mt-2 text-sm text-slate-400">
              {!hasTasks
                ? "Seed or load a day plan to activate command guidance."
                : openDbeTask
                  ? "Keep the mission-critical study block visible until it is closed."
                  : "DBE execution is currently not the blocker for this day."}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
