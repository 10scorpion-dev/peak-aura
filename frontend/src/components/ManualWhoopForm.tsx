import { type FormEvent, useEffect, useState } from "react";

import { saveWhoop } from "../api";
import type { WhoopManualEntry, WhoopUpdatePayload } from "../types";

interface ManualWhoopFormProps {
  date: string;
  whoopManual: WhoopManualEntry | null | undefined;
  onUpdated: () => void | Promise<void>;
}

interface WhoopFormState {
  recovery_score: string;
  sleep_hours: string;
  strain: string;
  spo2: string;
  resting_heart_rate: string;
  hrv: string;
  calories_burned: string;
  calorie_intake: string;
  sleep_debt: string;
  notes: string;
}

function getDefaultForm(): WhoopFormState {
  return {
    recovery_score: "",
    sleep_hours: "",
    strain: "",
    spo2: "",
    resting_heart_rate: "",
    hrv: "",
    calories_burned: "",
    calorie_intake: "",
    sleep_debt: "",
    notes: "",
  };
}

function toFormState(whoopManual: WhoopManualEntry | null | undefined): WhoopFormState {
  if (!whoopManual) {
    return getDefaultForm();
  }

  return {
    recovery_score: whoopManual.recovery_score?.toString() ?? "",
    sleep_hours: whoopManual.sleep_hours?.toString() ?? "",
    strain: whoopManual.strain?.toString() ?? "",
    spo2: whoopManual.spo2?.toString() ?? "",
    resting_heart_rate: whoopManual.resting_heart_rate?.toString() ?? "",
    hrv: whoopManual.hrv?.toString() ?? "",
    calories_burned: whoopManual.calories_burned?.toString() ?? "",
    calorie_intake: whoopManual.calorie_intake?.toString() ?? "",
    sleep_debt: whoopManual.sleep_debt?.toString() ?? "",
    notes: whoopManual.notes ?? "",
  };
}

function parseNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseInteger(value: string): number | null {
  const parsed = parseNumber(value);

  if (parsed == null) {
    return null;
  }

  return Math.round(parsed);
}

function getReadinessState(recoveryScore: number | null): {
  label: string;
  className: string;
} {
  if (recoveryScore == null) {
    return {
      label: "No recovery data",
      className: "border-slate-400/15 bg-slate-400/10 text-slate-200",
    };
  }

  if (recoveryScore <= 33) {
    return {
      label: "Low readiness",
      className: "border-rose-400/18 bg-rose-400/10 text-rose-100",
    };
  }

  if (recoveryScore <= 66) {
    return {
      label: "Moderate readiness",
      className: "border-amber-400/18 bg-amber-400/10 text-amber-100",
    };
  }

  return {
    label: "High readiness",
    className: "border-emerald-400/18 bg-emerald-400/10 text-emerald-100",
  };
}

function getSleepDebtState(sleepDebt: number | null): {
  label: string;
  message: string;
  className: string;
} {
  if (sleepDebt == null) {
    return {
      label: "Sleep debt unknown",
      message: "WHOOP sleep debt not entered.",
      className: "border-slate-400/15 bg-slate-400/10 text-slate-200",
    };
  }

  if (sleepDebt > 1.5) {
    return {
      label: "Sleep debt high",
      message: "Sleep debt high. Protect tonight's shutdown.",
      className: "border-rose-400/18 bg-rose-400/10 text-rose-100",
    };
  }

  if (sleepDebt > 0.5) {
    return {
      label: "Mild sleep debt",
      message: "Mild sleep debt. Keep intensity controlled.",
      className: "border-amber-400/18 bg-amber-400/10 text-amber-100",
    };
  }

  return {
    label: "Sleep debt controlled",
    message: "Sleep debt controlled.",
    className: "border-emerald-400/18 bg-emerald-400/10 text-emerald-100",
  };
}

function getTrainingDecision(recoveryScore: number | null, sleepDebt: number | null): string {
  if (recoveryScore == null) {
    return "Add recovery data to calibrate training load.";
  }

  if (sleepDebt != null && sleepDebt > 1.5) {
    return "Protect recovery. Reduce training load and prioritize shutdown.";
  }

  if (recoveryScore <= 33) {
    return "Switch to light cardio, mobility, and sleep protection.";
  }

  if (recoveryScore <= 66) {
    return "Train, but avoid unnecessary intensity.";
  }

  return "Full session allowed if sleep and soreness are normal.";
}

function Field({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-300">{label}</span>
      <input
        type="number"
        step={step}
        className="min-h-[46px] w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export default function ManualWhoopForm({ date, whoopManual, onUpdated }: ManualWhoopFormProps) {
  const [form, setForm] = useState<WhoopFormState>(toFormState(whoopManual));
  const [isSaving, setIsSaving] = useState(false);
  const recoveryScore = parseInteger(form.recovery_score);
  const sleepDebt = parseNumber(form.sleep_debt);
  const readinessState = getReadinessState(recoveryScore);
  const sleepDebtState = getSleepDebtState(sleepDebt);
  const trainingDecision = getTrainingDecision(recoveryScore, sleepDebt);

  useEffect(() => {
    setForm(toFormState(whoopManual));
  }, [whoopManual, date]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSaving(true);

    const payload: WhoopUpdatePayload = {
      recovery_score: parseInteger(form.recovery_score),
      sleep_hours: parseNumber(form.sleep_hours),
      strain: parseNumber(form.strain),
      spo2: parseNumber(form.spo2),
      resting_heart_rate: parseInteger(form.resting_heart_rate),
      hrv: parseNumber(form.hrv),
      calories_burned: parseInteger(form.calories_burned),
      calorie_intake: parseInteger(form.calorie_intake),
      sleep_debt: parseNumber(form.sleep_debt),
      notes: form.notes.trim() || null,
    };

    try {
      await saveWhoop(date, payload);
      await onUpdated();
    } catch (error) {
      console.error("Failed to update WHOOP entry.", error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-panel backdrop-blur sm:p-5">
      <div className="mb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Biological Readiness</h2>
            <p className="mt-1 text-xs text-slate-400">
              Use WHOOP inputs to calibrate today&apos;s load.
            </p>
            <p className="mt-3 text-sm text-slate-300">
              Use this to compare your plan against your body&apos;s actual readiness.
            </p>
          </div>

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${readinessState.className}`}
          >
            <span className="h-2 w-2 rounded-full bg-current opacity-80" />
            {readinessState.label}
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-3 xl:grid-cols-3">
        <article className="rounded-2xl border border-white/8 bg-slate-950/38 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Recovery Zone
          </p>
          <div
            className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${readinessState.className}`}
          >
            <span className="h-2 w-2 rounded-full bg-current opacity-80" />
            {readinessState.label}
          </div>
        </article>

        <article className="rounded-2xl border border-white/8 bg-slate-950/38 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Sleep Debt Signal
          </p>
          <div
            className={`mt-3 inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${sleepDebtState.className}`}
          >
            {sleepDebtState.label}
          </div>
          <p className="mt-3 text-sm text-slate-300">{sleepDebtState.message}</p>
        </article>

        <article className="rounded-2xl border border-white/8 bg-slate-950/38 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Training Decision
          </p>
          <p className="mt-3 text-sm text-slate-300">{trainingDecision}</p>
        </article>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <section className="rounded-2xl border border-white/8 bg-slate-950/38 p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
              Recovery
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Field
              label="Recovery %"
              value={form.recovery_score}
              onChange={(value) => setForm((current) => ({ ...current, recovery_score: value }))}
            />
            <Field
              label="HRV"
              value={form.hrv}
              step="0.1"
              onChange={(value) => setForm((current) => ({ ...current, hrv: value }))}
            />
            <Field
              label="Resting HR"
              value={form.resting_heart_rate}
              onChange={(value) =>
                setForm((current) => ({ ...current, resting_heart_rate: value }))
              }
            />
            <Field
              label="SPO2"
              value={form.spo2}
              step="0.1"
              onChange={(value) => setForm((current) => ({ ...current, spo2: value }))}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-white/8 bg-slate-950/38 p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
              Sleep
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Sleep Hours"
              value={form.sleep_hours}
              step="0.1"
              onChange={(value) => setForm((current) => ({ ...current, sleep_hours: value }))}
            />
            <Field
              label="Sleep Debt"
              value={form.sleep_debt}
              step="0.1"
              onChange={(value) => setForm((current) => ({ ...current, sleep_debt: value }))}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-white/8 bg-slate-950/38 p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
              Load
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Field
              label="Strain"
              value={form.strain}
              step="0.1"
              onChange={(value) => setForm((current) => ({ ...current, strain: value }))}
            />
            <Field
              label="Calories Burned"
              value={form.calories_burned}
              onChange={(value) =>
                setForm((current) => ({ ...current, calories_burned: value }))
              }
            />
            <Field
              label="Calorie Intake"
              value={form.calorie_intake}
              onChange={(value) =>
                setForm((current) => ({ ...current, calorie_intake: value }))
              }
            />
          </div>
        </section>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-300">Notes</span>
          <textarea
            rows={3}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          />
        </label>

        <div>
          <button
            type="submit"
            disabled={isSaving}
            className="min-h-[46px] w-full rounded-2xl border border-cyan-300/15 bg-cyan-300/90 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </section>
  );
}
