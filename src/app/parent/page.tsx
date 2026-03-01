"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  TrendingUp,
  Layers,
  ChevronRight,
  Loader2,
  User,
} from "lucide-react";

interface ChildData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  stats: {
    totalStudySets: number;
    avgQuizScore: number;
    flashcardsMastered: number;
    totalQuizAttempts: number;
  };
}

export default function ParentPage() {
  const [children, setChildren] = useState<ChildData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/parent/children")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setChildren(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-primary-dark">
          Your Children&apos;s Progress
        </h1>
        <p className="mt-1 text-text-secondary">
          See how your children are doing across their study sets and
          assignments.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : children.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-primary-light/30 bg-white/50 p-12 text-center">
          <User className="mx-auto h-12 w-12 text-primary-light/50" />
          <p className="mt-4 font-semibold text-primary-dark">
            No children linked
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Contact your tutor to link your account with your child&apos;s
            profile.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <div
              key={child.id}
              className="group rounded-2xl border border-primary-light/10 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              {/* Avatar & name */}
              <div className="mb-5 flex items-center gap-3">
                {child.image ? (
                  <img
                    src={child.image}
                    alt={child.name || ""}
                    className="h-14 w-14 rounded-full border-2 border-primary-light/20 object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xl font-bold text-white">
                    {(child.name || child.email)[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold text-primary-dark">
                    {child.name || child.email}
                  </h3>
                  {child.name && (
                    <p className="truncate text-sm text-text-secondary">
                      {child.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="mb-5 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-surface p-3 text-center">
                  <BookOpen className="mx-auto mb-1 h-4 w-4 text-primary" />
                  <p className="text-lg font-extrabold text-primary-dark">
                    {child.stats.totalStudySets}
                  </p>
                  <p className="text-xs text-text-secondary">Study Sets</p>
                </div>
                <div className="rounded-xl bg-surface p-3 text-center">
                  <TrendingUp className="mx-auto mb-1 h-4 w-4 text-success" />
                  <p className="text-lg font-extrabold text-primary-dark">
                    {child.stats.avgQuizScore}%
                  </p>
                  <p className="text-xs text-text-secondary">Avg Score</p>
                </div>
                <div className="rounded-xl bg-surface p-3 text-center">
                  <Layers className="mx-auto mb-1 h-4 w-4 text-accent" />
                  <p className="text-lg font-extrabold text-primary-dark">
                    {child.stats.flashcardsMastered}
                  </p>
                  <p className="text-xs text-text-secondary">Mastered</p>
                </div>
              </div>

              {/* View Details */}
              <Link
                href={`/parent/${child.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary-light/20 bg-white py-2.5 text-sm font-semibold text-primary transition-all hover:bg-surface hover:text-primary-dark group-hover:border-primary/30"
              >
                View Details
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
