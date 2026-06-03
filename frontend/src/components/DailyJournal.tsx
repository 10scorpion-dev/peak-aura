import { useEffect, useMemo, useState } from "react";

import { getJournal, seedJournalOptions, updateJournal } from "../api";
import type {
  DailyJournal as DailyJournalData,
  JournalCategory,
  JournalEntryPayload,
  JournalItem,
} from "../types";

interface DailyJournalProps {
  date: string;
  onUpdated?: () => void | Promise<void>;
}

interface JournalItemState {
  option_key: string;
  label: string;
  category: string;
  input_type: string;
  default_unit: string | null;
  boolean_value: boolean;
  number_value: string;
  text_value: string;
  unit: string;
  notes: string;
}

const CATEGORY_ORDER = [
  "Sleep Environment",
  "Nutrition",
  "Supplements",
  "Recovery",
  "Symptoms",
  "Mental State",
  "Substances",
  "Training Body",
  "Lifestyle",
  "Travel & Work",
  "Screen & Stimulation",
  "Sexual Health",
  "Other",
] as const;

const DEFAULT_EXPANDED_CATEGORIES = new Set([
  "Recovery",
  "Nutrition",
  "Symptoms",
  "Substances",
]);

const JOURNAL_TABS = [
  "All",
  "Recovery",
  "Nutrition",
  "Symptoms",
  "Sleep",
  "Supplements",
  "Substances",
] as const;

const DAILY_FAVORITE_KEYS = [
  "caffeine",
  "hydration",
  "clean_eating",
  "protein",
  "meditation",
  "morning_sunlight",
  "soreness",
  "fatigue",
  "brain_fog",
  "sleep_disruption",
  "social_media_usage",
] as const;

type JournalTab = (typeof JOURNAL_TABS)[number];

function normalizeJournalItem(
  item: JournalItem,
  category: string
): JournalItem {
  const rawValue = (item as JournalItem & {
    value?: boolean | number | string | null;
  }).value;

  const booleanValue =
    item.boolean_value ?? (typeof rawValue === "boolean" ? rawValue : null);
  const numberValue =
    item.number_value ?? (typeof rawValue === "number" ? rawValue : null);
  const textValue =
    item.text_value ?? (typeof rawValue === "string" ? rawValue : null);

  return {
    option_key: item.option_key,
    label: item.label,
    category,
    input_type: item.input_type,
    default_unit: item.default_unit ?? null,
    boolean_value: booleanValue,
    number_value: numberValue,
    text_value: textValue,
    unit: item.unit ?? item.default_unit ?? null,
    notes: item.notes ?? null,
  };
}

function normalizeJournal(data: DailyJournalData): DailyJournalData {
  const grouped = new Map(
    (data.categories ?? []).map((categoryBlock) => [
      categoryBlock.category,
      {
        category: categoryBlock.category,
        items: (categoryBlock.items ?? []).map((item) =>
          normalizeJournalItem(item, categoryBlock.category)
        ),
      },
    ])
  );

  const normalizedCategories: JournalCategory[] = CATEGORY_ORDER.map((category) => {
    return grouped.get(category) ?? { category, items: [] };
  });

  for (const [category, categoryBlock] of grouped.entries()) {
    if (!CATEGORY_ORDER.includes(category as (typeof CATEGORY_ORDER)[number])) {
      normalizedCategories.push(categoryBlock);
    }
  }

  return {
    date: data.date,
    categories: normalizedCategories,
  };
}

function buildItemStateMap(journal: DailyJournalData): Record<string, JournalItemState> {
  const nextState: Record<string, JournalItemState> = {};

  for (const category of journal.categories) {
    for (const item of category.items) {
      nextState[item.option_key] = {
        option_key: item.option_key,
        label: item.label,
        category: category.category,
        input_type: item.input_type,
        default_unit: item.default_unit ?? null,
        boolean_value: item.boolean_value === true,
        number_value:
          item.number_value != null && !Number.isNaN(item.number_value)
            ? `${item.number_value}`
            : "",
        text_value: item.text_value ?? "",
        unit: item.unit ?? item.default_unit ?? "",
        notes: item.notes ?? "",
      };
    }
  }

  return nextState;
}

function toEntryPayload(item: JournalItemState): JournalEntryPayload {
  const normalizedType = item.input_type.toLowerCase();
  const trimmedText = item.text_value.trim();
  const trimmedNotes = item.notes.trim();

  if (normalizedType === "boolean") {
    return {
      option_key: item.option_key,
      boolean_value: item.boolean_value ? true : null,
      number_value: null,
      text_value: null,
      unit: null,
      notes: trimmedNotes || null,
    };
  }

  if (normalizedType === "number" || normalizedType === "scale") {
    const parsedNumber = item.number_value.trim() ? Number(item.number_value) : null;

    return {
      option_key: item.option_key,
      boolean_value: null,
      number_value:
        parsedNumber != null && !Number.isNaN(parsedNumber) ? parsedNumber : null,
      text_value: null,
      unit: item.unit.trim() || item.default_unit || null,
      notes: trimmedNotes || null,
    };
  }

  return {
    option_key: item.option_key,
    boolean_value: null,
    number_value: null,
    text_value: trimmedText || null,
    unit: item.unit.trim() || item.default_unit || null,
    notes: trimmedNotes || null,
  };
}

function buildInitialPayloadMap(
  journal: DailyJournalData
): Record<string, JournalEntryPayload> {
  const nextState = buildItemStateMap(journal);

  return Object.fromEntries(
    Object.values(nextState).map((item) => [item.option_key, toEntryPayload(item)])
  );
}

function hasMeaningfulPayload(entry: JournalEntryPayload): boolean {
  return (
    entry.boolean_value === true ||
    entry.number_value != null ||
    !!entry.text_value?.trim() ||
    !!entry.notes?.trim()
  );
}

function arePayloadsEqual(
  current: JournalEntryPayload | undefined,
  initial: JournalEntryPayload | undefined
): boolean {
  return JSON.stringify(current ?? null) === JSON.stringify(initial ?? null);
}

function getCategoryMatchScore(category: JournalCategory, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  if (category.category.toLowerCase().includes(normalizedQuery)) {
    return true;
  }

  return category.items.some((item) => item.label.toLowerCase().includes(normalizedQuery));
}

export default function DailyJournal({ date, onUpdated }: DailyJournalProps) {
  const [journal, setJournal] = useState<DailyJournalData | null>(null);
  const [itemsByKey, setItemsByKey] = useState<Record<string, JournalItemState>>({});
  const [initialEntries, setInitialEntries] = useState<Record<string, JournalEntryPayload>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      CATEGORY_ORDER.map((category) => [
        category,
        DEFAULT_EXPANDED_CATEGORIES.has(category),
      ])
    )
  );
  const [notesOpen, setNotesOpen] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<JournalTab>("All");
  const [saveMessage, setSaveMessage] = useState("");

  const visibleCategories = useMemo(() => {
    if (!journal) {
      return [];
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();

    return journal.categories
      .filter((category) => {
        const matchesTab =
          activeTab === "All"
            ? true
            : activeTab === "Sleep"
              ? category.category === "Sleep Environment"
              : category.category === activeTab;

        if (!matchesTab) {
          return false;
        }

        return getCategoryMatchScore(category, searchQuery);
      })
      .map((category) => ({
        ...category,
        items: normalizedQuery
          ? category.items.filter(
              (item) =>
                category.category.toLowerCase().includes(normalizedQuery) ||
                item.label.toLowerCase().includes(normalizedQuery)
            )
          : category.items,
      }));
  }, [activeTab, journal, searchQuery]);

  const favoriteItems = useMemo(() => {
    if (!journal) {
      return [];
    }

    const itemMap = new Map<string, JournalItem>();

    for (const category of journal.categories) {
      for (const item of category.items) {
        itemMap.set(item.option_key, item);
      }
    }

    return DAILY_FAVORITE_KEYS.map((key) => itemMap.get(key)).filter(
      (item): item is JournalItem => !!item
    );
  }, [journal]);

  const hasSeededOptions = useMemo(() => {
    return (journal?.categories ?? []).some((category) => category.items.length > 0);
  }, [journal]);

  async function loadJournalState(targetDate: string): Promise<void> {
    setLoading(true);
    setError("");

    try {
      const response = await getJournal(targetDate);
      const normalized = normalizeJournal(response);
      const nextItems = buildItemStateMap(normalized);
      const nextInitialEntries = buildInitialPayloadMap(normalized);

      setJournal(normalized);
      setItemsByKey(nextItems);
      setInitialEntries(nextInitialEntries);
      setNotesOpen(
        Object.fromEntries(
          Object.values(nextItems).map((item) => [item.option_key, !!item.notes.trim()])
        )
      );
    } catch (loadError) {
      console.error(loadError);
      setError(loadError instanceof Error ? loadError.message : "Failed to load journal.");
      setJournal(null);
      setItemsByKey({});
      setInitialEntries({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSaveMessage("");
    void loadJournalState(date);
  }, [date]);

  function toggleCategory(category: string): void {
    setExpandedCategories((current) => ({
      ...current,
      [category]: !current[category],
    }));
  }

  function updateItem(
    optionKey: string,
    updater: (current: JournalItemState) => JournalItemState
  ): void {
    setSaveMessage("");
    setItemsByKey((current) => {
      const existing = current[optionKey];
      if (!existing) {
        return current;
      }

      return {
        ...current,
        [optionKey]: updater(existing),
      };
    });
  }

  async function handleSeedOptions(): Promise<void> {
    setSeeding(true);
    setError("");
    setSaveMessage("");

    try {
      await seedJournalOptions();
      await loadJournalState(date);
      setSaveMessage("Journal options seeded.");
    } catch (seedError) {
      console.error(seedError);
      setError(
        seedError instanceof Error
          ? seedError.message
          : "Failed to seed journal options."
      );
    } finally {
      setSeeding(false);
    }
  }

  async function handleSave(): Promise<void> {
    const payload = Object.values(itemsByKey)
      .map((item) => toEntryPayload(item))
      .filter((entry) => {
        const initialEntry = initialEntries[entry.option_key];
        return hasMeaningfulPayload(entry) || !arePayloadsEqual(entry, initialEntry);
      });

    setSaving(true);
    setError("");
    setSaveMessage("");

    try {
      const updated = await updateJournal(date, payload);
      const normalized = normalizeJournal(updated);
      const nextItems = buildItemStateMap(normalized);
      setJournal(normalized);
      setItemsByKey(nextItems);
      setInitialEntries(buildInitialPayloadMap(normalized));
      setSaveMessage("Journal saved.");

      if (onUpdated) {
        await onUpdated();
      }
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : "Failed to save journal.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-panel backdrop-blur sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Daily Journal</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Track the factors that shape recovery, sleep, energy, and execution.
          </p>
        </div>

        <div className="w-full sm:max-w-[16rem]">
          <label className="block">
            <span className="sr-only">Search journal items</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search journal factors..."
              className="min-h-[42px] w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </label>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-400/18 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {saveMessage ? (
        <div className="mt-4 rounded-2xl border border-emerald-400/18 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {saveMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-5 rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-10 text-center">
          <p className="text-sm text-slate-400">Loading journal structure...</p>
        </div>
      ) : !hasSeededOptions ? (
        <div className="mt-5 rounded-2xl border border-dashed border-cyan-400/20 bg-cyan-400/5 p-5">
          <h3 className="text-base font-semibold text-white">Journal options not loaded yet</h3>
          <p className="mt-2 text-sm text-slate-300">
            Seed the structured journal catalog first, then this section will load the daily
            options for the selected date.
          </p>
          <button
            type="button"
            onClick={() => void handleSeedOptions()}
            disabled={seeding}
            className="mt-4 min-h-[42px] rounded-2xl border border-cyan-300/15 bg-cyan-300/90 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {seeding ? "Seeding..." : "Seed Journal Options"}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-5 rounded-2xl border border-white/8 bg-slate-950/34 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Daily Checks
            </p>
            {favoriteItems.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                Seed journal options to load favorite checks.
              </p>
            ) : (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {favoriteItems.map((item) => {
                  const state = itemsByKey[item.option_key];

                  if (!state) {
                    return null;
                  }

                  const isChecked = state.input_type.toLowerCase() === "boolean"
                    ? state.boolean_value
                    : state.input_type.toLowerCase() === "number" ||
                        state.input_type.toLowerCase() === "scale"
                      ? !!state.number_value.trim()
                      : !!state.text_value.trim();

                  return (
                    <button
                      key={item.option_key}
                      type="button"
                      onClick={() => {
                        setActiveTab(
                          item.category === "Sleep Environment"
                            ? "Sleep"
                            : JOURNAL_TABS.includes(item.category as JournalTab)
                              ? (item.category as JournalTab)
                              : "All"
                        );
                        setExpandedCategories((current) => ({
                          ...current,
                          [item.category]: true,
                        }));
                      }}
                      className={`rounded-2xl border px-3 py-3 text-left transition ${
                        isChecked
                          ? "border-emerald-400/18 bg-emerald-400/10"
                          : "border-white/8 bg-white/[0.03] hover:border-cyan-400/20 hover:bg-cyan-400/[0.05]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-100">{state.label}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.category}</p>
                        </div>
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            isChecked ? "bg-emerald-300" : "bg-slate-600"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {JOURNAL_TABS.map((tab) => {
              const isActive = activeTab === tab;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                    isActive
                      ? "border-cyan-300/18 bg-cyan-300/12 text-cyan-100"
                      : "border-white/8 bg-white/[0.03] text-slate-300 hover:border-cyan-400/20 hover:text-cyan-100"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div className="mt-5 space-y-3">
            {visibleCategories.map((category) => {
              const isExpanded = expandedCategories[category.category] ?? false;

              return (
                <article
                  key={category.category}
                  className="overflow-hidden rounded-2xl border border-white/8 bg-slate-950/34"
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.category)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03]"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-white">{category.category}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {category.items.length} item{category.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span className="text-lg text-slate-400">{isExpanded ? "−" : "+"}</span>
                  </button>

                  {isExpanded ? (
                    <div className="border-t border-white/6 px-4 py-4">
                      {category.items.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          No options in this category yet.
                        </p>
                      ) : (
                        <div className="grid gap-3 xl:grid-cols-2">
                          {category.items.map((item) => {
                            const state = itemsByKey[item.option_key];
                            const notesVisible =
                              notesOpen[item.option_key] || !!state?.notes.trim();

                            if (!state) {
                              return null;
                            }

                            return (
                              <div
                                key={item.option_key}
                                className="rounded-2xl border border-white/8 bg-white/[0.03] p-3"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-100">
                                      {state.label}
                                    </p>
                                    {state.default_unit ? (
                                      <p className="mt-1 text-xs text-slate-500">
                                        Default unit: {state.default_unit}
                                      </p>
                                    ) : null}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setNotesOpen((current) => ({
                                        ...current,
                                        [item.option_key]: !current[item.option_key],
                                      }))
                                    }
                                    className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300 transition hover:border-cyan-400/20 hover:text-cyan-100"
                                  >
                                    Notes
                                  </button>
                                </div>

                                <div className="mt-3">
                                  {state.input_type.toLowerCase() === "boolean" ? (
                                    <label className="inline-flex items-center gap-3">
                                      <input
                                        type="checkbox"
                                        checked={state.boolean_value}
                                        onChange={(event) =>
                                          updateItem(item.option_key, (current) => ({
                                            ...current,
                                            boolean_value: event.target.checked,
                                          }))
                                        }
                                        className="h-4 w-4 rounded border-white/20 bg-slate-950/60 text-cyan-300 focus:ring-cyan-500/30"
                                      />
                                      <span className="text-sm text-slate-300">
                                        Logged for today
                                      </span>
                                    </label>
                                  ) : state.input_type.toLowerCase() === "number" ||
                                    state.input_type.toLowerCase() === "scale" ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <input
                                        type="number"
                                        inputMode="decimal"
                                        value={state.number_value}
                                        onChange={(event) =>
                                          updateItem(item.option_key, (current) => ({
                                            ...current,
                                            number_value: event.target.value,
                                          }))
                                        }
                                        className="min-h-[42px] min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                                        placeholder="0"
                                      />
                                      <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300">
                                        {state.unit || state.default_unit || "value"}
                                      </span>
                                    </div>
                                  ) : (
                                    <input
                                      type="text"
                                      value={state.text_value}
                                      onChange={(event) =>
                                        updateItem(item.option_key, (current) => ({
                                          ...current,
                                          text_value: event.target.value,
                                        }))
                                      }
                                      className="min-h-[42px] w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                                      placeholder="Add journal detail"
                                    />
                                  )}
                                </div>

                                {notesVisible ? (
                                  <div className="mt-3">
                                    <textarea
                                      rows={2}
                                      value={state.notes}
                                      onChange={(event) =>
                                        updateItem(item.option_key, (current) => ({
                                          ...current,
                                          notes: event.target.value,
                                        }))
                                      }
                                      className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                                      placeholder="Optional notes"
                                    />
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">
              Save the journal after updating the factors you want to track for this date.
            </p>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="min-h-[44px] rounded-2xl border border-cyan-300/15 bg-cyan-300/90 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Journal"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
