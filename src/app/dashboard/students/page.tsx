"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Mail,
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  Clock,
  Loader2,
  X,
  AlertCircle,
  Search,
  Upload,
  CheckCircle2,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  image: string | null;
  subject: string | null;
  assignmentCount: number;
  lastActivity: string;
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

function formatLastActive(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Add student form state
  const [formEmail, setFormEmail] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Bulk import state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCsv, setBulkCsv] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ added: number; errors: string[] } | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    try {
      setLoading(true);
      const res = await fetch("/api/students");
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!formEmail.trim()) {
      setFormError("Email is required");
      return;
    }

    try {
      setFormLoading(true);
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formEmail.trim(),
          subject: formSubject.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add student");
      }

      const newStudent = await res.json();
      setStudents((prev) => [...prev, newStudent]);
      setShowModal(false);
      setFormEmail("");
      setFormSubject("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleBulkImport() {
    if (!bulkCsv.trim()) return;
    setBulkLoading(true);
    setBulkResults(null);

    const lines = bulkCsv
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.toLowerCase().startsWith("email"));

    let added = 0;
    const errors: string[] = [];

    for (const line of lines) {
      const parts = line.split(",").map((p) => p.trim());
      const email = parts[0];
      const subject = parts[1] || undefined;

      if (!email || !email.includes("@")) {
        errors.push(`Invalid email: ${email || "(empty)"}`);
        continue;
      }

      try {
        const res = await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, subject }),
        });
        if (!res.ok) {
          const data = await res.json();
          errors.push(`${email}: ${data.error}`);
        } else {
          added++;
        }
      } catch {
        errors.push(`${email}: Network error`);
      }
    }

    setBulkResults({ added, errors });
    setBulkLoading(false);
    if (added > 0) {
      fetchStudents();
    }
  }

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.subject?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-text-secondary">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-primary-dark">
            My Students
          </h1>
          <p className="mt-1 text-text-secondary">
            {students.length} {students.length === 1 ? "student" : "students"}{" "}
            in your roster
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-primary-light/20 bg-white px-4 py-2.5 text-sm font-medium text-text-secondary transition-all hover:bg-surface hover:text-primary-dark"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Add Student
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Search bar */}
      {students.length > 0 && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-primary-light/20 bg-white px-4 py-2.5">
          <Search className="h-4 w-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search students by name, email, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-primary-dark outline-none placeholder:text-text-secondary"
          />
        </div>
      )}

      {/* Student cards grid */}
      {students.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary-light/30 bg-white/50 p-12 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-light/10">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-primary-dark">
            No students yet
          </h3>
          <p className="mt-2 max-w-md text-text-secondary">
            Add your first student to start managing their assignments, track
            their quiz scores, and monitor their progress.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Add Your First Student
          </button>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-2xl border border-primary-light/10 bg-white p-12 text-center">
          <Search className="mb-3 h-10 w-10 text-text-secondary/50" />
          <h3 className="text-lg font-bold text-primary-dark">
            No students found
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            No students match your search. Try a different keyword.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredStudents.map((student) => (
            <Link
              key={student.id}
              href={`/dashboard/students/${student.id}`}
              className="group rounded-2xl border border-primary-light/10 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarColor(
                    student.name || student.email
                  )} text-lg font-bold text-white shadow-md`}
                >
                  {(student.name || student.email).charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-primary-dark group-hover:text-primary">
                        {student.name || "Unnamed Student"}
                      </h3>
                      <p className="flex items-center gap-1 truncate text-sm text-text-secondary">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        {student.email}
                      </p>
                    </div>
                    {student.subject && (
                      <span className="shrink-0 rounded-full bg-primary-light/10 px-3 py-1 text-xs font-semibold text-primary">
                        {student.subject}
                      </span>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="mt-4 flex items-center gap-4 border-t border-primary-light/10 pt-3 text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      {student.assignmentCount} assignments
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      -- avg score
                    </span>
                    <span className="ml-auto flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatLastActive(student.lastActivity)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Add Student Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => {
              setShowModal(false);
              setFormError("");
            }}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary-dark">
                Add Student
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormError("");
                }}
                className="rounded-lg p-1 text-text-secondary transition-colors hover:bg-surface hover:text-primary-dark"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-primary-dark">
                  Student Email <span className="text-danger">*</span>
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-primary-light/20 bg-surface px-4 py-3">
                  <Mail className="h-4 w-4 text-text-secondary" />
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="flex-1 bg-transparent text-sm text-primary-dark outline-none placeholder:text-text-secondary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-primary-dark">
                  Subject
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-primary-light/20 bg-surface px-4 py-3">
                  <BookOpen className="h-4 w-4 text-text-secondary" />
                  <input
                    type="text"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="e.g., Biology 101, Calculus II"
                    className="flex-1 bg-transparent text-sm text-primary-dark outline-none placeholder:text-text-secondary"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormError("");
                  }}
                  className="flex-1 rounded-xl border border-primary-light/20 px-4 py-3 text-sm font-semibold text-text-secondary transition-all hover:bg-surface hover:text-primary-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 disabled:opacity-50"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Student
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => {
              setShowBulkModal(false);
              setBulkResults(null);
              setBulkCsv("");
            }}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary-dark">
                Import Students from CSV
              </h2>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkResults(null);
                  setBulkCsv("");
                }}
                className="rounded-lg p-1 text-text-secondary transition-colors hover:bg-surface hover:text-primary-dark"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-3 text-sm text-text-secondary">
              Paste a CSV with one student per line: <code className="rounded bg-surface px-1.5 py-0.5 text-xs">email, subject</code>
            </p>
            <p className="mb-4 text-xs text-text-secondary">
              Example:<br />
              <code className="rounded bg-surface px-1.5 py-0.5 text-xs">
                student1@school.edu, English<br />
                student2@school.edu, Science
              </code>
            </p>

            <textarea
              value={bulkCsv}
              onChange={(e) => setBulkCsv(e.target.value)}
              placeholder="email@example.com, Subject&#10;email2@example.com, Subject"
              rows={6}
              className="mb-4 w-full rounded-xl border border-primary-light/20 bg-surface px-4 py-3 text-sm text-primary-dark outline-none font-mono placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            {bulkResults && (
              <div className="mb-4 rounded-xl border border-primary-light/20 bg-surface p-4">
                {bulkResults.added > 0 && (
                  <p className="flex items-center gap-2 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    {bulkResults.added} student{bulkResults.added > 1 ? "s" : ""} added
                  </p>
                )}
                {bulkResults.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-danger">
                      {bulkResults.errors.length} error{bulkResults.errors.length > 1 ? "s" : ""}:
                    </p>
                    <ul className="mt-1 space-y-1">
                      {bulkResults.errors.map((err, i) => (
                        <li key={i} className="text-xs text-text-secondary">
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkResults(null);
                  setBulkCsv("");
                }}
                className="flex-1 rounded-xl border border-primary-light/20 px-4 py-3 text-sm font-semibold text-text-secondary transition-all hover:bg-surface hover:text-primary-dark"
              >
                {bulkResults ? "Done" : "Cancel"}
              </button>
              {!bulkResults && (
                <button
                  onClick={handleBulkImport}
                  disabled={bulkLoading || !bulkCsv.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 disabled:opacity-50"
                >
                  {bulkLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Import Students
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
