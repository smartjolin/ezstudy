"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Upload, Sparkles } from "lucide-react";

const typingTexts = [
  "flashcards from your notes",
  "quizzes from your lectures",
  "study guides from your PDFs",
  "summaries from your slides",
  "practice tests in seconds",
];

export default function Hero() {
  const [currentText, setCurrentText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const text = typingTexts[textIndex];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          setCurrentText(text.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
          if (charIndex + 1 === text.length) {
            setTimeout(() => setIsDeleting(true), 2000);
          }
        } else {
          setCurrentText(text.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
          if (charIndex - 1 === 0) {
            setIsDeleting(false);
            setTextIndex((textIndex + 1) % typingTexts.length);
          }
        }
      },
      isDeleting ? 30 : 60
    );
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex]);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-surface via-white to-white pt-32 pb-20">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary-light/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent-light/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-light/30 bg-white px-4 py-2 text-sm font-medium text-primary shadow-sm">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Study Tools</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-tight tracking-tight text-primary-dark sm:text-6xl lg:text-7xl">
            Create{" "}
            <span className="gradient-text">
              {currentText}
              <span className="cursor-blink text-primary">|</span>
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary sm:text-xl">
            Upload your course materials and instantly get AI-generated
            flashcards, quizzes, notes, and a personal AI tutor. Study smarter,
            not harder.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110"
            >
              <Upload className="h-5 w-5" />
              Try For Free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/#features"
              className="flex items-center gap-2 rounded-full border-2 border-primary/20 bg-white px-8 py-4 text-lg font-semibold text-primary-dark transition-all hover:border-primary/40 hover:bg-surface"
            >
              Explore Features
            </Link>
          </div>
        </div>

        {/* Mock app preview */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="glow-purple overflow-hidden rounded-2xl border border-primary-light/20 bg-white shadow-2xl">
            <div className="flex items-center gap-2 border-b border-gray-100 bg-surface px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-danger" />
              <div className="h-3 w-3 rounded-full bg-warning" />
              <div className="h-3 w-3 rounded-full bg-success" />
              <div className="ml-4 flex-1 rounded-full bg-white px-4 py-1 text-sm text-text-secondary">
                ezstudy.app/dashboard
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* Sidebar mock */}
                <div className="hidden rounded-xl bg-surface p-4 sm:block">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent" />
                    <div>
                      <div className="h-3 w-20 rounded bg-primary-light/30" />
                      <div className="mt-1 h-2 w-14 rounded bg-primary-light/20" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {["Biology 101", "Calculus II", "History"].map((name) => (
                      <div
                        key={name}
                        className="flex items-center gap-2 rounded-lg bg-white p-2 text-xs text-text-secondary"
                      >
                        <div className="h-6 w-6 rounded bg-primary-light/20" />
                        {name}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Main content mock */}
                <div className="col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-primary-dark">
                      Biology 101 Study Set
                    </h3>
                    <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                      85% Mastery
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        icon: "📝",
                        label: "Flashcards",
                        count: "48 cards",
                        color: "from-blue-500 to-blue-600",
                      },
                      {
                        icon: "📋",
                        label: "Quizzes",
                        count: "12 quizzes",
                        color: "from-purple-500 to-purple-600",
                      },
                      {
                        icon: "📓",
                        label: "Notes",
                        count: "8 pages",
                        color: "from-green-500 to-green-600",
                      },
                      {
                        icon: "🤖",
                        label: "AI Tutor",
                        count: "Ask anything",
                        color: "from-orange-500 to-orange-600",
                      },
                    ].map((tool) => (
                      <div
                        key={tool.label}
                        className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:shadow-md"
                      >
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${tool.color} text-lg`}
                        >
                          {tool.icon}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-primary-dark">
                            {tool.label}
                          </div>
                          <div className="text-xs text-text-secondary">
                            {tool.count}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
