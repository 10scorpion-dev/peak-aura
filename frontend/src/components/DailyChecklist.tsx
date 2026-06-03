import { useEffect, useState } from "react";

import { saveChecklist } from "../api";
import type { ChecklistUpdatePayload, DailyChecklist as DailyChecklistData } from "../types";

interface DailyChecklistProps {
  date: string;
  checklist: DailyChecklistData | null;
  onUpdated: () => void | Promise<void>;
}

const checklistItems: Array<{
  key: keyof Omit<DailyChecklistData, "id" | "date" | "notes">;
  label: string;
}> = [
  { key: "wake_0530", label: "Wake 05:30" },
  { key: "gym_cardio_mobility", label: "Gym/Cardio/Mobility" },
  { key: "office_serious", label: "Office serious" },
  { key: "golf_done", label: "Golf done/light as planned" },
  { key: "dbe_block_done", label: "DBE block done" },
  { key: "error_log_updated", label: "Error log updated" },
  { key: "tomorrow_top3_done", label: "Tomorrow Top 3" },
  { key: "sleep_2245", label: "Sleep 22:45" },
];

function getChecklistDefaults(date: string): DailyChecklistData {
  return {
    id: 0,
    date,
    wake_0530: false,
    gym_cardio_mobility: false,
    office_serious: false,
    golf_done: false,
    dbe_block_done: false,
    error_log_updated: false,
    tomorrow_top3_done: false,
    sleep_2245: false,
    notes: "",
  };
}

export default function DailyChecklist({ date, checklist, onUpdated }: DailyChecklistProps) {
  const [localChecklist, setLocalChecklist] = useState<DailyChecklistData>(
    checklist ?? getChecklistDefaults(date)
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const safeChecklist = localChecklist ?? getChecklistDefaults(date);
  const completedCount = checklistItems.filter((item) => safeChecklist[item.key]).length;
  const completionPercent = Math.round((completedCount / checklistItems.length) * 100);

  useEffect(() => {
    setLocalChecklist(checklist ?? getChecklistDefaults(date));
  }, [checklist, date]);

  async function handleToggle(
    key: keyof Omit<DailyChecklistData, "id" | "date" | "notes">,
    checked: boolean
  ): Promise<void> {
    setLocalChecklist((current) => ({ ...current, [key]: checked }));
    setSavingKey(key);

    try {
      const payload = { [key]: checked } as ChecklistUpdatePayload;
      await saveChecklist(date, payload);
      await onUpdated();
    } catch (error) {
      console.error("Failed to update checklist item.", error);
      setLocalChecklist((current) => ({ ...current, [key]: !checked }));
    } finally {
      setSavingKey(null);
    }
  }

  async function handleNotesBlur(): Promise<void> {
    setSavingNotes(true);

    try {
      await saveChecklist(date, { notes: localChecklist.notes ?? "" });
      await onUpdated();
    } catch (error) {
      console.error("Failed to update checklist notes.", error);
    } finally {
      setSavingNotes(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-panel backdrop-blur sm:p-5">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">Shutdown Checklist</h2>
        <p className="mt-1 text-sm text-slate-400">
          Close the loops before sleep.
        </p>
      </div>

      <div className="mb-4 rounded-2xl border border-white/8 bg-slate-950/35 px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Closeout Progress
          </p>
          <p className="text-sm font-semibold text-white">{completedCount}/8 closed</p>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,rgba(16,185,129,0.82),rgba(52,211,153,0.72))] transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {checklistItems.map((item) => {
          const checked = safeChecklist[item.key];

          return (
            <label
              key={item.key}
              className={`group flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-sm transition ${
                checked
                  ? "border-emerald-400/18 bg-emerald-400/10 text-emerald-50"
                  : "border-white/10 bg-slate-950/40 text-slate-200 hover:border-white/14 hover:bg-slate-950/48"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                  checked
                    ? "border-emerald-300/35 bg-emerald-300/18"
                    : "border-slate-600/70 bg-slate-900/70"
                }`}
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-transparent bg-transparent text-emerald-400 focus:ring-emerald-500/40"
                  checked={checked}
                  onChange={(event) => void handleToggle(item.key, event.target.checked)}
                  disabled={savingKey === item.key}
                />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block font-medium">{item.label}</span>
                <span
                  className={`mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.2em] ${
                    checked ? "text-emerald-200/80" : "text-slate-500"
                  }`}
                >
                  {savingKey === item.key ? "Saving..." : checked ? "Closed" : "Open"}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <div className="mt-4">
        <label
          className="mb-2 block text-sm font-medium text-slate-300"
          htmlFor="nightly-checklist-notes"
        >
          Notes
        </label>
        <textarea
          id="nightly-checklist-notes"
          rows={4}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          placeholder="What needs attention before tomorrow?"
          value={safeChecklist.notes ?? ""}
          onChange={(event) =>
            setLocalChecklist((current) => ({
              ...(current ?? getChecklistDefaults(date)),
              notes: event.target.value,
            }))
          }
          onBlur={() => void handleNotesBlur()}
        />
        <p className="mt-2 text-xs text-slate-500">
          {savingNotes ? "Saving notes..." : "Notes save automatically when you leave the field."}
        </p>
      </div>
    </section>
  );
}
