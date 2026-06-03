interface StrainGaugeProps {
  strainScore?: number | null;
}

interface StrainZone {
  label: string;
  message: string;
  ringClass: string;
  glowClass: string;
  fillClass: string;
  textClass: string;
}

function clampStrain(strainScore?: number | null): number | null {
  if (strainScore == null || Number.isNaN(strainScore)) {
    return null;
  }

  return Math.max(0, Math.min(21, strainScore));
}

function getStrainZone(score: number | null): StrainZone {
  if (score == null) {
    return {
      label: "No strain data",
      message: "Add strain data to understand today's load.",
      ringClass: "stroke-slate-500/70",
      glowClass: "from-slate-400/12 via-slate-300/6 to-transparent",
      fillClass: "text-slate-300",
      textClass: "text-slate-300",
    };
  }

  if (score <= 9.9) {
    return {
      label: "Light",
      message: "Minimal stress. Recovery and maintenance focus.",
      ringClass: "stroke-[#00C853]",
      glowClass: "from-[#00C853]/18 via-[#00C853]/8 to-transparent",
      fillClass: "text-emerald-100",
      textClass: "text-emerald-100",
    };
  }

  if (score <= 13.9) {
    return {
      label: "Moderate",
      message: "Maintenance load. Productive without overreaching.",
      ringClass: "stroke-[#FFEB3B]",
      glowClass: "from-[#FFEB3B]/16 via-[#FFEB3B]/6 to-transparent",
      fillClass: "text-yellow-100",
      textClass: "text-yellow-100",
    };
  }

  if (score <= 17.9) {
    return {
      label: "High",
      message: "Building fitness. Respect recovery around the effort.",
      ringClass: "stroke-[#FF9100]",
      glowClass: "from-[#FF9100]/18 via-[#FF9100]/8 to-transparent",
      fillClass: "text-orange-100",
      textClass: "text-orange-100",
    };
  }

  return {
    label: "All Out",
    message: "Maximal effort. Protect recovery after the session.",
    ringClass: "stroke-[#D50000]",
    glowClass: "from-[#D50000]/18 via-[#D50000]/8 to-transparent",
    fillClass: "text-rose-100",
    textClass: "text-rose-100",
  };
}

export default function StrainGauge({ strainScore }: StrainGaugeProps) {
  const score = clampStrain(strainScore);
  const zone = getStrainZone(score);
  const radius = 54;
  const circumference = Math.PI * radius;
  const progress = score == null ? 0 : (score / 21) * circumference;
  const dashOffset = circumference - progress;

  return (
    <article className="group relative h-full min-h-[320px] overflow-hidden rounded-[1.6rem] border border-white/12 bg-white/[0.045] p-4 shadow-panel backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-white/14 hover:bg-white/[0.06]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.08),transparent_48%)] opacity-90" />
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${zone.glowClass}`}
      />

      <div className="relative flex h-full flex-col gap-3.5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Strain
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
                {score == null ? "--" : score.toFixed(1)}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-slate-500">
                Load
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
