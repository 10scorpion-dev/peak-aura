import type { Task } from "../types";

interface DayProfileCardProps {
  dayType?: string | null;
  tasks: Task[];
}

function formatWindow(task: Task | undefined): string | null {
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

  return "Flexible";
}

function normalize(value?: string | null): string {
  return value?.toLowerCase().trim() ?? "";
}

function includesAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}

function getProfileCopy(dayType?: string | null): {
  label: string;
  subtitle: string;
} {
  const normalized = normalize(dayType);

  if (normalized.includes("ufc")) {
    return {
      label: "UFC Gym Day",
      subtitle: "Combat conditioning block",
    };
  }

  if (normalized.includes("us club")) {
    return {
      label: "US Club + Cardio",
      subtitle: "Training window: 06:15-08:00",
    };
  }

  if (normalized.includes("exam")) {
    return {
      label: "Exam Day",
      subtitle: "Calm start. Execute. Recover.",
    };
  }

  if (normalized.includes("weekend")) {
    return {
      label: "Deep Work Day",
      subtitle: "DBE volume + weekly review",
    };
  }

  return {
    label: dayType || "--",
    subtitle: "Operating profile for selected day",
  };
}

function findTrainingTask(tasks: Task[]): Task | undefined {
  return tasks.find((task) => {
    const category = normalize(task.category);
    const title = normalize(task.title);
    return (
      includesAny(category, ["fitness", "gym"]) ||
      includesAny(title, ["gym", "cardio", "mobility", "training"])
    );
  });
}

function findDbeTask(tasks: Task[]): Task | undefined {
  return tasks.find((task) => {
    const category = normalize(task.category);
    const title = normalize(task.title);
    return includesAny(category, ["dbe"]) || includesAny(title, ["dbe", "study", "revision"]);
  });
}

function findShutdownTask(tasks: Task[]): Task | undefined {
  return tasks.find((task) => {
    const category = normalize(task.category);
    const title = normalize(task.title);
    return includesAny(category, ["sleep"]) || includesAny(title, ["daily log", "sleep"]);
  });
}

export default function DayProfileCard({ dayType, tasks }: DayProfileCardProps) {
  const profile = getProfileCopy(dayType);
  const trainingWindow = formatWindow(findTrainingTask(tasks));
  const dbeWindow = formatWindow(findDbeTask(tasks));
  const shutdownWindow = formatWindow(findShutdownTask(tasks));

  return (
    <article className="group relative h-full min-h-[320px] overflow-hidden rounded-[1.6rem] border border-amber-400/12 bg-white/[0.045] p-4 shadow-panel backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-white/14 hover:bg-white/[0.06]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.14),transparent_48%)] opacity-90" />

      <div className="relative flex h-full flex-col gap-3.5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Day Profile
            </p>
            <p className="mt-2.5 text-lg font-semibold tracking-tight text-white">
              {profile.label}
            </p>
            <p className="mt-1 text-[13px] leading-5 text-slate-400">{profile.subtitle}</p>
          </div>

          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/16 bg-slate-950/40">
            <span className="absolute inset-1.5 rounded-[0.9rem] bg-[radial-gradient(circle,rgba(251,191,36,0.16),transparent_70%)]" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-amber-300" />
          </div>
        </div>

        <div className="grid flex-1 gap-2.5 text-sm text-slate-300">
          <div className="rounded-2xl border border-white/8 bg-slate-950/40 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Training Window
            </p>
            <p className="mt-1 text-sm font-medium text-slate-200">{trainingWindow ?? "--"}</p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-slate-950/40 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              DBE Window
            </p>
            <p className="mt-1 text-sm font-medium text-slate-200">{dbeWindow ?? "--"}</p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-slate-950/40 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Shutdown Window
            </p>
            <p className="mt-1 text-sm font-medium text-slate-200">{shutdownWindow ?? "--"}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
