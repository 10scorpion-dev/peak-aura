import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  DatesSetArg,
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  EventDropArg,
  EventInput,
  MoreLinkArg,
} from "@fullcalendar/core/index.js";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg, EventResizeDoneArg } from "@fullcalendar/interaction/index.js";
import listPlugin from "@fullcalendar/list";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";

import {
  createPeakCalendarEvent,
  deletePeakCalendarEvent,
  getPeakCalendarEvents,
  updatePeakCalendarEvent,
} from "../api";
import type {
  PeakCalendarEvent,
  PeakCalendarEventCreatePayload,
  TaskStatus,
} from "../types";
import { getCategoryStyles } from "../utils/categoryStyles";

interface PeakAuraCalendarProps {
  selectedDate?: string;
  sprintId?: number | null;
  onUpdated?: () => Promise<void> | void;
}

interface EventDraft {
  id?: number;
  title: string;
  category: string;
  date: string;
  planned_start: string;
  planned_end: string;
  description: string;
  location: string;
  status: TaskStatus;
  evidence_required: boolean;
  is_routine: boolean;
}

interface VisibleRange {
  start: string;
  end: string;
}

const CATEGORY_OPTIONS = [
  "DBE",
  "Fitness",
  "Golf",
  "Office",
  "Recovery",
  "Sleep",
  "Admin",
  "Other",
] as const;

const STATUS_OPTIONS: TaskStatus[] = ["planned", "done", "missed", "failed"];

const EMPTY_DRAFT: EventDraft = {
  title: "",
  category: "DBE",
  date: "",
  planned_start: "09:00",
  planned_end: "10:00",
  description: "",
  location: "",
  status: "planned",
  evidence_required: false,
  is_routine: false,
};

function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeLocal(date: Date): string {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function shiftMinutes(value: string, minutesToAdd: number): string {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  date.setMinutes(date.getMinutes() + minutesToAdd);
  return formatTimeLocal(date);
}

function formatVisibleEnd(exclusiveEnd: Date): string {
  const inclusiveEnd = new Date(exclusiveEnd);
  inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);
  return formatDateLocal(inclusiveEnd);
}

function formatEventTimeLabel(
  startTime?: string | null,
  endTime?: string | null
): string {
  if (startTime && endTime) {
    const startDate = new Date(`2000-01-01T${startTime}:00`);
    const endDate = new Date(`2000-01-01T${endTime}:00`);
    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
  }

  if (startTime) {
    const date = new Date(`2000-01-01T${startTime}:00`);
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  return "";
}

function getEventStart(date: string | null, plannedStart: string | null): string {
  if (!date) {
    return new Date().toISOString();
  }

  if (plannedStart) {
    return `${date}T${plannedStart}:00`;
  }

  return date;
}

function getEventEnd(
  date: string | null,
  plannedStart: string | null,
  plannedEnd: string | null
): string | undefined {
  if (!date) {
    return undefined;
  }

  if (plannedEnd) {
    return `${date}T${plannedEnd}:00`;
  }

  if (plannedStart) {
    return `${date}T${shiftMinutes(plannedStart, 60)}:00`;
  }

  return undefined;
}

function buildEventInput(event: PeakCalendarEvent): EventInput {
  return {
    id: `${event.id}`,
    title: event.title,
    start: getEventStart(event.date, event.planned_start),
    end: getEventEnd(event.date, event.planned_start, event.planned_end),
    allDay: !event.planned_start,
    extendedProps: {
      rawEvent: event,
    },
  };
}

function createTimeOptions(): string[] {
  const options: string[] = [];

  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 15) {
      options.push(`${`${hour}`.padStart(2, "0")}:${`${minute}`.padStart(2, "0")}`);
    }
  }

  return options;
}

function getMiniMonthDays(anchorDate: Date): Array<{
  isoDate: string;
  dayNumber: number;
  isCurrentMonth: boolean;
}> {
  const firstDayOfMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const start = new Date(firstDayOfMonth);
  start.setDate(start.getDate() - start.getDay());

  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      isoDate: formatDateLocal(date),
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === anchorDate.getMonth(),
    };
  });
}

function createDraftFromSelection(
  date: string,
  plannedStart: string,
  plannedEnd: string
): EventDraft {
  return {
    ...EMPTY_DRAFT,
    date,
    planned_start: plannedStart,
    planned_end: plannedEnd,
  };
}

function createDraftFromEvent(event: PeakCalendarEvent): EventDraft {
  return {
    id: event.id,
    title: event.title,
    category: event.category,
    date: event.date ?? "",
    planned_start: event.planned_start ?? "",
    planned_end: event.planned_end ?? "",
    description: event.description ?? "",
    location: event.location ?? "",
    status: event.status === "skipped" ? "failed" : (event.status as TaskStatus),
    evidence_required: event.evidence_required,
    is_routine: event.is_routine,
  };
}

function formatSheetDate(value: string): { weekday: string; fullDate: string } {
  const date = parseIsoDate(value);

  return {
    weekday: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date),
    fullDate: new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date),
  };
}

export default function PeakAuraCalendar({
  selectedDate,
  sprintId,
  onUpdated,
}: PeakAuraCalendarProps) {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [events, setEvents] = useState<PeakCalendarEvent[]>([]);
  const [visibleRange, setVisibleRange] = useState<VisibleRange | null>(null);
  const [calendarError, setCalendarError] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [calendarTitle, setCalendarTitle] = useState("");
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [miniMonthAnchor, setMiniMonthAnchor] = useState<Date>(() =>
    selectedDate ? parseIsoDate(selectedDate) : new Date()
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const [moreEventsDate, setMoreEventsDate] = useState<string | null>(null);
  const [draft, setDraft] = useState<EventDraft>({
    ...EMPTY_DRAFT,
    date: selectedDate ?? formatDateLocal(new Date()),
  });

  const timeOptions = useMemo(() => createTimeOptions(), []);
  const miniMonthDays = useMemo(() => getMiniMonthDays(miniMonthAnchor), [miniMonthAnchor]);
  const eventInputs = useMemo(() => events.map(buildEventInput), [events]);
  const calendarHeight =
    currentView === "dayGridMonth" || currentView === "listWeek" ? "auto" : 760;
  const moreEventsForDate = useMemo(() => {
    if (!moreEventsDate) {
      return [];
    }

    return events
      .filter((event) => event.date === moreEventsDate)
      .sort((first, second) => {
        const firstTime = first.planned_start ?? "99:99";
        const secondTime = second.planned_start ?? "99:99";
        return firstTime.localeCompare(secondTime) || first.title.localeCompare(second.title);
      });
  }, [events, moreEventsDate]);
  const moreEventsSheetDate = useMemo(
    () => (moreEventsDate ? formatSheetDate(moreEventsDate) : null),
    [moreEventsDate]
  );

  const loadEvents = useCallback(
    async (range: VisibleRange) => {
      setLoadingEvents(true);
      setCalendarError("");

      try {
        const data = await getPeakCalendarEvents({
          start_date: range.start,
          end_date: range.end,
          sprint_id: sprintId,
        });
        setEvents(data);
      } catch (error) {
        console.error(error);
        setCalendarError(
          error instanceof Error ? error.message : "Failed to load calendar events."
        );
      } finally {
        setLoadingEvents(false);
      }
    },
    [sprintId]
  );

  useEffect(() => {
    if (visibleRange) {
      void loadEvents(visibleRange);
    }
  }, [loadEvents, visibleRange]);

  useEffect(() => {
    if (!selectedDate || !calendarRef.current) {
      return;
    }

    calendarRef.current.getApi().gotoDate(selectedDate);
  }, [selectedDate]);

  function closeModal(): void {
    setIsModalOpen(false);
    setIsEditMode(false);
    setDraft({
      ...EMPTY_DRAFT,
      date: selectedDate ?? formatDateLocal(new Date()),
    });
  }

  function closeMoreEventsModal(): void {
    setMoreEventsDate(null);
  }

  function openCreateModal(nextDraft?: Partial<EventDraft>): void {
    setDraft({
      ...EMPTY_DRAFT,
      date: selectedDate ?? formatDateLocal(new Date()),
      ...nextDraft,
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  }

  function openEditModal(event: PeakCalendarEvent): void {
    setDraft(createDraftFromEvent(event));
    setIsEditMode(true);
    setIsModalOpen(true);
  }

  async function refreshAfterMutation(): Promise<void> {
    if (visibleRange) {
      await loadEvents(visibleRange);
    }

    await onUpdated?.();
  }

  async function handleSaveEvent(): Promise<void> {
    if (!draft.title.trim() || !draft.date) {
      setCalendarError("Add at least a title and date for the event.");
      return;
    }

    setSavingEvent(true);
    setCalendarError("");

    try {
      if (isEditMode && draft.id != null) {
        await updatePeakCalendarEvent(draft.id, {
          date: draft.date,
          title: draft.title.trim(),
          category: draft.category,
          planned_start: draft.planned_start || null,
          planned_end: draft.planned_end || null,
          description: draft.description.trim() || null,
          location: draft.location.trim() || null,
          status: draft.status,
          evidence_required: draft.evidence_required,
          is_routine: draft.is_routine,
        });
      } else {
        const payload: PeakCalendarEventCreatePayload = {
          date: draft.date,
          title: draft.title.trim(),
          category: draft.category,
          planned_start: draft.planned_start || null,
          planned_end: draft.planned_end || null,
          description: draft.description.trim() || null,
          location: draft.location.trim() || null,
          sprint_id: sprintId,
          evidence_required: draft.evidence_required,
          is_routine: draft.is_routine,
        };

        await createPeakCalendarEvent(payload);
      }

      await refreshAfterMutation();
      closeModal();
    } catch (error) {
      console.error(error);
      setCalendarError(
        error instanceof Error ? error.message : "Failed to save calendar event."
      );
    } finally {
      setSavingEvent(false);
    }
  }

  async function handleDeleteEvent(): Promise<void> {
    if (!draft.id) {
      return;
    }

    setDeletingEvent(true);
    setCalendarError("");

    try {
      await deletePeakCalendarEvent(draft.id);
      await refreshAfterMutation();
      closeModal();
    } catch (error) {
      console.error(error);
      setCalendarError(
        error instanceof Error ? error.message : "Failed to delete calendar event."
      );
    } finally {
      setDeletingEvent(false);
    }
  }

  function handleDatesSet(info: DatesSetArg): void {
    setCalendarTitle(info.view.title);
    setCurrentView(info.view.type);
    setMiniMonthAnchor(info.view.currentStart);
    setVisibleRange({
      start: formatDateLocal(info.start),
      end: formatVisibleEnd(info.end),
    });
  }

  function handleDateClick(info: DateClickArg): void {
    openCreateModal({
      date: info.dateStr,
      planned_start: "09:00",
      planned_end: "10:00",
    });
  }

  function handleSelect(info: DateSelectArg): void {
    const nextDate = formatDateLocal(info.start);

    if (info.allDay) {
      openCreateModal({
        date: nextDate,
        planned_start: "09:00",
        planned_end: "10:00",
      });
      return;
    }

    openCreateModal(
      createDraftFromSelection(nextDate, formatTimeLocal(info.start), formatTimeLocal(info.end))
    );
  }

  function handleEventClick(info: EventClickArg): void {
    const rawEvent = info.event.extendedProps.rawEvent as PeakCalendarEvent | undefined;
    if (rawEvent) {
      closeMoreEventsModal();
      openEditModal(rawEvent);
    }
  }

  function handleMoreLinkClick(arg: MoreLinkArg): void {
    setMoreEventsDate(formatDateLocal(arg.date));
  }

  async function handleEventMove(arg: EventDropArg | EventResizeDoneArg): Promise<void> {
    const eventId = Number(arg.event.id);
    const nextStart = arg.event.start;
    const nextEnd = arg.event.end;

    if (!Number.isFinite(eventId) || !nextStart) {
      arg.revert();
      return;
    }

    try {
      await updatePeakCalendarEvent(eventId, {
        date: formatDateLocal(nextStart),
        planned_start: arg.event.allDay ? null : formatTimeLocal(nextStart),
        planned_end: arg.event.allDay || !nextEnd ? null : formatTimeLocal(nextEnd),
      });
      await refreshAfterMutation();
    } catch (error) {
      console.error(error);
      setCalendarError(
        error instanceof Error ? error.message : "Failed to move calendar event."
      );
      arg.revert();
    }
  }

  function renderEventContent(arg: EventContentArg): JSX.Element {
    const rawEvent = arg.event.extendedProps.rawEvent as PeakCalendarEvent | undefined;
    const category = rawEvent?.category ?? "Other";
    const styles = getCategoryStyles(category);
    const timeLabel = rawEvent
      ? formatEventTimeLabel(rawEvent.planned_start, rawEvent.planned_end)
      : arg.timeText;

    if (arg.view.type === "dayGridMonth") {
      return (
        <div
          className={`flex w-full items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold shadow-sm ${styles.badge}`}
        >
          <span className={`h-2 w-2 shrink-0 rounded-full ${styles.dot}`} />
          <span className="truncate">
            {timeLabel ? `${timeLabel} ` : ""}
            {arg.event.title}
          </span>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col rounded-xl bg-slate-950/70 px-2.5 py-2 text-[11px] text-white">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 shrink-0 rounded-full ${styles.dot}`} />
          <span className="truncate font-semibold">{arg.event.title}</span>
        </div>
        {timeLabel ? (
          <span className="mt-1 truncate text-[10px] text-slate-300">{timeLabel}</span>
        ) : null}
      </div>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 shadow-panel backdrop-blur sm:p-5">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-white">Calendar</h2>
        <p className="text-sm text-slate-400">
          Plan routines, study blocks, training, recovery, and shutdown.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => openCreateModal()}
            className="inline-flex min-h-[52px] items-center justify-center gap-3 rounded-[1.25rem] border border-white/10 bg-slate-900/75 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-400/25 hover:bg-slate-900"
          >
            <span className="text-2xl leading-none text-slate-300">+</span>
            <span>Create event</span>
          </button>

          <div className="rounded-[1.25rem] border border-white/8 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-white">
                {new Intl.DateTimeFormat("en-US", {
                  month: "long",
                  year: "numeric",
                }).format(miniMonthAnchor)}
              </p>
              <button
                type="button"
                onClick={() => calendarRef.current?.getApi().today()}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300 transition hover:border-cyan-400/20 hover:bg-cyan-400/10 hover:text-cyan-100"
              >
                Today
              </button>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1">
              {miniMonthDays.map((day) => {
                const isSelected = selectedDate === day.isoDate;

                return (
                  <button
                    key={day.isoDate}
                    type="button"
                    onClick={() => calendarRef.current?.getApi().gotoDate(day.isoDate)}
                    className={`flex h-8 items-center justify-center rounded-full text-sm transition ${
                      isSelected
                        ? "bg-cyan-400 text-slate-950"
                        : day.isCurrentMonth
                          ? "text-slate-200 hover:bg-white/8"
                          : "text-slate-600 hover:bg-white/5"
                    }`}
                  >
                    {day.dayNumber}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-sm text-slate-400">
              Select a day or time slot to add an internal Peak Aura event.
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          {calendarError ? (
            <div className="mb-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {calendarError}
            </div>
          ) : null}

          <div className="peak-aura-calendar overflow-visible rounded-[1.5rem] border border-white/8 bg-slate-950/45 p-2 sm:p-3">
            <div className="mb-3 flex flex-col gap-3 rounded-[1.15rem] border border-white/6 bg-slate-950/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => calendarRef.current?.getApi().prev()}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl text-slate-200 transition hover:border-cyan-400/20 hover:bg-cyan-400/10 hover:text-cyan-100"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => calendarRef.current?.getApi().next()}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl text-slate-200 transition hover:border-cyan-400/20 hover:bg-cyan-400/10 hover:text-cyan-100"
                >
                  ›
                </button>
                <button
                  type="button"
                  onClick={() => calendarRef.current?.getApi().today()}
                  className="min-h-[44px] rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/20 hover:bg-cyan-400/10 hover:text-cyan-100"
                >
                  Today
                </button>
              </div>

              <p className="text-center text-2xl font-semibold tracking-tight text-white">
                {calendarTitle}
              </p>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {[
                  { label: "Month", view: "dayGridMonth" },
                  { label: "Week", view: "timeGridWeek" },
                  { label: "Day", view: "timeGridDay" },
                  { label: "List", view: "listWeek" },
                ].map((item) => (
                  <button
                    key={item.view}
                    type="button"
                    onClick={() => calendarRef.current?.getApi().changeView(item.view)}
                    className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                      currentView === item.view
                        ? "border-cyan-400/25 bg-cyan-400/14 text-cyan-100"
                        : "border-white/10 bg-white/5 text-slate-200 hover:border-cyan-400/20 hover:bg-cyan-400/10 hover:text-cyan-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="dayGridMonth"
              initialDate={selectedDate}
              headerToolbar={false}
              height={calendarHeight}
              contentHeight={calendarHeight}
              events={eventInputs}
              nowIndicator
              editable
              selectable
              selectMirror
              eventResizableFromStart
              scrollTime="06:00:00"
              scrollTimeReset={false}
              dayMaxEventRows={4}
              moreLinkClick={handleMoreLinkClick}
              slotDuration="00:15:00"
              snapDuration="00:15:00"
              slotLabelInterval="01:00:00"
              slotMinTime="05:00:00"
              slotMaxTime="24:00:00"
              allDaySlot={false}
              firstDay={0}
              eventClassNames={() => [
                "!border-none",
                "!bg-transparent",
                "!shadow-none",
                "cursor-pointer",
              ]}
              datesSet={handleDatesSet}
              dateClick={handleDateClick}
              select={handleSelect}
              eventClick={handleEventClick}
              eventDrop={(arg) => void handleEventMove(arg)}
              eventResize={(arg) => void handleEventMove(arg)}
              eventContent={renderEventContent}
            />

            {loadingEvents ? (
              <div className="mt-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-400">
                Loading calendar events...
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[1.75rem] border border-white/10 bg-[#17181f] p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  {isEditMode ? "Edit event" : "Create event"}
                </p>
                <h3 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  {draft.title || "Add title"}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl text-slate-300 transition hover:border-white/15 hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-300">Title</span>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="DBE Subject 2 deep study"
                  className="min-h-[46px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-medium text-slate-300">Date</span>
                <input
                  type="date"
                  value={draft.date}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, date: event.target.value }))
                  }
                  className="min-h-[46px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-medium text-slate-300">Category</span>
                <select
                  value={draft.category}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, category: event.target.value }))
                  }
                  className="min-h-[46px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-sm font-medium text-slate-300">Start</span>
                <select
                  value={draft.planned_start}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, planned_start: event.target.value }))
                  }
                  className="min-h-[46px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                >
                  {timeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-sm font-medium text-slate-300">End</span>
                <select
                  value={draft.planned_end}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, planned_end: event.target.value }))
                  }
                  className="min-h-[46px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                >
                  {timeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              {isEditMode ? (
                <label>
                  <span className="mb-2 block text-sm font-medium text-slate-300">Status</span>
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        status: event.target.value as TaskStatus,
                      }))
                    }
                    className="min-h-[46px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
                  New events default to planned and stay inside Peak Aura only.
                </div>
              )}

              <label>
                <span className="mb-2 block text-sm font-medium text-slate-300">Location</span>
                <input
                  type="text"
                  value={draft.location}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, location: event.target.value }))
                  }
                  placeholder="US Club, home desk, library..."
                  className="min-h-[46px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </label>

              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-300">Description</span>
                <textarea
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, description: event.target.value }))
                  }
                  rows={4}
                  placeholder="Add context, agenda, or execution notes."
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <input
                  type="checkbox"
                  checked={draft.is_routine}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      is_routine: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-white/20 bg-slate-950/60"
                />
                <span className="text-sm text-slate-200">Routine event</span>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <input
                  type="checkbox"
                  checked={draft.evidence_required}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      evidence_required: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-white/20 bg-slate-950/60"
                />
                <span className="text-sm text-slate-200">Evidence required</span>
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {isEditMode ? (
                  <button
                    type="button"
                    onClick={() => void handleDeleteEvent()}
                    disabled={deletingEvent || savingEvent}
                    className="min-h-[44px] rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingEvent ? "Deleting..." : "Delete"}
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={savingEvent || deletingEvent}
                  className="min-h-[44px] rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveEvent()}
                  disabled={savingEvent || deletingEvent}
                  className="min-h-[44px] rounded-2xl bg-cyan-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingEvent ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {moreEventsDate && moreEventsSheetDate ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/72 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-[#272a31] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  {moreEventsSheetDate.weekday}
                </p>
                <h3 className="mt-2 text-[1.85rem] font-semibold tracking-tight text-white">
                  {moreEventsSheetDate.fullDate}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeMoreEventsModal}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl text-slate-300 transition hover:border-white/15 hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="mt-5 max-h-[24rem] space-y-3 overflow-auto pr-1">
              {moreEventsForDate.map((event) => {
                const styles = getCategoryStyles(event.category);
                const timeLabel = formatEventTimeLabel(event.planned_start, event.planned_end);

                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => {
                      closeMoreEventsModal();
                      openEditModal(event);
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition hover:brightness-110 ${styles.badge}`}
                  >
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${styles.dot}`} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-inherit">{event.title}</p>
                      <p className="mt-1 text-xs text-slate-200/85">
                        {timeLabel || "Flexible block"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  closeMoreEventsModal();
                  openCreateModal({
                    date: moreEventsDate,
                    planned_start: "09:00",
                    planned_end: "10:00",
                  });
                }}
                className="min-h-[44px] rounded-2xl border border-cyan-400/20 bg-cyan-400/12 px-4 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/18"
              >
                Create event
              </button>
              <button
                type="button"
                onClick={closeMoreEventsModal}
                className="min-h-[44px] rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
