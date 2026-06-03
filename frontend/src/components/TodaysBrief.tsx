import type { DayPlan, Task } from "../types";

interface TodaysBriefProps {
  dayPlan?: DayPlan | null;
  tasks: Task[];
}

function normalize(value?: string | null): string {
  return value?.toLowerCase().trim() ?? "";
}

function includesAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}

function formatTaskTime(task?: Task): string | null {
  if (!task) {
    return null;
  }

  if (task.planned_start && task.planned_end) {
    return `${task.planned_start}-${task.planned_end}`;
  }

  if (task.planned_start) {
    return task.planned_start;
  }

  if (task.planned_end) {
    return task.planned_end;
  }

  return null;
}

function joinLabelAndTime(label: string, time?: string | null): string {
  return time ? `${label}, ${time}` : label;
}

function findPrimaryTask(tasks: Task[]): Task | undefined {
  return tasks.find((task) => includesAny(normalize(task.category), ["dbe"]));
}

function findTrainingTask(tasks: Task[]): Task | undefined {
  return tasks.find((task) => {
    const category = normalize(task.category);
    const title = normalize(task.title);

    return (
      includesAny(category, ["fitness"]) ||
      includesAny(title, ["gym", "ufc", "us club", "cardio", "mobility"])
    );
  });
}

function findGolfTask(tasks: Task[]): Task | undefined {
  return tasks.find((task) => {
    const category = normalize(task.category);
    const title = normalize(task.title);
    return includesAny(category, ["golf"]) || includesAny(title, ["golf"]);
  });
}

function findShutdownTask(tasks: Task[]): Task | undefined {
  return tasks.find((task) => {
    const category = normalize(task.category);
    const title = normalize(task.title);

    return (
      includesAny(category, ["sleep"]) ||
      includesAny(title, ["daily log", "top 3", "tomorrow top 3", "sleep"])
    );
  });
}

function getPrimaryLine(dayPlan: DayPlan | null | undefined, tasks: Task[]): string {
  const primaryTask = findPrimaryTask(tasks);

  if (primaryTask) {
    return joinLabelAndTime(primaryTask.title, formatTaskTime(primaryTask));
  }

  if (dayPlan?.today_priority?.trim()) {
    return dayPlan.today_priority.trim();
  }

  return "Set today’s priority.";
}

function getTrainingLine(tasks: Task[]): string {
  const trainingTask = findTrainingTask(tasks);

  if (!trainingTask) {
    return "No training block.";
  }

  return joinLabelAndTime(trainingTask.title, formatTaskTime(trainingTask));
}

function getGolfLine(tasks: Task[]): string {
  const golfTask = findGolfTask(tasks);

  if (!golfTask) {
    return "No golf block.";
  }

  return formatTaskTime(golfTask) || golfTask.title;
}

function getShutdownLine(tasks: Task[]): string {
  const shutdownTask = findShutdownTask(tasks);

  if (!shutdownTask) {
    return "No shutdown block.";
  }

  if (shutdownTask.title.trim()) {
    const time = formatTaskTime(shutdownTask);

    if (time) {
      if (normalize(shutdownTask.title).includes("sleep")) {
        return `${shutdownTask.title} by ${time}`;
      }

      return `${shutdownTask.title} by ${time}`;
    }

    return shutdownTask.title;
  }

  return "No shutdown block.";
}

export default function TodaysBrief({ dayPlan, tasks }: TodaysBriefProps) {
  const rows = [
    { label: "Primary", value: getPrimaryLine(dayPlan, tasks) },
    { label: "Training", value: getTrainingLine(tasks) },
    { label: "Golf", value: getGolfLine(tasks) },
    { label: "Shutdown", value: getShutdownLine(tasks) },
  ];

  return (
    <section className="rounded-[1.9rem] border border-white/10 bg-white/[0.045] p-4 shadow-panel backdrop-blur sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Today&apos;s Brief</h2>
          <p className="mt-1 text-sm text-slate-400">
            The key blocks worth keeping visible while the day is moving.
          </p>
        </div>

        <div className="hidden rounded-2xl border border-cyan-300/12 bg-cyan-300/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100 sm:inline-flex">
          Focus
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-2xl border border-white/8 bg-slate-950/38 px-3 py-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              {row.label}
            </p>
            <p className="mt-1.5 text-sm leading-6 text-slate-200">{row.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
