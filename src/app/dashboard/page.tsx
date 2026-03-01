"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Plus,
  Layers,
  ClipboardCheck,
  FileText,
  TrendingUp,
  Clock,
  Sparkles,
} from "lucide-react";
import { getGeneratedSets, type GeneratedStudySet } from "@/lib/store";

interface StudySetFromAPI {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  gradeLevel: string | null;
  _count: {
    flashcards: number;
    quizQuestions: number;
    notes: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Consistent color palette for study set cards
const cardColors = [
  "from-purple-500 to-violet-600",
  "from-blue-500 to-indigo-600",
  "from-green-500 to-emerald-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
  "from-teal-500 to-cyan-600",
];

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [apiSets, setApiSets] = useState<StudySetFromAPI[]>([]);
  const [localSets, setLocalSets] = useState<GeneratedStudySet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load local (sessionStorage) sets
    setLocalSets(getGeneratedSets());

    // Only fetch from API if logged in (avoids 401 for guests)
    if (session) {
      fetch("/api/study-sets")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setApiSets(Array.isArray(data) ? data : []))
        .catch(() => setApiSets([]))
        .finally(() => setLoading(false));
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status]);

  const totalFlashcards =
    apiSets.reduce((s, set) => s + (set._count?.flashcards || 0), 0) +
    localSets.reduce((s, set) => s + set.flashcards.length, 0);
  const totalQuizzes =
    apiSets.reduce((s, set) => s + (set._count?.quizQuestions || 0), 0) +
    localSets.reduce((s, set) => s + set.quizQuestions.length, 0);
  const totalSets = apiSets.length + localSets.length;
  const totalNotes =
    apiSets.reduce((s, set) => s + (set._count?.notes || 0), 0) +
    localSets.reduce((s, set) => s + set.notes.length, 0);

  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <div>
      {/* Welcome section */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-primary-dark">
          {firstName ? `Welcome back, ${firstName}!` : "Welcome!"}
        </h1>
        <p className="mt-1 text-text-secondary">
          {firstName
            ? "Ready to continue studying? Here\u2019s your progress overview."
            : "Upload your study materials to get started \u2014 no account needed."}
        </p>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Layers,
            label: "Study Sets",
            value: totalSets,
            color: "from-purple-500 to-violet-600",
          },
          {
            icon: ClipboardCheck,
            label: "Flashcards",
            value: totalFlashcards,
            color: "from-blue-500 to-indigo-600",
          },
          {
            icon: FileText,
            label: "Quiz Questions",
            value: totalQuizzes,
            color: "from-green-500 to-emerald-600",
          },
          {
            icon: TrendingUp,
            label: "Notes",
            value: totalNotes,
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
                  {loading ? (
                    <span className="inline-block h-7 w-12 animate-pulse rounded-md bg-primary-light/20" />
                  ) : stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Study sets header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-primary-dark">Your Study Sets</h2>
        <Link
          href="/dashboard/upload"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          New Study Set
        </Link>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-primary-light/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div className="h-12 w-12 rounded-xl bg-primary-light/20" />
                <div className="h-6 w-16 rounded-full bg-primary-light/10" />
              </div>
              <div className="h-5 w-3/4 rounded bg-primary-light/20" />
              <div className="mt-3 h-4 w-full rounded bg-primary-light/10" />
              <div className="mt-1 h-4 w-2/3 rounded bg-primary-light/10" />
              <div className="mt-4 flex gap-4 border-t border-primary-light/10 pt-4">
                <div className="h-3 w-16 rounded bg-primary-light/10" />
                <div className="h-3 w-20 rounded bg-primary-light/10" />
                <div className="ml-auto h-3 w-14 rounded bg-primary-light/10" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Study sets grid */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {/* API study sets */}
          {apiSets.map((set, i) => (
            <Link
              key={set.id}
              href={`/dashboard/sets/${set.id}`}
              className="group rounded-2xl border border-primary-light/10 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="mb-4 flex items-start justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${cardColors[i % cardColors.length]} text-white shadow-md`}
                >
                  <Sparkles className="h-6 w-6" />
                </div>
                {set.gradeLevel && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {set.gradeLevel}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-primary-dark group-hover:text-primary">
                {set.title}
              </h3>
              {set.subject && (
                <p className="mt-1 text-sm text-text-secondary">{set.subject}</p>
              )}
              {set.description && (
                <p className="mt-2 line-clamp-2 text-sm text-text-secondary/80">
                  {set.description}
                </p>
              )}
              <div className="mt-4 flex items-center gap-4 border-t border-primary-light/10 pt-4 text-xs text-text-secondary">
                <span className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" />
                  {set._count?.flashcards || 0} cards
                </span>
                <span className="flex items-center gap-1">
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  {set._count?.quizQuestions || 0} questions
                </span>
                <span className="ml-auto flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {getRelativeTime(set.updatedAt)}
                </span>
              </div>
            </Link>
          ))}

          {/* Local/session study sets */}
          {localSets.map((set, i) => (
            <Link
              key={set.id}
              href={`/dashboard/sets/${set.id}`}
              className="group rounded-2xl border border-primary-light/10 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="mb-4 flex items-start justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${cardColors[(apiSets.length + i) % cardColors.length]} text-white shadow-md`}
                >
                  <Sparkles className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
                  Local
                </span>
              </div>
              <h3 className="text-lg font-bold text-primary-dark group-hover:text-primary">
                {set.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm text-text-secondary/80">
                {set.description}
              </p>
              <div className="mt-4 flex items-center gap-4 border-t border-primary-light/10 pt-4 text-xs text-text-secondary">
                <span className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" />
                  {set.flashcards.length} cards
                </span>
                <span className="flex items-center gap-1">
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  {set.quizQuestions.length} questions
                </span>
                <span className="ml-auto flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {getRelativeTime(set.createdAt)}
                </span>
              </div>
            </Link>
          ))}

          {/* Empty state */}
          {totalSets === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary-light/30 bg-white/50 px-8 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <p className="mt-4 text-lg font-semibold text-primary-dark">
                No study sets yet
              </p>
              <p className="mt-2 max-w-sm text-sm text-text-secondary">
                Upload your study materials to generate AI-powered flashcards, quizzes, and notes.
              </p>
              <Link
                href="/dashboard/upload"
                className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
              >
                <Plus className="h-4 w-4" />
                Create Your First Study Set
              </Link>
            </div>
          )}

          {/* Add new set card (only show when there are existing sets) */}
          {totalSets > 0 && (
            <Link
              href="/dashboard/upload"
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary-light/30 bg-white/50 p-8 text-center transition-all hover:border-primary hover:bg-surface"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light/10">
                <Plus className="h-7 w-7 text-primary" />
              </div>
              <p className="mt-3 font-semibold text-primary-dark">
                Create New Study Set
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Upload your materials to get started
              </p>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
