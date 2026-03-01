"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Loader2,
  AlertCircle,
  Layers,
  TrendingUp,
  ClipboardCheck,
  Award,
  Mail,
  Pencil,
  X,
  Plus,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  Circle,
  Timer,
} from "lucide-react";

interface QuizAttempt {
  id: string;
  score: number;
  totalQuestions: number;
  timeSpentSeconds: number | null;
  createdAt: string;
  studySet: {
    id: string;
    title: string;
  };
}

interface Assignment {
  id: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
  studySet: {
    id: string;
    title: string;
  };
}

interface StudentDetail {
  id: string;
  name: string;
  email: string;
  image: string | null;
  subject: string | null;
  notes: string | null;
  createdAt: string;
  quizAttempts: QuizAttempt[];
  flashcardMastery: {
    mastered: number;
    total: number;
  };
  assignments: Assignment[];
}

interface StudySetOption {
  id: string;
  title: string;
}

const avatarColors = [
  "from-purple-500 to-violet-600",
  "from-blue-500 to-indigo-600",
  "from-green-500 to-emerald-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-red-600",
  "from-cyan-500 to-teal-600",
  "from-pink-500 to-fuchsia-600",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

type Tab = "assignments" | "quizHistory" | "progress";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(seconds: number | null) {
  if (!seconds) return "--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function getStatusBadge(status: string) {
  switch (status.toUpperCase()) {
    case "COMPLETED":
      return {
        label: "Completed",
        classes: "bg-success/10 text-success",
        icon: CheckCircle2,
      };
    case "IN_PROGRESS":
      return {
        label: "In Progress",
        classes: "bg-warning/10 text-amber-600",
        icon: Timer,
      };
    default:
      return {
        label: "Pending",
        classes: "bg-gray-100 text-gray-500",
        icon: Circle,
      };
  }
}

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("assignments");

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Assign modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [studySets, setStudySets] = useState<StudySetOption[]>([]);
  const [assignStudySetId, setAssignStudySetId] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");

  useEffect(() => {
    fetchStudent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  async function fetchStudent() {
    try {
      setLoading(true);
      const res = await fetch(`/api/students/${studentId}`);
      if (!res.ok) throw new Error("Failed to fetch student details");
      const data = await res.json();
      setStudent(data);
      setEditSubject(data.subject || "");
      setEditNotes(data.notes || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setEditLoading(true);
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: editSubject.trim() || null,
          notes: editNotes.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update student");
      setShowEditModal(false);
      fetchStudent();
    } catch {
      // Keep modal open on error
    } finally {
      setEditLoading(false);
    }
  }

  async function openAssignModal() {
    setShowAssignModal(true);
    setAssignError("");
    setAssignStudySetId("");
    setAssignDueDate("");
    try {
      const res = await fetch("/api/study-sets");
      if (res.ok) {
        const data = await res.json();
        setStudySets(data);
      }
    } catch {
      // Study sets will be empty
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setAssignError("");
    if (!assignStudySetId) {
      setAssignError("Please select a study set");
      return;
    }

    try {
      setAssignLoading(true);
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studySetId: assignStudySetId,
          studentId,
          dueDate: assignDueDate || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create assignment");
      }
      setShowAssignModal(false);
      fetchStudent();
    } catch (err) {
      setAssignError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setAssignLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-text-secondary">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <AlertCircle className="mb-4 h-12 w-12 text-danger" />
        <h2 className="text-xl font-bold text-primary-dark">
          {error || "Student not found"}
        </h2>
        <Link
          href="/dashboard/students"
          className="mt-4 flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Students
        </Link>
      </div>
    );
  }

  // Calculate stats
  const avgQuizScore =
    student.quizAttempts.length > 0
      ? Math.round(
          (student.quizAttempts.reduce(
            (sum, q) => sum + (q.score / q.totalQuestions) * 100,
            0
          ) /
            student.quizAttempts.length)
        )
      : 0;
  const completedAssignments = student.assignments.filter(
    (a) => a.status.toUpperCase() === "COMPLETED"
  ).length;

  const tabs = [
    { id: "assignments" as Tab, label: "Assignments", icon: ClipboardCheck },
    { id: "quizHistory" as Tab, label: "Quiz History", icon: TrendingUp },
    { id: "progress" as Tab, label: "Progress", icon: Award },
  ];

  return (
    <div>
      {/* Back link */}
      <Link
        href="/dashboard/students"
        className="mb-4 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Students
      </Link>

      {/* Student header */}
      <div className="mb-8 rounded-2xl border border-primary-light/10 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${getAvatarColor(
                student.name || student.email
              )} text-2xl font-bold text-white shadow-md`}
            >
              {(student.name || student.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-primary-dark">
                {student.name || "Unnamed Student"}
              </h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-text-secondary">
                <Mail className="h-3.5 w-3.5" />
                {student.email}
              </p>
              {student.subject && (
                <span className="mt-2 inline-block rounded-full bg-primary-light/10 px-3 py-1 text-xs font-semibold text-primary">
                  {student.subject}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 self-start rounded-xl border border-primary-light/20 px-4 py-2.5 text-sm font-semibold text-text-secondary transition-all hover:bg-surface hover:text-primary-dark"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            icon: Layers,
            label: "Study Sets",
            value: new Set(student.assignments.map((a) => a.studySet.id)).size,
            color: "from-purple-500 to-violet-600",
          },
          {
            icon: TrendingUp,
            label: "Avg Quiz Score",
            value: student.quizAttempts.length > 0 ? `${avgQuizScore}%` : "--",
            color: "from-blue-500 to-indigo-600",
          },
          {
            icon: Award,
            label: "Flashcards Mastered",
            value: `${student.flashcardMastery.mastered}/${student.flashcardMastery.total}`,
            color: "from-green-500 to-emerald-600",
          },
          {
            icon: ClipboardCheck,
            label: "Assignments Done",
            value: `${completedAssignments}/${student.assignments.length}`,
            color: "from-amber-500 to-orange-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-primary-light/10 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-md`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">{stat.label}</p>
                <p className="text-2xl font-extrabold text-primary-dark">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + Assign button */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-md"
                  : "bg-white text-text-secondary hover:bg-surface hover:text-primary-dark"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={openAssignModal}
          className="flex items-center gap-2 self-start rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Assign Study Set
        </button>
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === "assignments" && (
          <AssignmentsTab assignments={student.assignments} />
        )}
        {activeTab === "quizHistory" && (
          <QuizHistoryTab attempts={student.quizAttempts} />
        )}
        {activeTab === "progress" && (
          <ProgressTab
            quizAttempts={student.quizAttempts}
            flashcardMastery={student.flashcardMastery}
            assignments={student.assignments}
          />
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowEditModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary-dark">
                Edit Student
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-lg p-1 text-text-secondary transition-colors hover:bg-surface hover:text-primary-dark"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-primary-dark">
                  Subject
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-primary-light/20 bg-surface px-4 py-3">
                  <BookOpen className="h-4 w-4 text-text-secondary" />
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    placeholder="e.g., Biology 101"
                    className="flex-1 bg-transparent text-sm text-primary-dark outline-none placeholder:text-text-secondary"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-primary-dark">
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Private notes about this student..."
                  rows={3}
                  className="w-full rounded-xl border border-primary-light/20 bg-surface px-4 py-3 text-sm text-primary-dark outline-none transition-all placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 rounded-xl border border-primary-light/20 px-4 py-3 text-sm font-semibold text-text-secondary transition-all hover:bg-surface hover:text-primary-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 disabled:opacity-50"
                >
                  {editLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Study Set Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowAssignModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary-dark">
                Assign Study Set
              </h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="rounded-lg p-1 text-text-secondary transition-colors hover:bg-surface hover:text-primary-dark"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {assignError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {assignError}
              </div>
            )}

            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-primary-dark">
                  Study Set <span className="text-danger">*</span>
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-primary-light/20 bg-surface px-4 py-3">
                  <BookOpen className="h-4 w-4 text-text-secondary" />
                  <select
                    value={assignStudySetId}
                    onChange={(e) => setAssignStudySetId(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-primary-dark outline-none"
                    required
                  >
                    <option value="">Select a study set...</option>
                    {studySets.map((set) => (
                      <option key={set.id} value={set.id}>
                        {set.title}
                      </option>
                    ))}
                  </select>
                </div>
                {studySets.length === 0 && (
                  <p className="mt-1.5 text-xs text-text-secondary">
                    No study sets available. Create one first.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-primary-dark">
                  Due Date
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-primary-light/20 bg-surface px-4 py-3">
                  <Calendar className="h-4 w-4 text-text-secondary" />
                  <input
                    type="date"
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-primary-dark outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 rounded-xl border border-primary-light/20 px-4 py-3 text-sm font-semibold text-text-secondary transition-all hover:bg-surface hover:text-primary-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 disabled:opacity-50"
                >
                  {assignLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Assign
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== ASSIGNMENTS TAB ===================== */
function AssignmentsTab({ assignments }: { assignments: Assignment[] }) {
  if (assignments.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary-light/30 bg-white/50 p-12 text-center">
        <ClipboardCheck className="mb-3 h-10 w-10 text-text-secondary/50" />
        <h3 className="text-lg font-bold text-primary-dark">
          No assignments yet
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          Assign a study set to this student to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assignments.map((assignment) => {
        const status = getStatusBadge(assignment.status);
        const StatusIcon = status.icon;
        return (
          <div
            key={assignment.id}
            className="flex flex-col gap-3 rounded-2xl border border-primary-light/10 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-primary-dark">
                  {assignment.studySet.title}
                </h4>
                <div className="mt-1 flex items-center gap-3 text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Assigned {formatDate(assignment.createdAt)}
                  </span>
                  {assignment.dueDate && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Due {formatDate(assignment.dueDate)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.classes}`}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {status.label}
              </span>
              <Link
                href={`/dashboard/sets/${assignment.studySet.id}`}
                className="rounded-xl border border-primary-light/20 px-3 py-1.5 text-xs font-semibold text-text-secondary transition-all hover:bg-surface hover:text-primary-dark"
              >
                View Set
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ===================== QUIZ HISTORY TAB ===================== */
function QuizHistoryTab({ attempts }: { attempts: QuizAttempt[] }) {
  if (attempts.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary-light/30 bg-white/50 p-12 text-center">
        <TrendingUp className="mb-3 h-10 w-10 text-text-secondary/50" />
        <h3 className="text-lg font-bold text-primary-dark">
          No quiz attempts yet
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          This student hasn&apos;t taken any quizzes yet.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-primary-light/10 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary-light/10 bg-surface">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Date
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Study Set
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Score
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Percentage
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Time Spent
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-light/10">
            {attempts.map((attempt) => {
              const percentage = Math.round(
                (attempt.score / attempt.totalQuestions) * 100
              );
              return (
                <tr
                  key={attempt.id}
                  className="transition-colors hover:bg-surface/50"
                >
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-text-secondary">
                    {formatDate(attempt.createdAt)}
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-primary-dark">
                    {attempt.studySet.title}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-primary-dark">
                    {attempt.score}/{attempt.totalQuestions}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        percentage >= 80
                          ? "bg-success/10 text-success"
                          : percentage >= 60
                          ? "bg-warning/10 text-amber-600"
                          : "bg-danger/10 text-danger"
                      }`}
                    >
                      {percentage}%
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-text-secondary">
                    {formatTime(attempt.timeSpentSeconds)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ===================== PROGRESS TAB ===================== */
function ProgressTab({
  quizAttempts,
  flashcardMastery,
  assignments,
}: {
  quizAttempts: QuizAttempt[];
  flashcardMastery: { mastered: number; total: number };
  assignments: Assignment[];
}) {
  // Build a simple progress timeline from quiz attempts
  const sortedAttempts = [...quizAttempts]
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    .map((a) => ({
      date: formatDate(a.createdAt),
      score: Math.round((a.score / a.totalQuestions) * 100),
      setTitle: a.studySet.title,
    }));

  const completedCount = assignments.filter(
    (a) => a.status.toUpperCase() === "COMPLETED"
  ).length;
  const masteryPercent =
    flashcardMastery.total > 0
      ? Math.round((flashcardMastery.mastered / flashcardMastery.total) * 100)
      : 0;
  const assignmentPercent =
    assignments.length > 0
      ? Math.round((completedCount / assignments.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Overview metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Flashcard mastery */}
        <div className="rounded-2xl border border-primary-light/10 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
            Flashcard Mastery
          </h3>
          <div className="mb-2 flex items-end justify-between">
            <span className="text-3xl font-extrabold text-primary-dark">
              {masteryPercent}%
            </span>
            <span className="text-sm text-text-secondary">
              {flashcardMastery.mastered} of {flashcardMastery.total} cards
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-primary-light/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${masteryPercent}%` }}
            />
          </div>
        </div>

        {/* Assignment completion */}
        <div className="rounded-2xl border border-primary-light/10 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
            Assignment Completion
          </h3>
          <div className="mb-2 flex items-end justify-between">
            <span className="text-3xl font-extrabold text-primary-dark">
              {assignmentPercent}%
            </span>
            <span className="text-sm text-text-secondary">
              {completedCount} of {assignments.length} done
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-primary-light/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${assignmentPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quiz score timeline */}
      <div className="rounded-2xl border border-primary-light/10 bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Quiz Score History
        </h3>
        {sortedAttempts.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-secondary">
            No quiz data available yet.
          </p>
        ) : (
          <div className="space-y-0">
            {/* Simple bar chart visualization */}
            <div className="flex items-end gap-2" style={{ height: "200px" }}>
              {sortedAttempts.map((attempt, i) => (
                <div
                  key={i}
                  className="group relative flex flex-1 flex-col items-center justify-end"
                  style={{ height: "100%" }}
                >
                  {/* Tooltip */}
                  <div className="pointer-events-none absolute -top-12 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-primary-dark px-3 py-1.5 text-xs text-white shadow-lg group-hover:block">
                    {attempt.setTitle}: {attempt.score}%
                    <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-primary-dark" />
                  </div>
                  <div
                    className={`w-full max-w-[48px] rounded-t-lg transition-all duration-300 ${
                      attempt.score >= 80
                        ? "bg-gradient-to-t from-green-500 to-emerald-400"
                        : attempt.score >= 60
                        ? "bg-gradient-to-t from-amber-500 to-yellow-400"
                        : "bg-gradient-to-t from-red-500 to-rose-400"
                    }`}
                    style={{ height: `${attempt.score}%` }}
                  />
                </div>
              ))}
            </div>
            {/* X-axis labels */}
            <div className="mt-2 flex gap-2">
              {sortedAttempts.map((attempt, i) => (
                <div
                  key={i}
                  className="flex-1 text-center text-[10px] text-text-secondary"
                >
                  {attempt.date.replace(/,\s*\d{4}$/, "")}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
