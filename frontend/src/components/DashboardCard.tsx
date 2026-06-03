type DashboardCardAccent = "cyan" | "indigo" | "emerald" | "amber";

const accentStyles: Record<
  DashboardCardAccent,
  {
    border: string;
    glow: string;
    orbBorder: string;
    dot: string;
  }
> = {
  cyan: {
    border: "border-cyan-400/12",
    glow: "bg-[radial-gradient(circle,rgba(34,211,238,0.16),transparent_70%)]",
    orbBorder: "border-cyan-300/16",
    dot: "bg-cyan-300",
  },
  indigo: {
    border: "border-indigo-400/12",
    glow: "bg-[radial-gradient(circle,rgba(129,140,248,0.16),transparent_70%)]",
    orbBorder: "border-indigo-300/16",
    dot: "bg-indigo-300",
  },
  emerald: {
    border: "border-emerald-400/12",
    glow: "bg-[radial-gradient(circle,rgba(52,211,153,0.16),transparent_70%)]",
    orbBorder: "border-emerald-300/16",
    dot: "bg-emerald-300",
  },
  amber: {
    border: "border-amber-400/12",
    glow: "bg-[radial-gradient(circle,rgba(251,191,36,0.16),transparent_70%)]",
    orbBorder: "border-amber-300/16",
    dot: "bg-amber-300",
  },
};

interface DashboardCardProps {
  label: string;
  value: string;
  helper?: string;
  className?: string;
  accent?: DashboardCardAccent;
}

export default function DashboardCard({
  label,
  value,
  helper,
  className = "",
  accent = "cyan",
}: DashboardCardProps) {
  const accentStyle = accentStyles[accent];

  return (
    <article
      className={`group relative overflow-hidden rounded-[1.75rem] border bg-white/[0.045] p-4 shadow-panel backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-white/14 hover:bg-white/[0.06] sm:p-5 ${accentStyle.border} ${className}`}
    >
      <div className={`pointer-events-none absolute inset-0 opacity-90 ${accentStyle.glow}`} />

      <div className="relative flex h-full flex-col gap-5 sm:gap-6">
        <div className="flex items-start justify-between gap-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
            {label}
          </p>

          <div
            className={`relative flex h-10 w-10 items-center justify-center rounded-2xl border bg-slate-950/40 sm:h-11 sm:w-11 ${accentStyle.orbBorder}`}
          >
            <span className={`absolute inset-1.5 rounded-[0.9rem] ${accentStyle.glow}`} />
            <span className={`relative h-2.5 w-2.5 rounded-full ${accentStyle.dot}`} />
          </div>
        </div>

        <div className="mt-auto">
          <p className="text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">
            {value}
          </p>
          {helper ? (
            <p className="mt-2 text-[13px] leading-6 text-slate-400 sm:text-sm">{helper}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
