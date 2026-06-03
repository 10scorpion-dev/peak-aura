import { useEffect, useMemo, useState } from "react";

import { getDashboard, getSprints, seedData } from "../api";
import ActivityLogList from "../components/ActivityLogList";
import DailyJournal from "../components/DailyJournal";
import DayProfileCard from "../components/DayProfileCard";
import JournalSummary from "../components/JournalSummary";
import PeakAuraCalendar from "../components/PeakAuraCalendar";
import QuickLogForm from "../components/QuickLogForm";
import RecoveryGauge from "../components/RecoveryGauge";
import SleepPerformanceGauge from "../components/SleepPerformanceGauge";
import SprintProgress from "../components/SprintProgress";
import StrainGauge from "../components/StrainGauge";
import UpcomingAlerts from "../components/UpcomingAlerts";
import TodayPlan from "../components/TodayPlan";
import type { DashboardData, Sprint, Task } from "../types";

const DEFAULT_DATE = "2026-05-13";

function getScoreStatus(score: number): string {
  if (score === 100) {
    return "Complete";
  }

  if (score >= 76) {
    return "Locked in";
  }

  if (score >= 51) {
    return "In motion";
  }

  if (score >= 26) {
    return "Warming up";
  }

  return "Not started";
}

function getScoreCopy(score: number): string {
  if (score === 100) {
    return "Day closed with discipline.";
  }

  if (score >= 51) {
    return "Execution is moving. Close the remaining loops.";
  }

  if (score >= 1) {
    return "Momentum is building.";
  }

  return "Open the loop. One action is enough.";
}

function parseUtcDate(value: string): Date | null {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatSelectedDateLabel(value: string): string {
  const date = parseUtcDate(value);

  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
}

function shiftDate(value: string, deltaDays: number): string {
  const date = parseUtcDate(value);

  if (!date) {
    return value;
  }

  date.setUTCDate(date.getUTCDate() + deltaDays);

  const nextYear = date.getUTCFullYear();
  const nextMonth = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const nextDay = `${date.getUTCDate()}`.padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function isDateWithinSprint(date: string, sprint: Sprint): boolean {
  return date >= sprint.start_date && date <= sprint.end_date;
}

function getSprintDaySummary(date: string, sprint: Sprint | null): {
  currentDay: number;
  totalDays: number;
} | null {
  if (!sprint || !isDateWithinSprint(date, sprint)) {
    return null;
  }

  const sprintStart = parseUtcDate(sprint.start_date);
  const sprintEnd = parseUtcDate(sprint.end_date);
  const currentDate = parseUtcDate(date);

  if (!sprintStart || !sprintEnd || !currentDate) {
    return null;
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const totalDays =
    Math.floor((sprintEnd.getTime() - sprintStart.getTime()) / millisecondsPerDay) + 1;
  const currentDay =
    Math.floor((currentDate.getTime() - sprintStart.getTime()) / millisecondsPerDay) + 1;

  return { currentDay, totalDays };
}

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(DEFAULT_DATE);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSprints, setLoadingSprints] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [navigationMessage, setNavigationMessage] = useState("");

  const selectedSprint = useMemo(
    () => sprints.find((sprint) => sprint.id === selectedSprintId) ?? null,
    [selectedSprintId, sprints]
  );
  const sprintDaySummary = useMemo(
    () => getSprintDaySummary(selectedDate, selectedSprint),
    [selectedDate, selectedSprint]
  );
  const selectedDateLabel = formatSelectedDateLabel(selectedDate);

  async function loadDashboard(date: string): Promise<void> {
    setLoading(true);
    setError("");

    try {
      const data = await getDashboard(date);
      setDashboard(data);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard.");
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadSprints(options?: {
    preferredSprintId?: number | null;
    resetToSprintStart?: boolean;
  }): Promise<Sprint | null> {
    setLoadingSprints(true);

    try {
      const sprintData = await getSprints();
      setSprints(sprintData);

      const preferredSprintId = options?.preferredSprintId ?? selectedSprintId;
      const nextSprint =
        sprintData.find((sprint) => sprint.id === preferredSprintId) ??
        sprintData.find((sprint) => isDateWithinSprint(selectedDate, sprint)) ??
        sprintData[0] ??
        null;

      setSelectedSprintId(nextSprint?.id ?? null);

      if (
        nextSprint &&
        (options?.resetToSprintStart || preferredSprintId == null) &&
        selectedDate !== nextSprint.start_date
      ) {
        setSelectedDate(nextSprint.start_date);
      }

      return nextSprint;
    } catch (loadSprintsError) {
      console.error(loadSprintsError);
      setError(
        loadSprintsError instanceof Error
          ? loadSprintsError.message
          : "Failed to load sprint data."
      );
      setSprints([]);
      setSelectedSprintId(null);
      return null;
    } finally {
      setLoadingSprints(false);
    }
  }

  async function refreshDashboard(): Promise<void> {
    await loadDashboard(selectedDate);
  }

  useEffect(() => {
    void loadSprints();
  }, []);

  useEffect(() => {
    void loadDashboard(selectedDate);
  }, [selectedDate]);

  async function handleSeed(): Promise<void> {
    setSeeding(true);
    setError("");
    setNotice("");
    setNavigationMessage("");

    try {
      const result = await seedData();
      setNotice(result.message);
      const nextSprint = await loadSprints({
        preferredSprintId: result.sprint_id,
        resetToSprintStart: true,
      });
      await loadDashboard(nextSprint?.start_date ?? selectedDate);
    } catch (seedError) {
      console.error(seedError);
      setError(seedError instanceof Error ? seedError.message : "Failed to seed sprint data.");
    } finally {
      setSeeding(false);
    }
  }

  function handleSprintChange(nextSprintId: number): void {
    const sprint = sprints.find((item) => item.id === nextSprintId);
    setSelectedSprintId(nextSprintId);
    setNavigationMessage("");
    setNotice("");

    if (sprint) {
      setSelectedDate(sprint.start_date);
    }
  }

  function handleStepDay(deltaDays: number): void {
    setNotice("");

    if (!selectedSprint) {
      setNavigationMessage("");
      setSelectedDate((current) => shiftDate(current, deltaDays));
      return;
    }

    const nextDate = shiftDate(selectedDate, deltaDays);

    if (!isDateWithinSprint(nextDate, selectedSprint)) {
      setNavigationMessage(
        deltaDays < 0
          ? "Already at the first day of this sprint."
          : "Already at the last day of this sprint."
      );
      return;
    }

    setNavigationMessage("");
    setSelectedDate(nextDate);
  }

  function handleDateInputChange(nextDate: string): void {
    setNavigationMessage("");
    setNotice("");
    setSelectedDate(nextDate);
  }

  function deriveSleepScoreFromHours(hours?: number | null): number | null {
    if (hours == null || Number.isNaN(hours)) {
      return null;
    }

    return Math.max(0, Math.min(100, Math.round((hours / 8) * 100)));
  }

  const tasks = dashboard?.tasks ?? [];
  const helpfulEmptyState = !loading && !dashboard?.day_plan;
  const dailyScore = dashboard?.daily_score ?? 0;
  const dailyScoreStatus = getScoreStatus(dailyScore);
  const dailyScoreCopy = getScoreCopy(dailyScore);
  const sleepPerformanceScore = useMemo(
    () => deriveSleepScoreFromHours(dashboard?.whoop_manual?.sleep_hours),
    [dashboard?.whoop_manual?.sleep_hours]
  );
  const seedButtonLabel = sprints.length > 0 ? "Re-seed Sprint" : "Seed Sprint Data";
  const heroStatus = loading || loadingSprints
    ? "Loading command data..."
    : dashboard?.day_plan
      ? "Sprint data loaded."
      : "No plan found. Seed sprint data.";

  return (
    <main className="relative isolate min-h-screen overflow-x-hidden bg-command-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050816]" />
        <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_42%)]" />
        <div className="absolute left-[-8%] top-28 h-72 w-72 rounded-full bg-cyan-500/[0.05] blur-3xl" />
        <div className="absolute right-[-10%] top-16 h-80 w-80 rounded-full bg-emerald-500/[0.04] blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 xl:gap-6 xl:px-10">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-command-850 via-command-900 to-command-950 p-5 shadow-panel sm:p-6 lg:p-7">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,360px)] xl:items-stretch">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300 sm:text-sm">
                Peak Aura
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:mt-4 sm:text-5xl">
                Daily Operating System
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Plan the day. Execute the mission. Protect recovery.
              </p>

              <div className="mt-5 max-w-[32rem] rounded-2xl border border-cyan-400/12 bg-slate-950/34 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Execution Score
                    </p>
                    <div className="mt-2 flex items-end gap-2">
                      <p className="text-3xl font-semibold tracking-tight text-white">
                        {dailyScore}
                      </p>
                      <p className="pb-1 text-sm font-medium text-slate-400">/100</p>
                    </div>
                  </div>

                  <span className="inline-flex rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
                    {dailyScoreStatus}
                  </span>
                </div>

                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-900/90 ring-1 ring-white/8">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,0.88),rgba(16,185,129,0.78))] shadow-[0_0_18px_rgba(34,211,238,0.16)] transition-all duration-500"
                    style={{ width: `${dailyScore}%` }}
                  />
                </div>

                <p className="mt-3 text-sm leading-5 text-slate-300">{dailyScoreCopy}</p>
              </div>

              <div className="mt-4 max-w-[32rem]">
                <JournalSummary date={selectedDate} />
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/8 bg-slate-950/30 p-4 sm:p-5">
              <div className="flex h-full flex-col gap-3">
                <div className="w-full">
                  <label
                    htmlFor="sprint-select"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
                  >
                    Sprint
                  </label>
                  <select
                    id="sprint-select"
                    value={selectedSprintId ?? ""}
                    onChange={(event) => handleSprintChange(Number(event.target.value))}
                    disabled={loadingSprints || sprints.length === 0}
                    className="min-h-[46px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sprints.length === 0 ? (
                      <option value="">No sprint loaded</option>
                    ) : null}
                    {sprints.map((sprint) => (
                      <option key={sprint.id} value={sprint.id}>
                        {sprint.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Mission Date
                  </span>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white sm:text-base">
                        {selectedDateLabel}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {sprintDaySummary
                          ? `Day ${sprintDaySummary.currentDay} of ${sprintDaySummary.totalDays}`
                          : selectedDate}
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleStepDay(-1)}
                        className="min-h-[40px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/20 hover:bg-cyan-400/10 hover:text-cyan-100"
                      >
                        Previous Day
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStepDay(1)}
                        className="min-h-[40px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/20 hover:bg-cyan-400/10 hover:text-cyan-100"
                      >
                        Next Day
                      </button>
                    </div>

                    <div className="mt-3">
                      <label
                        htmlFor="mission-date-picker"
                        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500"
                      >
                        Manual date
                      </label>
                      <input
                        id="mission-date-picker"
                        type="date"
                        value={selectedDate}
                        min={selectedSprint?.start_date}
                        max={selectedSprint?.end_date}
                        onChange={(event) => handleDateInputChange(event.target.value)}
                        className="min-h-[42px] w-full rounded-xl border border-white/10 bg-slate-950/55 px-4 py-2 text-sm text-slate-200 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleSeed()}
                  disabled={seeding}
                  className="min-h-[42px] w-full rounded-2xl border border-cyan-400/20 bg-cyan-400/90 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {seeding ? "Seeding..." : seedButtonLabel}
                </button>

                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
                  <p className="text-xs text-slate-300">{heroStatus}</p>
                  {navigationMessage ? (
                    <p className="mt-1 text-xs text-amber-200">{navigationMessage}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        {notice ? (
          <div className="rounded-[1.5rem] border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 shadow-panel">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[1.5rem] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 shadow-panel">
            {error}
          </div>
        ) : null}

        <UpcomingAlerts selectedDate={selectedDate} tasks={tasks} />

        {loading ? (
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 text-center shadow-panel backdrop-blur sm:p-8">
            <div className="mx-auto flex max-w-md flex-col items-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/15 bg-cyan-400/8">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-white">Loading command centre</h2>
              <p className="mt-2 text-sm text-slate-400">
                Pulling the plan, readiness, and evidence for the selected date.
              </p>
            </div>
          </section>
        ) : (
          <div className="flex flex-col gap-5 xl:gap-6">
            <section className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-4">
              <RecoveryGauge recoveryScore={dashboard?.whoop_manual?.recovery_score} />
              <SleepPerformanceGauge sleepScore={sleepPerformanceScore} />
              <StrainGauge strainScore={dashboard?.whoop_manual?.strain} />
              <DayProfileCard dayType={dashboard?.day_plan?.day_type} tasks={tasks} />
            </section>

            {helpfulEmptyState ? (
              <section className="rounded-[1.75rem] border border-dashed border-cyan-400/20 bg-cyan-400/5 p-5 shadow-panel sm:p-6">
                <h2 className="text-xl font-semibold text-white">No day plan found</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                  There is no day plan for {selectedDate}. Seed the sprint data first, then reload
                  this date to bring in the plan, tasks, and dashboard metrics.
                </p>
              </section>
            ) : null}

            <PeakAuraCalendar
              selectedDate={selectedDate}
              sprintId={selectedSprintId}
              onUpdated={refreshDashboard}
            />

            <section className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] xl:gap-6">
              <div className="min-w-0 space-y-5 xl:space-y-6">
                <SprintProgress dashboard={dashboard} tasks={tasks} />
                <TodayPlan tasks={tasks} onUpdated={refreshDashboard} />
                <ActivityLogList logs={dashboard?.activity_logs ?? []} />
              </div>

              <div className="min-w-0 space-y-5 xl:space-y-6">
                <DailyJournal date={selectedDate} onUpdated={refreshDashboard} />
                <QuickLogForm date={selectedDate} onCreated={refreshDashboard} />
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
