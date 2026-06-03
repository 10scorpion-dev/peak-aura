interface RecoveryGaugeProps {
  recoveryScore?: number | null;
}

interface RecoveryZone {
  label: string;
  message: string;
  ringClass: string;
  glowClass: string;
  fillClass: string;
  textClass: string;
}

function clampScore(recoveryScore?: number | null): number | null {
  if (recoveryScore == null || Number.isNaN(recoveryScore)) {
    return null;
  }

  return Math.max(0, Math.min(100, recoveryScore));
}

function getRecoveryZone(score: number | null): RecoveryZone {
  if (score == null) {
    return {
      label: "No recovery data",
      message: "Enter WHOOP score to calibrate the day.",
      ringClass: "stroke-slate-500/70",
      glowClass: "from-slate-400/12 via-slate-300/6 to-transparent",
      fillClass: "text-slate-300",
      textClass: "text-slate-300",
    };
  }

  if (score <= 33) {
    return {
      label: "Red Zone",
      message: "Protect recovery. Reduce intensity.",
      ringClass: "stroke-rose-400",
      glowClass: "from-rose-400/18 via-rose-300/8 to-transparent",
      fillClass: "text-rose-200",
      textClass: "text-rose-200",
    };
  }

  if (score <= 66) {
    return {
      label: "Yellow Zone",
      message: "Moderate load. Execute carefully.",
      ringClass: "stroke-amber-400",
      glowClass: "from-amber-300/18 via-amber-200/8 to-transparent",
      fillClass: "text-amber-100",
      textClass: "text-amber-100",
    };
  }

  return {
    label: "Green Zone",
    message: "Body is ready. Push key work.",
    ringClass: "stroke-emerald-400",
    glowClass: "from-emerald-400/18 via-emerald-300/8 to-transparent",
    fillClass: "text-emerald-100",
    textClass: "text-emerald-100",
  };
}

export default function RecoveryGauge({ recoveryScore }: RecoveryGaugeProps) {
  const score = clampScore(recoveryScore);
  const zone = getRecoveryZone(score);
  const radius = 54;
  const circumference = Math.PI * radius;
  const progress = score == null ? 0 : (score / 100) * circumference;
  const dashOffset = circumference - progress;

  return (
    <article className="group relative h-full min-h-[320px] overflow-hidden rounded-[1.6rem] border border-cyan-400/12 bg-white/[0.045] p-4 shadow-panel backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-white/14 hover:bg-white/[0.06]">
      <div
        className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.08),transparent_48%)] opacity-90`}
      />
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${zone.glowClass}`}
      />

      <div className="relative flex h-full flex-col gap-3.5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Recovery
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
                  transition:
                    "stroke-dashoffset 400ms ease, stroke 400ms ease",
                }}
              />
            </svg>

            <div className="pointer-events-none absolute inset-x-0 bottom-5 flex flex-col items-center">
              <p className={`text-[2.1rem] font-semibold tracking-tight ${zone.fillClass}`}>
                {score == null ? "--" : `${score}%`}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-slate-500">
                Readiness
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
