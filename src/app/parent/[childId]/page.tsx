"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Clock,
  TrendingUp,
  CheckCircle2,
  Layers,
  Loader2,
  BookOpen,
  Calendar,
  FileText,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

/* ===== Types ===== */
interface QuizAttempt {
  id: string;
  score: number;
  totalQuestions: number;
  timeSpent: number | null;
  createdAt: string;
  studySet: { id: string; title: string };
}

interface Assignment {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  studySet: { id: string; title: string };
  assignedBy: { name: string | null };
}

interface ProgressData {
  student: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  recentQuizAttempts: QuizAttempt[];
  assignments: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    list: Assignment[];
  };
  studyTime: { totalSeconds: number };
  flashcardMastery: { mastered: number; total: number };
}

const ASSIGNMENT_STATUS: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "bg-amber-50", text: "text-amber-600", label: "Pending" },
  IN_PROGRESS: { bg: "bg-blue-50", text: "text-blue-600", label: "In Progress" },
  COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Completed" },
};

function formatStudyTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}h ${remainMins}m`;
}

/* ===== Main Page ===== */
export default function ChildProgressPage() {
  const params = useParams();
  const childId = params.childId as string;
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/parent/children/${childId}/progress`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [childId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-text-secondary">Failed to load progress data.</p>
        <Link
          href="/parent"
          className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>
    );
  }

  const { student, recentQuizAttempts, assignments, studyTime, flashcardMastery } = data;

  // Compute avg quiz score
  let avgScore = 0;
  if (recentQuizAttempts.length > 0) {
    const total = recentQuizAttempts.reduce(
      (sum, q) => sum + (q.score / q.totalQuestions) * 100,
      0
    );
    avgScore = Math.round(total / recentQuizAttempts.length);
  }

  // Build a merged activity timeline (latest 10)
  const activityItems = [
    ...recentQuizAttempts.map((q) => ({
      type: "quiz" as const,
      date: q.createdAt,
      title: `Quiz: ${q.studySet.title}`,
      detail: `Scored ${q.score}/${q.totalQuestions} (${Math.round(
        (q.score / q.totalQuestions) * 100
      )}%)`,
    })),
    ...assignments.list
      .filter((a) => a.completedAt)
      .map((a) => ({
        type: "assignment" as const,
        date: a.completedAt!,
        title: `Completed: ${a.studySet.title}`,
        detail: `Assigned by ${a.assignedBy.name || "Tutor"}`,
      })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Bar chart data (last 10 quiz scores)
  const chartData = recentQuizAttempts
    .slice(0, 10)
    .reverse()
    .map((q) => ({
      label: format(new Date(q.createdAt), "MM/dd"),
      score: Math.round((q.score / q.totalQuestions) * 100),
    }));

  return (
    <div>
      {/* Back link */}
      <Link
        href="/parent"
        className="mb-4 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        {student.image ? (
          <img
            src={student.image}
            alt={student.name || ""}
            className="h-16 w-16 rounded-full border-2 border-primary-light/20 object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-2xl font-bold text-white">
            {(student.name || student.email)[0].toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-extrabold text-primary-dark">
            {student.name || student.email}
          </h1>
          {student.name && (
            <p className="text-text-secondary">{student.email}</p>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Clock,
            label: "Total Study Time",
            value: formatStudyTime(studyTime.totalSeconds),
            color: "from-purple-500 to-violet-600",
          },
          {
            icon: TrendingUp,
            label: "Avg Quiz Score",
            value: `${avgScore}%`,
            color: "from-blue-500 to-indigo-600",
          },
          {
            icon: CheckCircle2,
            label: "Assignments Done",
            value: `${assignments.completed}/${assignments.total}`,
            color: "from-green-500 to-emerald-600",
          },
          {
            icon: Layers,
            label: "Flashcards Mastered",
            value: `${flashcardMastery.mastered}/${flashcardMastery.total}`,
            color: "from-orange-500 to-amber-600",
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

      {/* Recent Activity */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-primary-dark">
          Recent Activity
        </h2>
        {activityItems.length === 0 ? (
          <p className="text-sm text-text-secondary">No recent activity.</p>
        ) : (
          <div className="rounded-2xl border border-primary-light/10 bg-white shadow-sm">
            {activityItems.map((item, i) => (
              <div
                key={i}
                className={`flex items-start gap-4 px-5 py-4 ${
                  i > 0 ? "border-t border-primary-light/10" : ""
                }`}
              >
                {/* Timeline dot */}
                <div className="mt-1 flex flex-col items-center">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      item.type === "quiz"
                        ? "bg-blue-500"
                        : "bg-emerald-500"
                    }`}
                  />
                  {i < activityItems.length - 1 && (
                    <div className="h-full w-0.5 bg-primary-light/20" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {item.type === "quiz" ? (
                      <FileText className="h-4 w-4 shrink-0 text-blue-500" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    )}
                    <p className="truncate text-sm font-semibold text-primary-dark">
                      {item.title}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {item.detail}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-text-secondary/70">
                  {formatDistanceToNow(new Date(item.date), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignments */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-primary-dark">
          Assignments
        </h2>
        {assignments.list.length === 0 ? (
          <p className="text-sm text-text-secondary">No assignments yet.</p>
        ) : (
          <div className="rounded-2xl border border-primary-light/10 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-primary-light/10">
                    <th className="px-5 py-3 font-semibold text-text-secondary">
                      Study Set
                    </th>
                    <th className="px-5 py-3 font-semibold text-text-secondary">
                      Status
                    </th>
                    <th className="hidden px-5 py-3 font-semibold text-text-secondary sm:table-cell">
                      Due Date
                    </th>
                    <th className="hidden px-5 py-3 font-semibold text-text-secondary sm:table-cell">
                      Assigned By
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.list.map((a) => {
                    const st = ASSIGNMENT_STATUS[a.status] || ASSIGNMENT_STATUS.PENDING;
                    return (
                      <tr
                        key={a.id}
                        className="border-b border-primary-light/5 last:border-0"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                            <span className="font-medium text-primary-dark">
                              {a.studySet.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.bg} ${st.text}`}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td className="hidden px-5 py-3 text-text-secondary sm:table-cell">
                          {a.dueDate ? (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(a.dueDate), "MMM d, yyyy")}
                            </span>
                          ) : (
                            <span className="text-text-secondary/50">--</span>
                          )}
                        </td>
                        <td className="hidden px-5 py-3 text-text-secondary sm:table-cell">
                          {a.assignedBy.name || "Tutor"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Quiz Performance - CSS bar chart */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-primary-dark">
          Quiz Performance
        </h2>
        {chartData.length === 0 ? (
          <p className="text-sm text-text-secondary">
            No quiz attempts to display.
          </p>
        ) : (
          <div className="rounded-2xl border border-primary-light/10 bg-white p-6 shadow-sm">
            <div className="flex items-end gap-2" style={{ height: "200px" }}>
              {chartData.map((d, i) => {
                const barHeight = Math.max(d.score, 4); // minimum visual height
                let barColor = "from-green-400 to-emerald-500";
                if (d.score < 60) barColor = "from-red-400 to-rose-500";
                else if (d.score < 80) barColor = "from-amber-400 to-yellow-500";

                return (
                  <div
                    key={i}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    {/* Score label */}
                    <span className="text-xs font-semibold text-primary-dark">
                      {d.score}%
                    </span>
                    {/* Bar */}
                    <div
                      className={`w-full rounded-t-lg bg-gradient-to-t ${barColor} transition-all duration-500`}
                      style={{ height: `${(barHeight / 100) * 160}px` }}
                    />
                    {/* Date label */}
                    <span className="mt-1 text-xs text-text-secondary">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
