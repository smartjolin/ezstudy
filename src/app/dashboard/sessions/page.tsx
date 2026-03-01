"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Calendar,
  List,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format, formatDistanceToNow, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";

/* ===== Types ===== */
interface Student {
  id: string;
  name: string | null;
  email: string;
}

interface Session {
  id: string;
  title: string | null;
  scheduledAt: string;
  duration: number | null;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  notes: string | null;
  recap: string | null;
  student: { id: string; name: string | null; email: string };
  tutor: { id: string; name: string | null; email: string };
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  SCHEDULED: { bg: "bg-blue-50", text: "text-blue-600", label: "Scheduled" },
  IN_PROGRESS: { bg: "bg-amber-50", text: "text-amber-600", label: "In Progress" },
  COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Completed" },
  CANCELLED: { bg: "bg-gray-100", text: "text-gray-500", label: "Cancelled" },
};

const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
  { value: 90, label: "90 min" },
];

/* ===== Main Page ===== */
export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch("/api/students");
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchStudents();
  }, [fetchSessions, fetchStudents]);

  const handleSessionCreated = (newSession: Session) => {
    setSessions((prev) => [newSession, ...prev]);
    setShowModal(false);
  };

  const handleNotesUpdate = (id: string, notes: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, notes } : s))
    );
  };

  const handleRecapGenerated = (id: string, recap: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, recap } : s))
    );
  };

  // Sessions for a specific day (calendar view)
  const sessionsForDay = selectedDay
    ? sessions.filter((s) => isSameDay(new Date(s.scheduledAt), selectedDay))
    : [];

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-primary-dark">
            Tutoring Sessions
          </h1>
          <p className="mt-1 text-text-secondary">
            Manage your tutoring schedule and session notes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-xl border border-primary-light/20 bg-white p-1">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                view === "list"
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-sm"
                  : "text-text-secondary hover:text-primary-dark"
              }`}
            >
              <List className="h-4 w-4" />
              List
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                view === "calendar"
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-sm"
                  : "text-text-secondary hover:text-primary-dark"
              }`}
            >
              <Calendar className="h-4 w-4" />
              Calendar
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            New Session
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : view === "list" ? (
        /* ===== LIST VIEW ===== */
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-primary-light/30 bg-white/50 p-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-primary-light/50" />
              <p className="mt-4 font-semibold text-primary-dark">
                No sessions yet
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Create your first tutoring session to get started.
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                expanded={expandedId === session.id}
                onToggle={() =>
                  setExpandedId(expandedId === session.id ? null : session.id)
                }
                onNotesUpdate={handleNotesUpdate}
                onRecapGenerated={handleRecapGenerated}
              />
            ))
          )}
        </div>
      ) : (
        /* ===== CALENDAR VIEW ===== */
        <div className="space-y-4">
          <CalendarGrid
            month={calendarMonth}
            sessions={sessions}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onPrevMonth={() => setCalendarMonth(subMonths(calendarMonth, 1))}
            onNextMonth={() => setCalendarMonth(addMonths(calendarMonth, 1))}
          />
          {selectedDay && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-primary-dark">
                Sessions on {format(selectedDay, "MMMM d, yyyy")}
              </h3>
              {sessionsForDay.length === 0 ? (
                <p className="text-sm text-text-secondary">
                  No sessions scheduled for this day.
                </p>
              ) : (
                sessionsForDay.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    expanded={expandedId === session.id}
                    onToggle={() =>
                      setExpandedId(
                        expandedId === session.id ? null : session.id
                      )
                    }
                    onNotesUpdate={handleNotesUpdate}
                    onRecapGenerated={handleRecapGenerated}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* New Session Modal */}
      {showModal && (
        <NewSessionModal
          students={students}
          onClose={() => setShowModal(false)}
          onCreated={handleSessionCreated}
        />
      )}
    </div>
  );
}

/* ===== Session Card ===== */
function SessionCard({
  session,
  expanded,
  onToggle,
  onNotesUpdate,
  onRecapGenerated,
}: {
  session: Session;
  expanded: boolean;
  onToggle: () => void;
  onNotesUpdate: (id: string, notes: string) => void;
  onRecapGenerated: (id: string, recap: string) => void;
}) {
  const status = STATUS_STYLES[session.status] || STATUS_STYLES.SCHEDULED;
  const scheduledDate = new Date(session.scheduledAt);
  const [notes, setNotes] = useState(session.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [generatingRecap, setGeneratingRecap] = useState(false);

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        onNotesUpdate(session.id, notes);
      }
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setSavingNotes(false);
    }
  };

  const generateRecap = async () => {
    setGeneratingRecap(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}/recap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        const data = await res.json();
        onRecapGenerated(session.id, data.recap);
      }
    } catch (err) {
      console.error("Failed to generate recap:", err);
    } finally {
      setGeneratingRecap(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary-light/20 bg-white shadow-sm transition-all hover:shadow-md">
      {/* Main row */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 p-5 text-left"
      >
        {/* Date & time */}
        <div className="hidden shrink-0 flex-col items-center rounded-xl bg-surface px-4 py-2 sm:flex">
          <span className="text-xs font-medium uppercase text-text-secondary">
            {format(scheduledDate, "MMM")}
          </span>
          <span className="text-2xl font-extrabold text-primary-dark">
            {format(scheduledDate, "dd")}
          </span>
          <span className="text-xs text-text-secondary">
            {format(scheduledDate, "h:mm a")}
          </span>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-bold text-primary-dark">
              {session.title || "Untitled Session"}
            </h3>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.bg} ${status.text}`}
            >
              {status.label}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {session.student.name || session.student.email}
            </span>
            <span className="sm:hidden flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(scheduledDate, "MMM d, h:mm a")}
            </span>
            {session.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {session.duration} min
              </span>
            )}
            <span className="text-xs text-text-secondary/70">
              {formatDistanceToNow(scheduledDate, { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Expand arrow */}
        {expanded ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-text-secondary" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-text-secondary" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-primary-light/10 px-5 pb-5 pt-4">
          {/* Notes */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-semibold text-primary-dark">
              Session Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder="Add notes about this session..."
              rows={4}
              className="w-full rounded-xl border border-primary-light/20 bg-surface px-4 py-3 text-sm text-primary-dark outline-none placeholder:text-text-secondary focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="flex items-center gap-1.5 rounded-lg border border-primary-light/20 bg-white px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-primary hover:text-primary disabled:opacity-50"
              >
                {savingNotes ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Save Notes
              </button>
              {session.status === "COMPLETED" && (
                <button
                  onClick={generateRecap}
                  disabled={generatingRecap || !notes.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-accent px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50"
                >
                  {generatingRecap ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  Generate Recap
                </button>
              )}
            </div>
          </div>

          {/* AI Recap */}
          {session.recap && (
            <div className="rounded-xl border border-accent-light/30 bg-gradient-to-br from-primary/5 to-accent/5 p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-bold text-primary-dark">
                  AI-Generated Recap
                </h4>
              </div>
              <div className="space-y-2 text-sm leading-relaxed text-text-secondary">
                {session.recap.split("\n").map((line, i) =>
                  line.trim() ? (
                    <p key={i}>{line}</p>
                  ) : (
                    <div key={i} className="h-1" />
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ===== Calendar Grid ===== */
function CalendarGrid({
  month,
  sessions,
  selectedDay,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
}: {
  month: Date;
  sessions: Session[];
  selectedDay: Date | null;
  onSelectDay: (day: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start of month with empty cells
  const startPad = getDay(monthStart); // 0=Sun

  // Which days have sessions
  const daysWithSessions = new Set(
    sessions
      .filter((s) => isSameMonth(new Date(s.scheduledAt), month))
      .map((s) => new Date(s.scheduledAt).getDate())
  );

  return (
    <div className="rounded-2xl border border-primary-light/20 bg-white p-5 shadow-sm">
      {/* Month nav */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onPrevMonth}
          className="rounded-lg border border-primary-light/20 p-2 text-text-secondary transition-all hover:bg-surface hover:text-primary-dark"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="text-lg font-bold text-primary-dark">
          {format(month, "MMMM yyyy")}
        </h3>
        <button
          onClick={onNextMonth}
          className="rounded-lg border border-primary-light/20 p-2 text-text-secondary transition-all hover:bg-surface hover:text-primary-dark"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day labels */}
      <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold text-text-secondary">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for padding */}
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} className="h-12" />
        ))}

        {days.map((day) => {
          const hasSessions = daysWithSessions.has(day.getDate());
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDay(day)}
              className={`relative flex h-12 flex-col items-center justify-center rounded-xl text-sm font-medium transition-all ${
                isSelected
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-md"
                  : isToday
                  ? "border border-primary bg-primary/5 text-primary-dark"
                  : "text-primary-dark hover:bg-surface"
              }`}
            >
              {day.getDate()}
              {hasSessions && !isSelected && (
                <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
              {hasSessions && isSelected && (
                <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ===== New Session Modal ===== */
function NewSessionModal({
  students,
  onClose,
  onCreated,
}: {
  students: Student[];
  onClose: () => void;
  onCreated: (session: Session) => void;
}) {
  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !date || !time) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, title, scheduledAt, duration }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create session.");
        return;
      }

      const newSession = await res.json();
      onCreated(newSession);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-primary-light/20 bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary-dark">New Session</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-surface hover:text-primary-dark"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student select */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-primary-dark">
              Student <span className="text-danger">*</span>
            </label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full rounded-xl border border-primary-light/20 bg-surface px-4 py-3 text-sm text-primary-dark outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            >
              <option value="">Select a student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.email}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-primary-dark">
              Session Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Algebra Review"
              className="w-full rounded-xl border border-primary-light/20 bg-surface px-4 py-3 text-sm text-primary-dark outline-none placeholder:text-text-secondary focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-primary-dark">
                Date <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-primary-light/20 bg-surface px-4 py-3 text-sm text-primary-dark outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-primary-dark">
                Time <span className="text-danger">*</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-primary-light/20 bg-surface px-4 py-3 text-sm text-primary-dark outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-primary-dark">
              Duration
            </label>
            <div className="flex gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDuration(opt.value)}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                    duration === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-primary-light/20 bg-white text-text-secondary hover:border-primary/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-primary-light/20 bg-white py-3 text-sm font-semibold text-text-secondary transition-all hover:bg-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
