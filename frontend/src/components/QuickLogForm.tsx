import { type FormEvent, useEffect, useMemo, useState } from "react";

import { createActivityLog } from "../api";
import type { ActivityLogPayload } from "../types";
import { getCategoryStyles } from "../utils/categoryStyles";

interface QuickLogFormProps {
  date: string;
  onCreated: () => void | Promise<void>;
}

type QuickPreset = {
  label: string;
  values: Partial<ActivityLogPayload>;
};

type SelectOption = {
  value: string;
  label: string;
};

type FieldConfig = {
  valueOptions: SelectOption[];
  unitOptions: SelectOption[];
  defaultValue: string;
  defaultUnit: string;
};

const categoryOptions = [
  "water",
  "coffee",
  "calories",
  "commute",
  "study",
  "gym",
  "golf",
  "meal",
  "sleep",
  "mood",
  "reflection",
  "recovery",
  "other",
] as const;

const quickPresets: QuickPreset[] = [
  {
    label: "Water 500ml",
    values: {
      category: "water",
      title: "Drank water",
      value: "500",
      numeric_value: 500,
      unit: "ml",
    },
  },
  {
    label: "DBE 30m",
    values: {
      category: "study",
      title: "DBE study block",
      value: "30",
      numeric_value: 30,
      unit: "min",
    },
  },
  {
    label: "Solved Questions",
    values: { category: "study", title: "Solved questions", value: "", unit: "count" },
  },
  {
    label: "Error Log Updated",
    values: { category: "study", title: "Error log updated", value: "done", unit: "" },
  },
  {
    label: "Mock Score",
    values: { category: "study", title: "Mock score", value: "", unit: "%" },
  },
  { label: "Gym Done", values: { category: "gym", title: "Gym completed", value: "done", unit: "" } },
  {
    label: "Golf Done",
    values: { category: "golf", title: "Golf practice completed", value: "done", unit: "" },
  },
  { label: "Reflection", values: { category: "reflection", title: "Daily reflection", value: "", unit: "" } },
  {
    label: "Commute",
    values: { category: "commute", title: "Commute", value: "30", numeric_value: 30, unit: "min" },
  },
];

function getDefaultForm(date: string): ActivityLogPayload {
  return {
    date,
    category: "water",
    title: "",
    value: "",
    numeric_value: null,
    unit: "",
    sensitivity: null,
    notes: "",
  };
}

function parseOptionalNumber(value?: string | null): number | null {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function buildNumericOptions(values: number[], suffix = ""): SelectOption[] {
  return values.map((value) => ({
    value: `${value}`,
    label: suffix ? `${value} ${suffix}` : `${value}`,
  }));
}

function buildTextOptions(values: Array<{ value: string; label: string }>): SelectOption[] {
  return values;
}

function getFieldConfig(category: string, title: string): FieldConfig {
  const normalizedCategory = category.trim().toLowerCase();
  const normalizedTitle = title.trim().toLowerCase();

  if (normalizedCategory === "water") {
    return {
      valueOptions: buildNumericOptions([250, 500, 750, 1000]),
      unitOptions: buildTextOptions([{ value: "ml", label: "ml" }]),
      defaultValue: "500",
      defaultUnit: "ml",
    };
  }

  if (normalizedCategory === "coffee") {
    return {
      valueOptions: buildNumericOptions([1, 2, 3], "serving"),
      unitOptions: buildTextOptions([{ value: "serving", label: "serving" }]),
      defaultValue: "1",
      defaultUnit: "serving",
    };
  }

  if (normalizedCategory === "meal") {
    return {
      valueOptions: buildTextOptions([
        { value: "breakfast", label: "Breakfast" },
        { value: "lunch", label: "Lunch" },
        { value: "dinner", label: "Dinner" },
        { value: "snack", label: "Snack" },
      ]),
      unitOptions: buildTextOptions([{ value: "meal", label: "meal" }]),
      defaultValue: "breakfast",
      defaultUnit: "meal",
    };
  }

  if (normalizedCategory === "calories") {
    return {
      valueOptions: buildNumericOptions([100, 200, 300, 400, 500, 600, 800, 1000, 1200]),
      unitOptions: buildTextOptions([{ value: "kcal", label: "kcal" }]),
      defaultValue: "400",
      defaultUnit: "kcal",
    };
  }

  if (normalizedCategory === "study") {
    if (normalizedTitle.includes("question")) {
      return {
        valueOptions: buildNumericOptions([5, 10, 15, 20, 25, 30, 40, 50]),
        unitOptions: buildTextOptions([{ value: "questions", label: "questions" }]),
        defaultValue: "10",
        defaultUnit: "questions",
      };
    }

    if (normalizedTitle.includes("mock")) {
      return {
        valueOptions: buildNumericOptions([40, 50, 60, 70, 80, 90, 100]),
        unitOptions: buildTextOptions([{ value: "%", label: "%" }]),
        defaultValue: "70",
        defaultUnit: "%",
      };
    }

    if (normalizedTitle.includes("error log")) {
      return {
        valueOptions: buildTextOptions([
          { value: "updated", label: "Updated" },
          { value: "reviewed", label: "Reviewed" },
        ]),
        unitOptions: buildTextOptions([{ value: "status", label: "status" }]),
        defaultValue: "updated",
        defaultUnit: "status",
      };
    }

    return {
      valueOptions: buildNumericOptions([15, 30, 45, 60, 90, 120]),
      unitOptions: buildTextOptions([{ value: "min", label: "min" }]),
      defaultValue: "30",
      defaultUnit: "min",
    };
  }

  if (normalizedCategory === "gym" || normalizedCategory === "golf") {
    return {
      valueOptions: buildTextOptions([
        { value: "done", label: "Done" },
        { value: "light", label: "Light" },
        { value: "full", label: "Full" },
      ]),
      unitOptions: buildTextOptions([{ value: "session", label: "session" }]),
      defaultValue: "done",
      defaultUnit: "session",
    };
  }

  if (normalizedCategory === "commute") {
    return {
      valueOptions: buildNumericOptions([15, 30, 45, 60, 90]),
      unitOptions: buildTextOptions([{ value: "min", label: "min" }]),
      defaultValue: "30",
      defaultUnit: "min",
    };
  }

  if (normalizedCategory === "mood" || normalizedCategory === "recovery") {
    return {
      valueOptions: buildNumericOptions([1, 2, 3, 4, 5]),
      unitOptions: buildTextOptions([{ value: "/5", label: "/5" }]),
      defaultValue: "3",
      defaultUnit: "/5",
    };
  }

  if (normalizedCategory === "sleep") {
    return {
      valueOptions: buildTextOptions([
        { value: "6", label: "6" },
        { value: "6.5", label: "6.5" },
        { value: "7", label: "7" },
        { value: "7.5", label: "7.5" },
        { value: "8", label: "8" },
        { value: "8.5", label: "8.5" },
        { value: "9", label: "9" },
      ]),
      unitOptions: buildTextOptions([{ value: "hours", label: "hours" }]),
      defaultValue: "7.5",
      defaultUnit: "hours",
    };
  }

  if (normalizedCategory === "reflection") {
    return {
      valueOptions: buildTextOptions([
        { value: "brief", label: "Brief" },
        { value: "standard", label: "Standard" },
        { value: "deep", label: "Deep" },
      ]),
      unitOptions: buildTextOptions([{ value: "entry", label: "entry" }]),
      defaultValue: "brief",
      defaultUnit: "entry",
    };
  }

  return {
    valueOptions: buildTextOptions([
      { value: "logged", label: "Logged" },
      { value: "complete", label: "Complete" },
    ]),
    unitOptions: buildTextOptions([{ value: "entry", label: "entry" }]),
    defaultValue: "logged",
    defaultUnit: "entry",
  };
}

export default function QuickLogForm({ date, onCreated }: QuickLogFormProps) {
  const [form, setForm] = useState<ActivityLogPayload>(getDefaultForm(date));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fieldConfig = useMemo(
    () => getFieldConfig(form.category, form.title),
    [form.category, form.title]
  );

  useEffect(() => {
    setForm((current) => ({ ...current, date }));
  }, [date]);

  useEffect(() => {
    setForm((current) => {
      const nextValue = fieldConfig.valueOptions.some((option) => option.value === current.value)
        ? current.value
        : fieldConfig.defaultValue;
      const nextUnit = fieldConfig.unitOptions.some((option) => option.value === current.unit)
        ? current.unit
        : fieldConfig.defaultUnit;

      if (nextValue === current.value && nextUnit === current.unit) {
        return current;
      }

      return {
        ...current,
        value: nextValue,
        numeric_value: parseOptionalNumber(nextValue),
        unit: nextUnit,
      };
    });
  }, [fieldConfig]);

  function applyPreset(preset: QuickPreset): void {
    setErrorMessage("");
    setForm((current) => ({
      ...current,
      date,
      category: preset.values.category ?? current.category,
      title: preset.values.title ?? current.title,
      value: preset.values.value ?? current.value,
      numeric_value:
        preset.values.numeric_value ??
        parseOptionalNumber(preset.values.value ?? current.value ?? ""),
      unit: preset.values.unit ?? current.unit ?? "",
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErrorMessage("");
    setIsSaving(true);

    try {
      await createActivityLog({
        date,
        category: form.category,
        title: form.title.trim(),
        value: form.value?.trim() || null,
        numeric_value:
          form.numeric_value ??
          parseOptionalNumber(form.value ?? ""),
        unit: form.unit?.trim() || null,
        sensitivity: form.sensitivity?.trim() || null,
        notes: form.notes?.trim() || null,
      });

      setForm(getDefaultForm(date));
      await onCreated();
    } catch (error) {
      console.error("Failed to create quick log.", error);
      setErrorMessage("Could not save the log. Try again in a moment.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-panel backdrop-blur sm:p-5">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">Quick Evidence</h2>
        <p className="mt-1 text-sm text-slate-400">
          Capture one-off actions, notes, scores, and proof of execution.
        </p>
      </div>

      <div className="mb-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Quick Actions
        </p>

        <div className="flex flex-wrap gap-1.5">
          {quickPresets.map((preset) => {
            const categoryStyles = getCategoryStyles(preset.values.category);

            return (
              <button
                key={preset.label}
                type="button"
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition hover:brightness-110 ${categoryStyles.badge}`}
                onClick={() => applyPreset(preset)}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-2xl border border-rose-400/18 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {errorMessage}
        </div>
      ) : null}

      <form className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6" onSubmit={handleSubmit}>
        <label className="block sm:col-span-1 xl:col-span-2">
          <span className="mb-2 block text-sm font-medium text-slate-300">Category</span>
          <select
            className="min-h-[46px] w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                category: event.target.value,
              }))
            }
          >
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-1 xl:col-span-4">
          <span className="mb-2 block text-sm font-medium text-slate-300">Title</span>
          <input
            type="text"
            required
            className="min-h-[46px] w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            placeholder="What did you do?"
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
          />
        </label>

        <label className="block sm:col-span-1 xl:col-span-2">
          <span className="mb-2 block text-sm font-medium text-slate-300">Value</span>
          <select
            className="min-h-[46px] w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            value={form.value ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                value: event.target.value,
                numeric_value: parseOptionalNumber(event.target.value),
              }))
            }
          >
            {fieldConfig.valueOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-1 xl:col-span-2">
          <span className="mb-2 block text-sm font-medium text-slate-300">Unit</span>
          <select
            className="min-h-[46px] w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            value={form.unit ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                unit: event.target.value,
              }))
            }
          >
            {fieldConfig.unitOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-2 xl:col-span-2">
          <span className="mb-2 block text-sm font-medium text-slate-300">Notes</span>
          <textarea
            rows={3}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            placeholder="Add context if useful."
            value={form.notes ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                notes: event.target.value,
              }))
            }
          />
        </label>

        <div className="sm:col-span-2 xl:col-span-6">
          <button
            type="submit"
            disabled={isSaving}
            className="min-h-[46px] w-full rounded-2xl border border-cyan-300/15 bg-cyan-300/90 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSaving ? "Saving..." : "Add Log"}
          </button>
        </div>
      </form>
    </section>
  );
}
