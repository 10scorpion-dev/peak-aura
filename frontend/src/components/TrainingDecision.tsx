interface TrainingDecisionProps {
  recoveryScore?: number | null;
  sleepHours?: number | null;
  dayType?: string | null;
}

function getDecisionState(recoveryScore?: number | null): {
  message: string;
  toneClass: string;
  badgeClass: string;
  badgeLabel: string;
} {
  if (recoveryScore == null || Number.isNaN(recoveryScore)) {
    return {
      message: "Add recovery data to calibrate training load.",
      toneClass: "border-slate-400/14 bg-slate-400/8",
      badgeClass: "border-slate-400/14 bg-slate-400/10 text-slate-200",
      badgeLabel: "Awaiting Readiness",
    };
  }

  if (recoveryScore <= 33) {
    return {
      message: "Switch to light cardio, mobility, and sleep protection.",
      toneClass: "border-rose-400/16 bg-rose-400/8",
      badgeClass: "border-rose-400/16 bg-rose-400/10 text-rose-100",
      badgeLabel: "Red Zone",
    };
  }

  if (recoveryScore <= 66) {
    return {
      message: "Train, but avoid unnecessary intensity.",
      toneClass: "border-amber-400/16 bg-amber-400/8",
      badgeClass: "border-amber-400/16 bg-amber-400/10 text-amber-100",
      badgeLabel: "Yellow Zone",
    };
  }

  return {
    message: "Full session allowed if sleep and soreness are normal.",
    toneClass: "border-emerald-400/16 bg-emerald-400/8",
    badgeClass: "border-emerald-400/16 bg-emerald-400/10 text-emerald-100",
    badgeLabel: "Green Zone",
  };
}

export default function TrainingDecision({
  recoveryScore,
  sleepHours,
  dayType,
}: TrainingDecisionProps) {
  const decision = getDecisionState(recoveryScore);
  const lowSleep = sleepHours != null && sleepHours < 6;

  return (
    <section
      className={`rounded-[1.85rem] border p-4 shadow-panel backdrop-blur sm:p-5 ${decision.toneClass}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
            Training Decision
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-200">{decision.message}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {dayType ? (
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
              {dayType}
            </span>
          ) : null}
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${decision.badgeClass}`}
          >
            {decision.badgeLabel}
          </span>
        </div>
      </div>

      {lowSleep ? (
        <div className="mt-4 rounded-2xl border border-amber-400/14 bg-amber-400/8 px-3 py-2.5">
          <p className="text-sm text-amber-100">Sleep is low. Protect tonight&apos;s shutdown.</p>
        </div>
      ) : null}
    </section>
  );
}
