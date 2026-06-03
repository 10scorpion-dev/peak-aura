import { useEffect, useMemo, useState } from "react";

import type { Task, TaskStatusValue } from "../types";

interface UpcomingAlertsProps {
  selectedDate: string;
  tasks: Task[];
}

type AlertKind = "live" | "upcoming";

interface AlertState {
  kind: AlertKind;
  task: Task;
}

function isActionableStatus(status: TaskStatusValue): boolean {
  return status === "planned";
}

function isToday(selectedDate: string): boolean {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}` === selectedDate;
}

function parseTaskDateTime(selectedDate: string, value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const [hours, minutes] = value.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  const [year, month, day] = selectedDate.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1, hours, minutes, 0, 0);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getTopAlert(selectedDate: string, tasks: Task[], now: Date): AlertState | null {
  if (!isToday(selectedDate)) {
    return null;
  }

  const activeTasks = tasks.filter((task) => isActionableStatus(task.status));
  const liveTask = activeTasks.find((task) => {
    const start = parseTaskDateTime(selectedDate, task.planned_start);
    const end = parseTaskDateTime(selectedDate, task.planned_end);

    if (!start || !end) {
      return false;
    }

    return now >= start && now <= end;
  });

  if (liveTask) {
    return {
      kind: "live",
      task: liveTask,
    };
  }

  const upcomingTasks = activeTasks
    .map((task) => ({
      task,
      start: parseTaskDateTime(selectedDate, task.planned_start),
    }))
    .filter(
      (entry): entry is { task: Task; start: Date } =>
        entry.start instanceof Date && !Number.isNaN(entry.start.getTime())
    )
    .filter((entry) => {
      const timeUntilStart = entry.start.getTime() - now.getTime();
      return timeUntilStart >= 0 && timeUntilStart <= 15 * 60 * 1000;
    })
    .sort((left, right) => left.start.getTime() - right.start.getTime());

  if (!upcomingTasks.length) {
    return null;
  }

  return {
    kind: "upcoming",
    task: upcomingTasks[0].task,
  };
}

function getAlertMessage(alert: AlertState): string {
  if (alert.kind === "live") {
    return `Live Now: ${alert.task.title}`;
  }

  return `Upcoming: ${alert.task.title} starts at ${alert.task.planned_start ?? "--"}`;
}

function getNotificationKey(selectedDate: string, alert: AlertState): string {
  return `peak-aura-lite-alert:${selectedDate}:${alert.task.id}:${alert.kind}`;
}

export default function UpcomingAlerts({ selectedDate, tasks }: UpcomingAlertsProps) {
  const [now, setNow] = useState(() => new Date());
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }

    return window.Notification.permission;
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setNow(new Date());
  }, [selectedDate, tasks]);

  const alert = useMemo(() => getTopAlert(selectedDate, tasks, now), [now, selectedDate, tasks]);
  const alertMessage = alert ? getAlertMessage(alert) : "No time-based alerts right now.";

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !alert ||
      notificationPermission !== "granted" ||
      !("Notification" in window)
    ) {
      return;
    }

    const notificationKey = getNotificationKey(selectedDate, alert);

    if (window.localStorage.getItem(notificationKey)) {
      return;
    }

    const body =
      alert.kind === "live"
        ? "This task is live now."
        : `Starts at ${alert.task.planned_start ?? "--"}.`;

    new window.Notification("Peak Aura Alert", {
      body: `${alert.task.title}. ${body}`,
    });

    window.localStorage.setItem(notificationKey, "sent");
  }, [alert, notificationPermission, selectedDate]);

  async function handleEnableAlerts(): Promise<void> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    const permission = await window.Notification.requestPermission();
    setNotificationPermission(permission);
  }

  const showEnableButton =
    notificationPermission !== "granted" && notificationPermission !== "unsupported";

  return (
    <section className="rounded-[1.7rem] border border-cyan-400/12 bg-cyan-400/[0.05] p-4 shadow-panel backdrop-blur sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/85">
            Upcoming Alerts
          </p>
          <p className="mt-2 text-sm font-medium text-slate-100">{alertMessage}</p>
          <p className="mt-1 text-xs text-slate-400">
            {isToday(selectedDate)
              ? "Watching today’s planned start times."
              : "Alerts appear only when the selected date is today."}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {notificationPermission === "granted" ? (
            <span className="rounded-full border border-emerald-400/16 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
              Alerts Enabled
            </span>
          ) : null}

          {notificationPermission === "unsupported" ? (
            <span className="rounded-full border border-slate-400/14 bg-slate-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
              Browser Alerts Unavailable
            </span>
          ) : null}

          {notificationPermission === "denied" ? (
            <span className="rounded-full border border-amber-400/16 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100">
              Alerts Blocked
            </span>
          ) : null}

          {showEnableButton ? (
            <button
              type="button"
              onClick={() => void handleEnableAlerts()}
              className="min-h-[38px] rounded-xl border border-cyan-300/18 bg-cyan-300/90 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              Enable Alerts
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
