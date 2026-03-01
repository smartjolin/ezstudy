"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  ClipboardCheck,
  FileText,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  X,
  Sparkles,
  Loader2,
  GraduationCap,
  ArrowRight,
} from "lucide-react";

/* ===== Types ===== */
interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[] | null;
  correctIndex: number | null;
  explanation: string | null;
}

interface StudyNote {
  id: string;
  title: string;
  content: string;
}

interface SharedStudySet {
  id: string;
  title: string;
  description: string | null;
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
  notes: StudyNote[];
  creator: {
    businessName: string | null;
    brandColor: string | null;
    logoUrl: string | null;
    name: string | null;
  };
}

type Tab = "flashcards" | "quizzes" | "notes";

const tabs: { id: Tab; icon: typeof Layers; label: string }[] = [
  { id: "flashcards", icon: Layers, label: "Flashcards" },
  { id: "quizzes", icon: ClipboardCheck, label: "Quizzes" },
  { id: "notes", icon: FileText, label: "Notes" },
];

/* ===== Main Page ===== */
export default function SharedStudySetPage() {
  const params = useParams();
  const code = params.code as string;
  const [studySet, setStudySet] = useState<SharedStudySet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("flashcards");

  useEffect(() => {
    fetch(`/api/study-sets/shared?code=${encodeURIComponent(code)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setStudySet(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !studySet) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
        <div className="rounded-2xl border border-primary-light/20 bg-white p-10 text-center shadow-sm">
          <Sparkles className="mx-auto h-12 w-12 text-primary-light/50" />
          <h1 className="mt-4 text-2xl font-extrabold text-primary-dark">
            Study Set Not Found
          </h1>
          <p className="mt-2 text-text-secondary">
            This share link may have expired or is invalid.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const brandColor = studySet.creator.brandColor || "#7c6bc4";
  const businessName = studySet.creator.businessName;

  return (
    <div className="min-h-screen bg-surface">
      {/* Top branding bar */}
      <header className="border-b border-primary-light/10 bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            {studySet.creator.logoUrl ? (
              <img
                src={studySet.creator.logoUrl}
                alt="Logo"
                className="h-8 w-8 rounded-lg object-contain"
              />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: brandColor }}
              >
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
            )}
            {businessName && (
              <span className="text-sm font-bold text-primary-dark">
                {businessName}
              </span>
            )}
          </div>
          <Link
            href="/signup"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-surface"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-primary-dark">
            {studySet.title}
          </h1>
          {studySet.description && (
            <p className="mt-1 text-text-secondary">{studySet.description}</p>
          )}
          <div className="mt-3 flex items-center gap-4 text-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              {studySet.flashcards.length} flashcards
            </span>
            <span className="flex items-center gap-1">
              <ClipboardCheck className="h-3.5 w-3.5" />
              {studySet.quizQuestions.length} quiz questions
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {studySet.notes.length} notes
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
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

        {/* Tab content */}
        <div className="min-h-[400px]">
          {activeTab === "flashcards" && (
            <SharedFlashcardsView cards={studySet.flashcards} />
          )}
          {activeTab === "quizzes" && (
            <SharedQuizzesView questions={studySet.quizQuestions} />
          )}
          {activeTab === "notes" && (
            <SharedNotesView notesList={studySet.notes} />
          )}
        </div>

        {/* Sign up CTA */}
        <div className="mt-12 rounded-2xl border border-primary-light/20 bg-gradient-to-br from-primary/5 to-accent/5 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg">
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-xl font-extrabold text-primary-dark">
            Track Your Progress
          </h3>
          <p className="mt-2 text-text-secondary">
            Sign up to save your progress, get AI tutoring, and access all study
            tools.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-8 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
          >
            Sign up to track your progress
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ===== Shared Flashcards View ===== */
function SharedFlashcardsView({ cards }: { cards: Flashcard[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (cards.length === 0) {
    return (
      <p className="py-12 text-center text-text-secondary">
        No flashcards in this study set.
      </p>
    );
  }

  const card = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  const goNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => Math.min(prev + 1, cards.length - 1));
  };

  const goPrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const resetDeck = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-4 flex items-center justify-between text-sm text-text-secondary">
        <span>
          Card {currentIndex + 1} of {cards.length}
        </span>
      </div>
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-primary-light/20">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Card */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="cursor-pointer select-none rounded-2xl border border-primary-light/20 bg-white p-8 shadow-lg transition-all hover:shadow-xl sm:p-12"
        style={{ minHeight: "280px" }}
      >
        <div className="flex h-full flex-col items-center justify-center text-center">
          <span
            className={`mb-4 rounded-full px-3 py-1 text-xs font-semibold ${
              isFlipped
                ? "bg-accent-light/20 text-accent"
                : "bg-primary-light/20 text-primary"
            }`}
          >
            {isFlipped ? "Answer" : "Question"}
          </span>
          <p className="text-xl font-semibold leading-relaxed text-primary-dark sm:text-2xl">
            {isFlipped ? card.back : card.front}
          </p>
          {!isFlipped && (
            <p className="mt-6 text-sm text-text-secondary">
              Click to reveal answer
            </p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary-light/20 bg-white text-text-secondary transition-all hover:bg-surface disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={resetDeck}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary-light/20 bg-white text-text-secondary transition-all hover:bg-surface"
          title="Reset deck"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
        <button
          onClick={goNext}
          disabled={currentIndex === cards.length - 1}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary-light/20 bg-white text-text-secondary transition-all hover:bg-surface disabled:opacity-40"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Card indicators */}
      <div className="mt-6 flex justify-center gap-1.5">
        {cards.map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-all ${
              i === currentIndex ? "w-6 bg-primary" : "bg-primary-light/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ===== Shared Quizzes View ===== */
function SharedQuizzesView({ questions }: { questions: QuizQuestion[] }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (questions.length === 0) {
    return (
      <p className="py-12 text-center text-text-secondary">
        No quiz questions in this study set.
      </p>
    );
  }

  const question = questions[currentQ];
  const options = (question.options as string[]) || [];

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);
    if (index === question.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setCurrentQ((prev) => prev + 1);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const resetQuiz = () => {
    setCurrentQ(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="rounded-2xl border border-primary-light/20 bg-white p-8 shadow-lg">
          <div
            className={`mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl ${
              percentage >= 80
                ? "bg-success/10 text-success"
                : percentage >= 60
                ? "bg-warning/10 text-amber-600"
                : "bg-danger/10 text-danger"
            }`}
          >
            <span className="text-3xl font-extrabold">{percentage}%</span>
          </div>
          <h3 className="text-2xl font-extrabold text-primary-dark">
            {percentage >= 80
              ? "Excellent!"
              : percentage >= 60
              ? "Good Job!"
              : "Keep Practicing!"}
          </h3>
          <p className="mt-2 text-text-secondary">
            You got {score} out of {questions.length} correct
          </p>
          <button
            onClick={resetQuiz}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg"
          >
            <RotateCcw className="h-4 w-4" />
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-4 flex items-center justify-between text-sm text-text-secondary">
        <span>
          Question {currentQ + 1} of {questions.length}
        </span>
        <span>
          Score: {score}/{currentQ + (showResult ? 1 : 0)}
        </span>
      </div>
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-primary-light/20">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
          style={{
            width: `${
              ((currentQ + (showResult ? 1 : 0)) / questions.length) * 100
            }%`,
          }}
        />
      </div>

      {/* Question */}
      <div className="rounded-2xl border border-primary-light/20 bg-white p-6 shadow-lg sm:p-8">
        <h3 className="mb-6 text-xl font-bold text-primary-dark">
          {question.question}
        </h3>

        <div className="space-y-3">
          {options.map((option, index) => {
            let borderColor = "border-primary-light/20 hover:border-primary/40";
            let bgColor = "bg-white hover:bg-surface";

            if (showResult) {
              if (index === question.correctIndex) {
                borderColor = "border-success";
                bgColor = "bg-success/5";
              } else if (
                index === selectedAnswer &&
                index !== question.correctIndex
              ) {
                borderColor = "border-danger";
                bgColor = "bg-danger/5";
              }
            } else if (selectedAnswer === index) {
              borderColor = "border-primary";
              bgColor = "bg-primary/5";
            }

            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${borderColor} ${bgColor}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    showResult && index === question.correctIndex
                      ? "bg-success text-white"
                      : showResult &&
                        index === selectedAnswer &&
                        index !== question.correctIndex
                      ? "bg-danger text-white"
                      : "bg-primary-light/20 text-primary-dark"
                  }`}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="font-medium text-primary-dark">{option}</span>
                {showResult && index === question.correctIndex && (
                  <Check className="ml-auto h-5 w-5 text-success" />
                )}
                {showResult &&
                  index === selectedAnswer &&
                  index !== question.correctIndex && (
                    <X className="ml-auto h-5 w-5 text-danger" />
                  )}
              </button>
            );
          })}
        </div>

        {showResult && question.explanation && (
          <div className="mt-6 rounded-xl bg-surface p-4">
            <p className="text-sm font-semibold text-primary-dark">
              Explanation:
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {question.explanation}
            </p>
          </div>
        )}

        {showResult && (
          <button
            onClick={nextQuestion}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg"
          >
            {currentQ + 1 >= questions.length
              ? "See Results"
              : "Next Question"}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ===== Shared Notes View ===== */
function SharedNotesView({ notesList }: { notesList: StudyNote[] }) {
  const [activeNote, setActiveNote] = useState(0);

  if (notesList.length === 0) {
    return (
      <p className="py-12 text-center text-text-secondary">
        No notes in this study set.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      {/* Note list */}
      <div className="space-y-2 lg:col-span-1">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Notes ({notesList.length})
        </h3>
        {notesList.map((note, index) => (
          <button
            key={note.id}
            onClick={() => setActiveNote(index)}
            className={`w-full rounded-xl border p-3 text-left transition-all ${
              activeNote === index
                ? "border-primary bg-primary/5"
                : "border-primary-light/10 bg-white hover:bg-surface"
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                activeNote === index ? "text-primary" : "text-primary-dark"
              }`}
            >
              {note.title}
            </p>
          </button>
        ))}
      </div>

      {/* Note content */}
      <div className="rounded-2xl border border-primary-light/20 bg-white p-6 shadow-sm lg:col-span-3 sm:p-8">
        <div className="prose prose-sm max-w-none">
          {notesList[activeNote]?.content.split("\n").map((line, i) => {
            const trimmed = line.trim();
            if (trimmed.startsWith("## ")) {
              return (
                <h2
                  key={i}
                  className="mb-4 mt-6 text-2xl font-bold text-primary-dark first:mt-0"
                >
                  {trimmed.replace(/^##\s+/, "")}
                </h2>
              );
            }
            if (trimmed.startsWith("### ")) {
              return (
                <h3
                  key={i}
                  className="mb-3 mt-5 text-lg font-bold text-primary-dark"
                >
                  {trimmed.replace(/^###\s+/, "")}
                </h3>
              );
            }
            if (trimmed.startsWith("#### ")) {
              return (
                <h4
                  key={i}
                  className="mb-2 mt-4 text-base font-bold text-primary-dark"
                >
                  {trimmed.replace(/^####\s+/, "")}
                </h4>
              );
            }
            if (trimmed.startsWith("- ")) {
              return (
                <div key={i} className="mb-2 flex gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="text-text-secondary">
                    {trimmed.replace(/^-\s+/, "")}
                  </span>
                </div>
              );
            }
            if (trimmed.match(/^\d+\./)) {
              return (
                <div key={i} className="mb-2 flex gap-2 text-sm">
                  <span className="shrink-0 font-bold text-primary">
                    {trimmed.match(/^(\d+\.)/)?.[1]}
                  </span>
                  <span className="text-text-secondary">
                    {trimmed.replace(/^\d+\.\s*/, "")}
                  </span>
                </div>
              );
            }
            if (trimmed === "") return <div key={i} className="h-2" />;
            return (
              <p
                key={i}
                className="mb-2 text-sm leading-relaxed text-text-secondary"
              >
                {trimmed}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
