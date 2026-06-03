import type { DashboardData, Task } from "../types";

interface SprintProgressProps {
  dashboard: DashboardData | null;
  tasks: Task[];
}

function countDoneTasks(tasks: Task[], category?: string): number {
  return tasks.filter(
    (task) => task.status === "done" && (!category || task.category === category)
  ).length;
}

export default function SprintProgress({ dashboard, tasks }: SprintProgressProps) {
  const totalTasks = tasks.length;
  const doneTasks = countDoneTasks(tasks);
  const dbeTasksDone = countDoneTasks(tasks, "DBE");
  const fitnessTasksDone = countDoneTasks(tasks, "Fitness");
  const golfTasksDone = countDoneTasks(tasks, "Golf");
  const completionPercent = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-panel backdrop-blur sm:p-5">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">Sprint Momentum</h2>
        <p className="mt-1 text-sm text-slate-400">
          Today&apos;s momentum for {dashboard?.date ?? "the selected day"}.
        </p>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-400">Task completion</span>
        <span className="text-sm font-semibold text-white">
          {doneTasks}/{totalTasks} done
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all"
          style={{ width: `${completionPercent}%` }}
        />
      </div>

      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {completionPercent}% complete
      </p>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <article className="rounded-2xl border border-white/10 bg-slate-950/40 px-3.5 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total</p>
          <p className="mt-2 text-2xl font-semibold text-white">{totalTasks}</p>
        </article>
        <article className="rounded-2xl border border-emerald-400/15 bg-emerald-500/10 px-3.5 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">Done</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-200">{doneTasks}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-slate-950/40 px-3.5 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">DBE Done</p>
          <p className="mt-2 text-2xl font-semibold text-white">{dbeTasksDone}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-slate-950/40 px-3.5 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Fitness Done</p>
          <p className="mt-2 text-2xl font-semibold text-white">{fitnessTasksDone}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-slate-950/40 px-3.5 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Golf Done</p>
          <p className="mt-2 text-2xl font-semibold text-white">{golfTasksDone}</p>
        </article>
      </div>
    </section>
  );
}
