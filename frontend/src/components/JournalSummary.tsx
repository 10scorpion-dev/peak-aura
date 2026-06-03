import { useEffect, useMemo, useState } from "react";

import { getJournalSummary } from "../api";

interface JournalSummaryProps {
  date: string;
}

interface JournalSummaryData {
  total_logged: number;
  positives_logged: number;
  negatives_logged: number;
  symptoms_logged: number;
  substances_logged: number;
  recovery_actions_logged: number;
  nutrition_inputs_logged: number;
}

const EMPTY_SUMMARY: JournalSummaryData = {
  total_logged: 0,
  positives_logged: 0,
  negatives_logged: 0,
  symptoms_logged: 0,
  substances_logged: 0,
  recovery_actions_logged: 0,
  nutrition_inputs_logged: 0,
};

function getInterpretation(summary: JournalSummaryData): string {
  if (summary.total_logged === 0) {
    return "No journal data yet.";
  }

  if (summary.symptoms_logged >= 3) {
    return "Multiple symptoms logged. Watch recovery and load.";
  }

  if (summary.substances_logged >= 2) {
    return "Substance load may affect sleep/recovery.";
  }

  if (summary.recovery_actions_logged >= 3) {
    return "Strong recovery support logged.";
  }

  return "Journal inputs are starting to shape the day signal.";
}

export default function JournalSummary({ date }: JournalSummaryProps) {
  const [summary, setSummary] = useState<JournalSummaryData>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const interpretation = useMemo(() => getInterpretation(summary), [summary]);

  useEffect(() => {
    async function loadSummary(): Promise<void> {
      setLoading(true);
      setError("");

      try {
        const data = (await getJournalSummary(date)) as Partial<JournalSummaryData> | undefined;
        setSummary({
          total_logged: data?.total_logged ?? 0,
          positives_logged: data?.positives_logged ?? 0,
          negatives_logged: data?.negatives_logged ?? 0,
          symptoms_logged: data?.symptoms_logged ?? 0,
          substances_logged: data?.substances_logged ?? 0,
          recovery_actions_logged: data?.recovery_actions_logged ?? 0,
          nutrition_inputs_logged: data?.nutrition_inputs_logged ?? 0,
        });
      } catch (loadError) {
        console.error(loadError);
        setError(
          loadError instanceof Error ? loadError.message : "Failed to load journal summary."
        );
        setSummary(EMPTY_SUMMARY);
      } finally {
        setLoading(false);
      }
    }

    void loadSummary();
  }, [date]);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/34 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Journal Signal
          </p>
          <p className="mt-2 text-sm leading-5 text-slate-300">
            {loading ? "Reading the journal signal..." : interpretation}
          </p>
        </div>

        <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
          {summary.total_logged} logged
        </span>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-400/18 bg-rose-400/10 px-3 py-2 text-xs text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Logged Factors
          </p>
          <p className="mt-2 text-xl font-semibold text-white">{summary.total_logged}</p>
        </div>

        <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Recovery Actions
          </p>
          <p className="mt-2 text-xl font-semibold text-white">
            {summary.recovery_actions_logged}
          </p>
        </div>

        <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Symptoms
          </p>
          <p className="mt-2 text-xl font-semibold text-white">{summary.symptoms_logged}</p>
        </div>

        <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Substances
          </p>
          <p className="mt-2 text-xl font-semibold text-white">{summary.substances_logged}</p>
        </div>

        <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 sm:col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Nutrition Inputs
          </p>
          <p className="mt-2 text-xl font-semibold text-white">
            {summary.nutrition_inputs_logged}
          </p>
        </div>
      </div>
    </section>
  );
}
