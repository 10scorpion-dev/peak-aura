interface SleepPerformanceGaugeProps {
  sleepScore?: number | null;
}

interface SleepZone {
  label: string;
  message: string;
  ringClass: string;
  glowClass: string;
  fillClass: string;
  textClass: string;
}

function clampScore(sleepScore?: number | null): number | null {
  if (sleepScore == null || Number.isNaN(sleepScore)) {
    return null;
  }

  return Math.max(0, Math.min(100, sleepScore));
}

function getSleepZone(score: number | null): SleepZone {
  if (score == null) {
    return {
      label: "No sleep score",
      message: "Add sleep data to calibrate recovery quality.",
      ringClass: "stroke-slate-500/70",
      glowClass: "from-slate-400/12 via-slate-300/6 to-transparent",
      fillClass: "text-slate-300",
      textClass: "text-slate-300",
    };
  }

  if (score <= 69) {
    return {
      label: "Poor",
      message: "Sleep quality is under target. Protect recovery today.",
      ringClass: "stroke-[#FF3D00]",
      glowClass: "from-[#FF3D00]/18 via-[#FF3D00]/8 to-transparent",
      fillClass: "text-orange-100",
      textClass: "text-orange-100",
    };
  }

  if (score <= 84) {
    return {
      label: "Sufficient",
      message: "Sleep is serviceable. Execute, but avoid wasteful intensity.",
      ringClass: "stroke-[#9E9E9E]",
      glowClass: "from-[#9E9E9E]/18 via-[#9E9E9E]/8 to-transparent",
      fillClass: "text-slate-100",
      textClass: "text-slate-200",
    };
  }

  return {
    label: "Optimal",
    message: "Sleep is supporting recovery and stable execution.",
    ringClass: "stroke-[#00C853]",
    glowClass: "from-[#00C853]/18 via-[#00C853]/8 to-transparent",
    fillClass: "text-emerald-100",
    textClass: "text-emerald-100",
  };
}

export default function SleepPerformanceGauge({
  sleepScore,
}: SleepPerformanceGaugeProps) {
  const score = clampScore(sleepScore);
  const zone = getSleepZone(score);
  const radius = 54;
  const circumference = Math.PI * radius;
  const progress = score == null ? 0 : (score / 100) * circumference;
  const dashOffset = circumference - progress;

  return (
    <article className="group relative h-full min-h-[320px] overflow-hidden rounded-[1.6rem] border border-white/12 bg-white/[0.045] p-4 shadow-panel backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-white/14 hover:bg-white/[0.06]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.08),transparent_48%)] opacity-90" />
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${zone.glowClass}`} />

      <div className="relative flex h-full flex-col gap-3.5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Sleep Score
            </p>
            <p className={`mt-2 text-sm font-medium ${zone.textClass}`}>{zone.label}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
            WHOOP
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-1">
          <div className="relative flex h-36 w-full max-w-[12.5rem] items-center justify-center">
            <svg
              viewBox="0 0 140 88"
              className="h-full w-full overflow-visible"
              aria-hidden="true"
            >
              <path
                d="M 16 70 A 54 54 0 0 1 124 70"
                fill="none"
                stroke="rgba(148,163,184,0.18)"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M 16 70 A 54 54 0 0 1 124 70"
                fill="none"
                className={zone.ringClass}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                pathLength={circumference}
                style={{
                  transition: "stroke-dashoffset 400ms ease, stroke 400ms ease",
                }}
              />
            </svg>

            <div className="pointer-events-none absolute inset-x-0 bottom-5 flex flex-col items-center">
              <p className={`text-[2.1rem] font-semibold tracking-tight ${zone.fillClass}`}>
                {score == null ? "--" : `${score}%`}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-slate-500">
                Sleep
              </p>
            </div>
          </div>

          <p className="max-w-[15rem] text-center text-[13px] leading-5 text-slate-400">
            {zone.message}
          </p>
        </div>
      </div>
    </article>
  );
}
