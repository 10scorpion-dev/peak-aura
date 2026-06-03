import type { ActivityLog } from "../types";
import { getCategoryStyles } from "../utils/categoryStyles";

interface ActivityLogListProps {
  logs: ActivityLog[] | null | undefined;
}

function formatCreatedAt(value?: string | null): string {
  if (!value) {
    return "Logged";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Logged";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatLogValue(log: ActivityLog): string {
  const value = log.value?.trim() || "";
  const unit = log.unit?.trim() || "";

  if (value && unit) {
    return `${value} ${unit}`;
  }

  if (value) {
    return value;
  }

  if (log.numeric_value != null && unit) {
    return `${log.numeric_value} ${unit}`;
  }

  if (log.numeric_value != null) {
    return `${log.numeric_value}`;
  }

  return "";
}

export default function ActivityLogList({ logs }: ActivityLogListProps) {
  const safeLogs = logs ?? [];

  if (!safeLogs.length) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-panel backdrop-blur sm:p-5">
        <h2 className="text-xl font-semibold text-white">Evidence Timeline</h2>
        <p className="mt-1 text-sm text-slate-400">Proof of execution captured through the day.</p>
        <p className="mt-4 text-sm text-slate-400">
          No evidence yet. Log one action to start the record.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-panel backdrop-blur sm:p-5">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">Evidence Timeline</h2>
        <p className="mt-1 text-sm text-slate-400">Proof of execution captured through the day.</p>
      </div>

      <div className="space-y-1.5">
        {safeLogs.map((log, index) => {
          const category = log.category ?? "other";
          const categoryStyles = getCategoryStyles(category);
          const title = log.title?.trim() || "Untitled log";
          const value = formatLogValue(log);
          const notes = log.notes?.trim() || "";
          const timestamp = formatCreatedAt(log.created_at);

          return (
            <article
              key={log.id ?? `${category}-${title}-${index}`}
              className="grid grid-cols-[1.35rem_minmax(0,1fr)] gap-2.5"
            >
              <div className="relative flex justify-center">
                <span
                  className={`relative z-10 mt-3 h-2.5 w-2.5 rounded-full ring-4 ring-slate-950/85 ${categoryStyles.dot}`}
                />
                {index !== safeLogs.length - 1 ? (
                  <span className="absolute bottom-[-0.5rem] top-5 w-px bg-white/10" />
                ) : null}
              </div>

              <div
                className={`rounded-2xl border border-white/10 border-l-2 bg-slate-950/40 px-3.5 py-2.5 ${categoryStyles.border}`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${categoryStyles.badge}`}
                      >
                        {category}
                      </span>
                      {value ? (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                          {value}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-2 text-sm font-semibold text-white sm:text-base">{title}</h3>
                    {notes ? <p className="mt-1.5 text-sm text-slate-400">{notes}</p> : null}
                  </div>

                  <span className="shrink-0 whitespace-nowrap text-xs font-medium text-slate-500">
                    {timestamp}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
