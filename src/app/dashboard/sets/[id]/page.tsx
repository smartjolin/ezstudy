"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Layers,
  ClipboardCheck,
  FileText,
  Bot,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  X,
  Send,
  Sparkles,
  Timer,
  Download,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Shuffle,
  Lightbulb,
  ArrowLeft,
  Share2,
  Copy,
  CheckCircle2,
  UserPlus,
  Settings,
} from "lucide-react";
import Link from "next/link";
import {
  getStudySet,
  getFlashcards,
  getQuizQuestions,
  getNotes,
  studySets,
} from "@/lib/mock-data";
import type { ChatMessage, Flashcard, QuizQuestion, Note } from "@/lib/mock-data";
import { getGeneratedSet } from "@/lib/store";
import {
  saveCardReview,
  getCardsForReview,
  getWeakCards,
  getCardStatuses,
  getDueCount,
  saveQuizAttempt,
  getFlashcardPerformance,
  getPerformanceSummary,
  type CardStatus,
  type FlashcardPerformance,
} from "@/lib/progress-store";

type Tab = "flashcards" | "quizzes" | "notes" | "chat";
type ChatMode = "normal" | "socratic" | "quiz_me" | "explain_simply";
type TimerOption = "none" | "30s" | "60s" | "5min";

interface QuizHistoryItem {
  question: string;
  isCorrect: boolean;
  topic: string;
}

interface QuizAnswerRecord {
  questionIndex: number;
  question: string;
  type: string;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  selfGrade?: boolean;
}

const tools = [
  { id: "flashcards" as Tab, icon: Layers, label: "Flashcards" },
  { id: "quizzes" as Tab, icon: ClipboardCheck, label: "Quizzes" },
  { id: "notes" as Tab, icon: FileText, label: "Notes" },
  { id: "chat" as Tab, icon: Bot, label: "AI Tutor" },
];


function useStudySetData(setId: string) {
  // Check generated sets first (AI-generated), then fall back to mock data
  const generated = getGeneratedSet(setId);

  if (generated) {
    const setInfo = {
      id: generated.id,
      title: generated.title,
      description: generated.description,
      subject: "AI Generated",
      materialCount: 1,
      flashcardCount: generated.flashcards.length,
      quizCount: generated.quizQuestions.length,
      noteCount: generated.notes.length,
      mastery: 0,
      lastStudied: "Just now",
      createdAt: generated.createdAt,
      color: "from-purple-500 to-violet-600",
    };
    const flashcardData: Flashcard[] = generated.flashcards.map((f, i) => ({
      id: `gf-${i}`,
      front: f.front,
      back: f.back,
      mastery: 0,
      setId,
    }));
    const quizData: QuizQuestion[] = generated.quizQuestions.map((q, i) => ({
      id: `gq-${i}`,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      hint: q.hint,
      setId,
    }));
    const noteData: Note[] = generated.notes.map((n, i) => ({
      id: `gn-${i}`,
      title: n.title,
      content: n.content,
      setId,
      createdAt: new Date().toISOString().split("T")[0],
    }));
    return { set: setInfo, flashcards: flashcardData, quizQuestions: quizData, notes: noteData };
  }

  const set = getStudySet(setId) || studySets[0];
  return {
    set,
    flashcards: getFlashcards(setId),
    quizQuestions: getQuizQuestions(setId),
    notes: getNotes(setId),
  };
}

type FlashcardStudyMode = "review" | "all" | "weak";

export default function StudySetPage() {
  const params = useParams();
  const setId = params.id as string;
  const { data: session } = useSession();
  const { set, flashcards: setFlashcards, quizQuestions: setQuizQuestions, notes: setNotes } = useStudySetData(setId);
  const [activeTab, setActiveTab] = useState<Tab>("flashcards");
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
  const [flashcardMode, setFlashcardMode] = useState<FlashcardStudyMode>("review");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const handleQuizComplete = useCallback((history: QuizHistoryItem[]) => {
    setQuizHistory((prev) => [...prev, ...history]);
  }, []);

  const handleReviewWeakCards = useCallback(() => {
    setFlashcardMode("weak");
    setActiveTab("flashcards");
  }, []);

  const handleShare = async () => {
    setShowShareDialog(true);
    if (!shareCode && !setId.startsWith("gen-")) {
      try {
        // Try to get existing share code
        const res = await fetch(`/api/study-sets/${setId}/share`);
        if (res.ok) {
          const data = await res.json();
          if (data.shareCode) {
            setShareCode(data.shareCode);
            return;
          }
        }
        // Generate new share code
        const postRes = await fetch(`/api/study-sets/${setId}/share`, { method: "POST" });
        if (postRes.ok) {
          const data = await postRes.json();
          setShareCode(data.shareCode);
        }
      } catch {
        // Share not available for this set
      }
    }
  };

  const copyShareLink = () => {
    const link = shareCode
      ? `${window.location.origin}/dashboard/shared?code=${shareCode}`
      : window.location.href;
    navigator.clipboard.writeText(link);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/dashboard"
            className="mb-2 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold text-primary-dark sm:text-3xl">
            {set.title}
          </h1>
          <p className="mt-1 text-text-secondary">{set.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-xl border border-primary-light/20 bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:bg-surface hover:text-primary-dark"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <span
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              set.mastery >= 80
                ? "bg-success/10 text-success"
                : set.mastery >= 60
                ? "bg-warning/10 text-amber-600"
                : "bg-danger/10 text-danger"
            }`}
          >
            {set.mastery}% Mastery
          </span>
        </div>
      </div>

      {/* Share dialog */}
      {showShareDialog && (
        <div className="mb-6 animate-slide-up rounded-2xl border border-primary-light/20 bg-white p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-primary-dark">Share Study Set</h3>
            <button onClick={() => setShowShareDialog(false)} className="text-text-secondary hover:text-primary-dark">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-text-secondary mb-3">
            Share this link with your students so they can access the study materials.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={
                shareCode
                  ? `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/shared?code=${shareCode}`
                  : window.location.href
              }
              className="flex-1 rounded-xl border border-primary-light/20 bg-surface px-4 py-2.5 text-sm text-primary-dark"
            />
            <button
              onClick={copyShareLink}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
            >
              {shareCopied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {shareCopied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Progress summary banner */}
      <ProgressBanner
        setId={setId}
        totalCards={setFlashcards.length}
        onReviewDue={() => { setFlashcardMode("review"); setActiveTab("flashcards"); }}
      />

      {/* Main tool tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTab(tool.id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
              activeTab === tool.id
                ? "bg-gradient-to-r from-primary to-accent text-white shadow-md"
                : "bg-white text-text-secondary hover:bg-surface hover:text-primary-dark"
            }`}
          >
            <tool.icon className="h-4 w-4" />
            {tool.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[500px]">
        <div key={activeTab} className="animate-fade-in">
        {activeTab === "flashcards" && (
          <FlashcardsView
            cards={setFlashcards}
            setId={setId}
            studyMode={flashcardMode}
            onStudyModeChange={setFlashcardMode}
          />
        )}
        {activeTab === "quizzes" && (
          <QuizzesView
            questions={setQuizQuestions}
            setId={setId}
            onQuizComplete={handleQuizComplete}
            onReviewWeakCards={handleReviewWeakCards}
          />
        )}
        {activeTab === "notes" && <NotesView notesList={setNotes} />}
        {activeTab === "chat" && (
          <ChatView
            setTitle={set.title}
            setDescription={set.description}
            setId={setId}
            cards={setFlashcards}
            quizHistory={quizHistory}
            userName={session?.user?.name || undefined}
          />
        )}
        </div>
      </div>

    </div>
  );
}

/* ===================== PROGRESS BANNER ===================== */
function ProgressBanner({
  setId,
  totalCards,
  onReviewDue,
}: {
  setId: string;
  totalCards: number;
  onReviewDue: () => void;
}) {
  const summary = useMemo(() => getPerformanceSummary(setId, totalCards), [setId, totalCards]);
  const dueCount = useMemo(() => getDueCount(setId, totalCards), [setId, totalCards]);

  // Don't show banner if no progress data exists yet
  if (summary.masteredCount === 0 && summary.learningCount === 0 && summary.quizAverage === 0 && dueCount === 0) {
    return null;
  }

  const quizPct = Math.round(summary.quizAverage * 100);
  const masteryPct = totalCards > 0 ? Math.round((summary.masteredCount / totalCards) * 100) : 0;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-primary-light/10 bg-white p-4 shadow-sm sm:gap-5">
      {/* Mastery */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
          <Layers className="h-4 w-4 text-emerald-600" />
        </div>
        <div>
          <p className="text-xs text-text-secondary">Mastered</p>
          <p className="text-sm font-bold text-primary-dark">{summary.masteredCount}/{totalCards} <span className="font-normal text-text-secondary">({masteryPct}%)</span></p>
        </div>
      </div>
      {/* Quiz avg */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <ClipboardCheck className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="text-xs text-text-secondary">Quiz Avg</p>
          <p className="text-sm font-bold text-primary-dark">{quizPct > 0 ? `${quizPct}%` : "—"}</p>
        </div>
      </div>
      {/* Due cards */}
      {dueCount > 0 && (
        <button
          onClick={onReviewDue}
          className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary/20"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {dueCount} due — Review Now
        </button>
      )}
      {/* Weak topics */}
      {summary.weakTopics.length > 0 && (
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-text-secondary">Weak:</span>
          {summary.weakTopics.slice(0, 2).map((topic) => (
            <span key={topic} className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 truncate max-w-[120px]">
              {topic}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===================== FLASHCARDS ===================== */

const statusColors: Record<CardStatus, string> = {
  new: "bg-blue-100 text-blue-700",
  learning: "bg-amber-100 text-amber-700",
  review: "bg-purple-100 text-purple-700",
  mastered: "bg-emerald-100 text-emerald-700",
};

const statusDotColors: Record<CardStatus, string> = {
  new: "bg-blue-400",
  learning: "bg-amber-400",
  review: "bg-purple-400",
  mastered: "bg-emerald-400",
};

function FlashcardsView({
  cards,
  setId,
  studyMode,
  onStudyModeChange,
}: {
  cards: Flashcard[];
  setId: string;
  studyMode: FlashcardStudyMode;
  onStudyModeChange: (mode: FlashcardStudyMode) => void;
}) {
  const [queuePosition, setQueuePosition] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [statuses, setStatuses] = useState<Record<number, CardStatus>>({});
  const [sessionReviewed, setSessionReviewed] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  // Build card queue based on study mode
  const cardQueue = useMemo(() => {
    if (studyMode === "review") return getCardsForReview(setId, cards.length);
    if (studyMode === "weak") return getWeakCards(setId, cards.length);
    return Array.from({ length: cards.length }, (_, i) => i);
  }, [setId, cards.length, studyMode]);

  // Load statuses
  useEffect(() => {
    setStatuses(getCardStatuses(setId, cards.length));
  }, [setId, cards.length]);

  const dueCount = useMemo(() => getDueCount(setId, cards.length), [setId, cards.length]);

  const currentCardIndex = cardQueue[queuePosition];
  const card = cards[currentCardIndex];
  const isDone = queuePosition >= cardQueue.length || !card;
  const progress = cardQueue.length > 0 ? ((queuePosition + (isDone ? 0 : 1)) / cardQueue.length) * 100 : 100;
  const currentStatus = currentCardIndex !== undefined ? statuses[currentCardIndex] || "new" : "new";

  const goNext = useCallback(() => {
    setIsFlipped(false);
    if (queuePosition + 1 >= cardQueue.length) {
      setShowSummary(true);
    } else {
      setQueuePosition((prev) => prev + 1);
    }
  }, [queuePosition, cardQueue.length]);

  const goPrev = useCallback(() => {
    setIsFlipped(false);
    setQueuePosition((prev) => Math.max(prev - 1, 0));
  }, []);

  const rateCard = useCallback(
    (quality: number) => {
      saveCardReview(setId, currentCardIndex, quality);
      setStatuses(getCardStatuses(setId, cards.length));
      setSessionReviewed((p) => p + 1);
      if (quality >= 3) setSessionCorrect((p) => p + 1);
      goNext();
    },
    [setId, currentCardIndex, cards.length, goNext]
  );

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isDone || showSummary) return;
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goPrev();
          break;
        case "ArrowRight":
          e.preventDefault();
          if (!isFlipped) goNext();
          break;
        case " ":
          e.preventDefault();
          setIsFlipped((prev) => !prev);
          break;
        case "1":
          if (isFlipped) rateCard(1);
          break;
        case "2":
          if (isFlipped) rateCard(3);
          break;
        case "3":
          if (isFlipped) rateCard(5);
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isDone, showSummary, isFlipped, goPrev, goNext, rateCard]);

  const resetDeck = () => {
    setQueuePosition(0);
    setIsFlipped(false);
    setShowSummary(false);
    setSessionReviewed(0);
    setSessionCorrect(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    const threshold = 60;

    if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < -threshold) {
      setIsFlipped((prev) => !prev);
    } else if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > threshold && isFlipped) {
      rateCard(3); // Good
    } else if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < -threshold && isFlipped) {
      rateCard(1); // Again
    }
    touchStartRef.current = null;
  };

  // Count statuses for progress bar
  const statusCounts = useMemo(() => {
    const counts = { new: 0, learning: 0, review: 0, mastered: 0 };
    Object.values(statuses).forEach((s) => counts[s]++);
    // Account for cards without status entries
    counts.new = Math.max(0, cards.length - counts.learning - counts.review - counts.mastered);
    return counts;
  }, [statuses, cards.length]);

  // Session summary
  if (showSummary) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-primary-light/20 bg-white p-6 text-center shadow-lg sm:p-8">
          <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white">
            <Sparkles className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-extrabold text-primary-dark">Session Complete!</h3>
          <p className="mt-2 text-text-secondary">
            You reviewed {sessionReviewed} card{sessionReviewed !== 1 ? "s" : ""} this session
          </p>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <div>
              <p className="text-2xl font-bold text-success">{sessionCorrect}</p>
              <p className="text-text-secondary">Good/Easy</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-danger">{sessionReviewed - sessionCorrect}</p>
              <p className="text-text-secondary">Again</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> {statusCounts.mastered} mastered
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-400" /> {statusCounts.review} review
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> {statusCounts.learning} learning
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-400" /> {statusCounts.new} new
            </span>
          </div>
          <button
            onClick={resetDeck}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg"
          >
            <RotateCcw className="h-4 w-4" />
            Study Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Study mode selector */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {([
          { id: "review" as FlashcardStudyMode, label: `Review Due (${dueCount})` },
          { id: "all" as FlashcardStudyMode, label: "Study All" },
          { id: "weak" as FlashcardStudyMode, label: "Weak Cards" },
        ]).map((m) => (
          <button
            key={m.id}
            onClick={() => {
              onStudyModeChange(m.id);
              setQueuePosition(0);
              setIsFlipped(false);
              setShowSummary(false);
              setSessionReviewed(0);
              setSessionCorrect(0);
            }}
            className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              studyMode === m.id
                ? "bg-gradient-to-r from-primary to-accent text-white shadow-md"
                : "border border-primary-light/20 bg-white text-text-secondary hover:bg-surface"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Mastery distribution bar */}
      <div className="mb-4 flex h-2 overflow-hidden rounded-full bg-primary-light/10">
        {cards.length > 0 && (
          <>
            <div className="bg-emerald-400 transition-all" style={{ width: `${(statusCounts.mastered / cards.length) * 100}%` }} />
            <div className="bg-purple-400 transition-all" style={{ width: `${(statusCounts.review / cards.length) * 100}%` }} />
            <div className="bg-amber-400 transition-all" style={{ width: `${(statusCounts.learning / cards.length) * 100}%` }} />
            <div className="bg-blue-200 transition-all" style={{ width: `${(statusCounts.new / cards.length) * 100}%` }} />
          </>
        )}
      </div>

      {/* Progress */}
      <div className="mb-4 flex items-center justify-between text-sm text-text-secondary">
        <span>
          Card {Math.min(queuePosition + 1, cardQueue.length)} of {cardQueue.length}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColors[currentStatus]}`}
        >
          {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
        </span>
      </div>
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-primary-light/20">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Card with 3D flip */}
      {card && (
        <div
          ref={cardContainerRef}
          onClick={() => setIsFlipped(!isFlipped)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="card-flip cursor-pointer select-none"
          style={{ minHeight: "250px" }}
        >
          <div className={`card-flip-inner rounded-2xl ${isFlipped ? "flipped" : ""}`} style={{ minHeight: "250px" }}>
            {/* Front face */}
            <div className="card-flip-front rounded-2xl border border-primary-light/20 bg-white p-6 shadow-lg transition-shadow hover:shadow-xl sm:p-12" style={{ minHeight: "250px" }}>
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="mb-4 rounded-full bg-primary-light/20 px-3 py-1 text-xs font-semibold text-primary">
                  Question
                </span>
                <p className="text-lg font-semibold leading-relaxed text-primary-dark sm:text-2xl">
                  {card.front}
                </p>
                <p className="mt-6 text-xs text-text-secondary sm:text-sm">
                  Tap to flip &middot; Swipe up to flip
                </p>
              </div>
            </div>
            {/* Back face */}
            <div className="card-flip-back rounded-2xl border border-primary-light/20 bg-white p-6 shadow-lg sm:p-12" style={{ minHeight: "250px" }}>
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="mb-4 rounded-full bg-accent-light/20 px-3 py-1 text-xs font-semibold text-accent">
                  Answer
                </span>
                <p className="text-lg font-semibold leading-relaxed text-primary-dark sm:text-2xl">
                  {card.back}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating controls */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <button
          onClick={goPrev}
          disabled={queuePosition === 0}
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
        {isFlipped && (
          <>
            <button
              onClick={() => rateCard(1)}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-danger/20 bg-white text-sm font-medium text-danger transition-all hover:bg-red-50 active:scale-95 sm:flex-none sm:px-4"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Again</span>
            </button>
            <button
              onClick={() => rateCard(3)}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg active:scale-95 sm:flex-none sm:px-4"
            >
              <Check className="h-4 w-4" />
              <span className="hidden sm:inline">Good</span>
            </button>
            <button
              onClick={() => rateCard(5)}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-success to-emerald-500 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg active:scale-95 sm:flex-none sm:px-4"
            >
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Easy</span>
            </button>
          </>
        )}
        <button
          onClick={goNext}
          disabled={isDone}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary-light/20 bg-white text-text-secondary transition-all hover:bg-surface disabled:opacity-40"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Card status indicators */}
      <div className="mt-6 flex flex-wrap justify-center gap-1.5">
        {cardQueue.map((cardIdx, i) => {
          const s = statuses[cardIdx] || "new";
          return (
            <div
              key={i}
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                i === queuePosition ? "w-6 bg-primary" : statusDotColors[s]
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ===================== QUIZZES ===================== */
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function QuizzesView({
  questions,
  setId,
  onQuizComplete,
  onReviewWeakCards,
}: {
  questions: QuizQuestion[];
  setId: string;
  onQuizComplete?: (history: QuizHistoryItem[]) => void;
  onReviewWeakCards?: () => void;
}) {
  // Quiz phases: "active" | "finished" (auto-start, no setup screen)
  const [phase, setPhase] = useState<"active" | "finished">("active");
  const [timerOption, setTimerOption] = useState<TimerOption>("none");
  const [shuffleEnabled, setShuffleEnabled] = useState(true);
  const [activeQuestions, setActiveQuestions] = useState(() => shuffleArray(questions));
  const [showSettings, setShowSettings] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswerRecord[]>([]);

  // Fill in the blank state
  const [fillInput, setFillInput] = useState("");

  // Short answer state
  const [shortAnswerInput, setShortAnswerInput] = useState("");
  const [shortAnswerSubmitted, setShortAnswerSubmitted] = useState(false);
  const [selfGrade, setSelfGrade] = useState<boolean | null>(null);

  const question = activeQuestions[currentQ];
  const questionType = question?.type || "MULTIPLE_CHOICE";

  // Auto-start quiz on mount
  useEffect(() => {
    setStartTime(Date.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer logic
  useEffect(() => {
    if (phase !== "active" || timerOption === "none") return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timerRef.current = interval;
    return () => clearInterval(interval);
  }, [phase, timerOption]);

  // Auto-submit when timer reaches 0
  useEffect(() => {
    if (timeRemaining === 0 && phase === "active") {
      finishQuiz();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, phase]);

  const getTimerSeconds = (option: TimerOption, questionCount: number): number | null => {
    switch (option) {
      case "30s":
        return 30 * questionCount;
      case "60s":
        return 60 * questionCount;
      case "5min":
        return 300;
      default:
        return null;
    }
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const restartQuiz = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const ordered = shuffleEnabled ? shuffleArray(questions) : questions;
    setActiveQuestions(ordered);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswers([]);
    setFillInput("");
    setShortAnswerInput("");
    setShortAnswerSubmitted(false);
    setSelfGrade(null);
    setHintVisible(false);
    const totalSeconds = getTimerSeconds(timerOption, questions.length);
    setTimeRemaining(totalSeconds);
    setStartTime(Date.now());
    setPhase("active");
    setShowSettings(false);
  };

  const finishQuiz = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setEndTime(Date.now());
    setPhase("finished");

    // Report quiz history
    if (onQuizComplete) {
      const history: QuizHistoryItem[] = answers.map((a) => ({
        question: a.question,
        isCorrect: a.isCorrect,
        topic: a.question.split(" ").slice(0, 5).join(" "),
      }));
      onQuizComplete(history);
    }

    // Persist to localStorage
    saveQuizAttempt(setId, {
      timestamp: new Date().toISOString(),
      score,
      totalQuestions: questions.length,
      answers: answers.map((a) => ({
        questionIndex: a.questionIndex,
        question: a.question,
        isCorrect: a.isCorrect,
        userAnswer: a.userAnswer,
        correctAnswer: a.correctAnswer,
      })),
    });
  };

  const recordAnswer = (
    isCorrect: boolean,
    userAnswer: string,
    correctAnswer: string
  ) => {
    setAnswers((prev) => [
      ...prev,
      {
        questionIndex: currentQ,
        question: question.question,
        type: questionType,
        isCorrect,
        userAnswer,
        correctAnswer,
        explanation: question.explanation,
      },
    ]);
    if (isCorrect) setScore((prev) => prev + 1);
  };

  // Multiple choice handler
  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);
    const isCorrect = index === question.correctIndex;
    recordAnswer(isCorrect, question.options[index], question.options[question.correctIndex]);
  };

  // Fill in the blank handler
  const handleFillSubmit = () => {
    if (!fillInput.trim()) return;
    setShowResult(true);
    const correctAns = question.correctAnswer || question.options[question.correctIndex] || "";
    const isCorrect = fillInput.trim().toLowerCase() === correctAns.trim().toLowerCase();
    recordAnswer(isCorrect, fillInput.trim(), correctAns);
  };

  // Short answer handler
  const handleShortAnswerSubmit = () => {
    if (!shortAnswerInput.trim()) return;
    setShortAnswerSubmitted(true);
  };

  const handleSelfGrade = (correct: boolean) => {
    setSelfGrade(correct);
    setShowResult(true);
    const correctAns = question.correctAnswer || question.options[question.correctIndex] || "";
    recordAnswer(correct, shortAnswerInput.trim(), correctAns);
    setAnswers((prev) => {
      const updated = [...prev];
      updated[updated.length - 1].selfGrade = correct;
      return updated;
    });
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= activeQuestions.length) {
      finishQuiz();
      return;
    }
    setCurrentQ((prev) => prev + 1);
    setSelectedAnswer(null);
    setShowResult(false);
    setFillInput("");
    setShortAnswerInput("");
    setShortAnswerSubmitted(false);
    setSelfGrade(null);
    setHintVisible(false);
  };

  const resetQuiz = () => {
    restartQuiz();
  };

  const exportResults = () => {
    const percentage = Math.round((score / questions.length) * 100);
    const timeSpent = Math.round((endTime - startTime) / 1000);
    const html = `<!DOCTYPE html>
<html><head><title>Quiz Results</title>
<style>
body{font-family:system-ui,sans-serif;max-width:700px;margin:40px auto;padding:20px;color:#1a1a2e}
h1{color:#7c3aed;border-bottom:2px solid #7c3aed;padding-bottom:8px}
.score{font-size:2rem;font-weight:bold;color:${percentage >= 80 ? "#10b981" : percentage >= 60 ? "#f59e0b" : "#ef4444"};margin:16px 0}
.q{border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:12px 0}
.correct{border-left:4px solid #10b981}
.incorrect{border-left:4px solid #ef4444}
.label{font-size:0.75rem;font-weight:600;text-transform:uppercase;margin-bottom:4px}
.explanation{background:#f3f4f6;padding:8px 12px;border-radius:6px;margin-top:8px;font-size:0.9rem}
@media print{body{margin:0}}
</style></head><body>
<h1>Quiz Results</h1>
<p class="score">${percentage}% (${score}/${questions.length})</p>
<p>Time spent: ${formatTime(timeSpent)}</p>
<hr/>
${answers
  .map(
    (a, i) => `<div class="q ${a.isCorrect ? "correct" : "incorrect"}">
  <div class="label">${a.isCorrect ? "CORRECT" : "INCORRECT"} - Question ${i + 1} (${a.type.replace(/_/g, " ")})</div>
  <p><strong>${a.question}</strong></p>
  <p>Your answer: ${a.userAnswer}</p>
  ${!a.isCorrect ? `<p>Correct answer: ${a.correctAnswer}</p>` : ""}
  <div class="explanation">${a.explanation}</div>
</div>`
  )
  .join("")}
<script>window.print()</script>
</body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  // Inline settings bar (collapsible, replaces the old full-page setup screen)

  // ==================== FINISHED SCREEN ====================
  if (phase === "finished") {
    const percentage = Math.round((score / questions.length) * 100);
    const timeSpent = Math.round((endTime - startTime) / 1000);
    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-primary-light/20 bg-white p-6 shadow-lg sm:p-8">
          {/* Score with circular progress */}
          <div className="mb-6 flex flex-col items-center">
            <div className="relative mb-4">
              <svg width="128" height="128" viewBox="0 0 128 128">
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-primary-light/20"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className={
                    percentage >= 80
                      ? "text-success"
                      : percentage >= 60
                      ? "text-amber-500"
                      : "text-danger"
                  }
                  stroke="currentColor"
                  style={{
                    transform: "rotate(-90deg)",
                    transformOrigin: "center",
                    transition: "stroke-dashoffset 1s ease-in-out",
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className={`text-3xl font-extrabold ${
                    percentage >= 80
                      ? "text-success"
                      : percentage >= 60
                      ? "text-amber-600"
                      : "text-danger"
                  }`}
                >
                  {percentage}%
                </span>
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-primary-dark">
              {percentage >= 80
                ? "Excellent!"
                : percentage >= 60
                ? "Good Job!"
                : "Keep Practicing!"}
            </h3>
            <p className="mt-1 text-text-secondary">
              {score} of {questions.length} correct &middot; Time: {formatTime(timeSpent)}
            </p>
          </div>

          {/* Action buttons */}
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={resetQuiz}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg"
            >
              <RotateCcw className="h-4 w-4" />
              Retry Quiz
            </button>
            <button
              onClick={exportResults}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-primary/20 bg-white py-3 font-semibold text-primary transition-all hover:bg-primary/5"
            >
              <Download className="h-4 w-4" />
              Export Results
            </button>
          </div>

          {/* Review Weak Cards (only show if there are incorrect answers) */}
          {answers.some((a) => !a.isCorrect) && onReviewWeakCards && (
            <button
              onClick={onReviewWeakCards}
              className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 py-3 font-semibold text-amber-700 transition-all hover:bg-amber-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Review Weak Flashcards ({answers.filter((a) => !a.isCorrect).length} missed)
            </button>
          )}

          {/* Question breakdown */}
          <div className="border-t border-primary-light/10 pt-6">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Question Breakdown
            </h4>
            <div className="space-y-3">
              {answers.map((a, i) => (
                <div
                  key={i}
                  className={`rounded-xl border-2 p-4 ${
                    a.isCorrect
                      ? "border-success/30 bg-success/5"
                      : "border-danger/30 bg-danger/5"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    {a.isCorrect ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <X className="h-4 w-4 text-danger" />
                    )}
                    <span className="text-xs font-semibold uppercase text-text-secondary">
                      Q{i + 1} &middot; {a.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-primary-dark">{a.question}</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    Your answer: <span className="font-medium">{a.userAnswer}</span>
                    {!a.isCorrect && (
                      <>
                        {" "}| Correct: <span className="font-medium text-success">{a.correctAnswer}</span>
                      </>
                    )}
                  </p>
                  <p className="mt-2 text-xs italic text-text-secondary">{a.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== ACTIVE QUIZ ====================
  if (!question) return null;
  return (
    <div className="mx-auto max-w-2xl">
      {/* Inline settings bar */}
      <div className="mb-4">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:bg-surface hover:text-primary-dark"
        >
          <Settings className="h-3.5 w-3.5" />
          {shuffleEnabled ? "Shuffled" : "Ordered"} · {timerOption === "none" ? "No timer" : timerOption === "30s" ? "30s/q" : timerOption === "60s" ? "1min/q" : "5min"}
          <ChevronRight className={`h-3 w-3 transition-transform ${showSettings ? "rotate-90" : ""}`} />
        </button>
        {showSettings && (
          <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-primary-light/10 bg-white p-3 animate-fade-in">
            <button
              onClick={() => setShuffleEnabled(!shuffleEnabled)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                shuffleEnabled ? "bg-primary/10 text-primary" : "bg-surface text-text-secondary"
              }`}
            >
              <Shuffle className="h-3 w-3" />
              Shuffle
            </button>
            <select
              value={timerOption}
              onChange={(e) => setTimerOption(e.target.value as TimerOption)}
              className="rounded-lg border border-primary-light/20 bg-white px-2 py-1.5 text-xs font-medium text-text-secondary outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="none">No timer</option>
              <option value="30s">30s per question</option>
              <option value="60s">1 min per question</option>
              <option value="5min">5 minutes total</option>
            </select>
            <button
              onClick={restartQuiz}
              className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/20"
            >
              <RotateCcw className="h-3 w-3" />
              Restart
            </button>
          </div>
        )}
      </div>

      {/* Progress + Timer */}
      <div className="mb-4 flex items-center justify-between text-sm text-text-secondary">
        <span>
          Question {currentQ + 1} of {activeQuestions.length}
        </span>
        <div className="flex items-center gap-3">
          <span>Score: {score}/{answers.length}</span>
          {timeRemaining !== null && (
            <span
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                timeRemaining <= 30
                  ? "bg-danger/10 text-danger"
                  : "bg-primary-light/20 text-primary"
              }`}
            >
              <Timer className="h-3 w-3" />
              {formatTime(timeRemaining)}
            </span>
          )}
        </div>
      </div>
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-primary-light/20">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
          style={{
            width: `${((currentQ + (showResult ? 1 : 0)) / activeQuestions.length) * 100}%`,
          }}
        />
      </div>

      {/* Question card */}
      <div key={currentQ} className="animate-slide-up rounded-2xl border border-primary-light/20 bg-white p-4 shadow-lg sm:p-8">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-primary-light/20 px-2 py-0.5 text-xs font-semibold text-primary">
            {questionType.replace(/_/g, " ")}
          </span>
        </div>
        <h3 className="mb-4 text-lg font-bold text-primary-dark sm:text-xl">
          {question.question}
        </h3>

        {/* Hint */}
        {question.hint && !showResult && (
          <div className="mb-4">
            {hintVisible ? (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-sm text-amber-800">{question.hint}</p>
              </div>
            ) : (
              <button
                onClick={() => setHintVisible(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-amber-600 transition-all hover:bg-amber-50"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                Show Hint
              </button>
            )}
          </div>
        )}

        {/* ---- MULTIPLE CHOICE ---- */}
        {questionType === "MULTIPLE_CHOICE" && (
          <div className="space-y-3">
            {question.options.map((option, index) => {
              let borderColor = "border-primary-light/20 hover:border-primary/40 hover:shadow-sm";
              let bgColor = "bg-white hover:bg-surface hover:scale-[1.01]";

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
                borderColor = "border-primary ring-2 ring-primary/30";
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
        )}

        {/* ---- FILL IN THE BLANK ---- */}
        {questionType === "FILL_IN_BLANK" && (
          <div>
            <input
              type="text"
              value={fillInput}
              onChange={(e) => setFillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !showResult && handleFillSubmit()}
              disabled={showResult}
              placeholder="Type your answer..."
              className="w-full rounded-xl border-2 border-primary-light/20 bg-surface px-4 py-3 text-sm text-primary-dark outline-none placeholder:text-text-secondary focus:border-primary disabled:opacity-60"
            />
            {!showResult && (
              <button
                onClick={handleFillSubmit}
                disabled={!fillInput.trim()}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-40"
              >
                Submit Answer
              </button>
            )}
            {showResult && (
              <div className="mt-4">
                {answers[answers.length - 1]?.isCorrect ? (
                  <div className="flex items-center gap-2 rounded-xl bg-success/10 p-3">
                    <Check className="h-5 w-5 text-success" />
                    <span className="font-semibold text-success">Correct!</span>
                  </div>
                ) : (
                  <div className="rounded-xl bg-danger/10 p-3">
                    <div className="flex items-center gap-2">
                      <X className="h-5 w-5 text-danger" />
                      <span className="font-semibold text-danger">Incorrect</span>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">
                      Correct answer:{" "}
                      <span className="font-semibold text-success">
                        {question.correctAnswer || question.options[question.correctIndex]}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ---- SHORT ANSWER ---- */}
        {questionType === "SHORT_ANSWER" && (
          <div>
            <textarea
              value={shortAnswerInput}
              onChange={(e) => setShortAnswerInput(e.target.value)}
              disabled={shortAnswerSubmitted}
              placeholder="Write your answer..."
              rows={4}
              className="w-full resize-none rounded-xl border-2 border-primary-light/20 bg-surface px-4 py-3 text-sm text-primary-dark outline-none placeholder:text-text-secondary focus:border-primary disabled:opacity-60"
            />
            {!shortAnswerSubmitted && (
              <button
                onClick={handleShortAnswerSubmit}
                disabled={!shortAnswerInput.trim()}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-40"
              >
                Submit Answer
              </button>
            )}
            {shortAnswerSubmitted && !showResult && (
              <div className="mt-4 rounded-xl border border-primary-light/20 bg-surface p-4">
                <p className="mb-2 text-sm font-semibold text-primary-dark">
                  Correct Answer:
                </p>
                <p className="mb-4 text-sm text-text-secondary">
                  {question.correctAnswer || question.options[question.correctIndex] || question.explanation}
                </p>
                <p className="mb-2 text-sm font-semibold text-primary-dark">
                  How did you do?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSelfGrade(true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-success/10 py-3 font-semibold text-success transition-all hover:bg-success/20"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Got It Right
                  </button>
                  <button
                    onClick={() => handleSelfGrade(false)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-danger/10 py-3 font-semibold text-danger transition-all hover:bg-danger/20"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Got It Wrong
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Explanation (shared across types) */}
        {showResult && (
          <div className="mt-6 rounded-xl bg-surface p-4">
            <p className="text-sm font-semibold text-primary-dark">Explanation:</p>
            <p className="mt-1 text-sm text-text-secondary">{question.explanation}</p>
          </div>
        )}

        {/* Next button (shared across types) */}
        {showResult && (
          <button
            onClick={nextQuestion}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg"
          >
            {currentQ + 1 >= activeQuestions.length ? "See Results" : "Next Question"}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ===================== NOTES ===================== */
function renderInlineMarkdown(text: string) {
  // Split on **bold** patterns and render inline
  const parts = text.split(/(\*\*[^*]+?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-primary-dark">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function NotesView({ notesList }: { notesList: Note[] }) {
  const [activeNote, setActiveNote] = useState(0);

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-4">
      {/* Note list */}
      <div className="space-y-2 lg:col-span-1">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Notes ({notesList.length})
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-x-visible lg:pb-0">
          {notesList.map((note, index) => (
            <button
              key={note.id}
              onClick={() => setActiveNote(index)}
              className={`w-full min-w-[140px] shrink-0 rounded-xl border p-3 text-left transition-all lg:min-w-0 ${
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
              <p className="mt-1 text-xs text-text-secondary">
                {note.createdAt}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Note content */}
      <div className="rounded-2xl border border-primary-light/20 bg-white p-5 shadow-sm sm:p-8 lg:col-span-3">
        <div className="prose max-w-none">
          {notesList[activeNote]?.content.split("\n").map((line, i) => {
            const trimmed = line.trim();
            if (trimmed.startsWith("## ")) {
              return (
                <h2
                  key={i}
                  className="mb-4 mt-6 text-2xl font-bold text-primary-dark first:mt-0"
                >
                  {renderInlineMarkdown(trimmed.replace(/^##\s+/, ""))}
                </h2>
              );
            }
            if (trimmed.startsWith("### ")) {
              return (
                <h3
                  key={i}
                  className="mb-3 mt-5 text-lg font-bold text-primary-dark"
                >
                  {renderInlineMarkdown(trimmed.replace(/^###\s+/, ""))}
                </h3>
              );
            }
            if (trimmed.startsWith("#### ")) {
              return (
                <h4
                  key={i}
                  className="mb-2 mt-4 text-base font-bold text-primary-dark"
                >
                  {renderInlineMarkdown(trimmed.replace(/^####\s+/, ""))}
                </h4>
              );
            }
            if (trimmed.startsWith("- ")) {
              const bulletContent = trimmed.replace(/^-\s+/, "");
              return (
                <div key={i} className="mb-3 flex gap-2 text-base leading-relaxed">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="text-text-secondary">
                    {renderInlineMarkdown(bulletContent)}
                  </span>
                </div>
              );
            }
            if (trimmed.match(/^\d+\./)) {
              return (
                <div key={i} className="mb-3 flex gap-2 text-base leading-relaxed">
                  <span className="shrink-0 font-bold text-primary">
                    {trimmed.match(/^(\d+\.)/)?.[1]}
                  </span>
                  <span className="text-text-secondary">
                    {renderInlineMarkdown(trimmed.replace(/^\d+\.\s*/, ""))}
                  </span>
                </div>
              );
            }
            if (trimmed === "") return <div key={i} className="h-2" />;
            return (
              <p key={i} className="mb-3 text-base leading-relaxed text-text-secondary">
                {renderInlineMarkdown(trimmed)}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ===================== CHAT (AI TUTOR) ===================== */
function ChatView({
  setTitle,
  setDescription,
  setId,
  cards,
  quizHistory = [],
  userName,
}: {
  setTitle: string;
  setDescription: string;
  setId: string;
  cards: Flashcard[];
  quizHistory?: QuizHistoryItem[];
  userName?: string;
}) {
  const flashcardPerf = useMemo(
    () =>
      getFlashcardPerformance(
        setId,
        cards.map((c) => ({ front: c.front, back: c.back }))
      ),
    [setId, cards]
  );
  const [mode, setMode] = useState<ChatMode>("normal");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hi there! I'm Spark.E, your AI tutor for **${setTitle}**. I can help you understand concepts, answer questions, explain topics in different ways, and quiz you on the material. What would you like to learn about?`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (overrideText?: string) => {
    const text = overrideText || input;
    if (!text.trim() || isTyping) return;
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      const apiMessages = newMessages
        .filter((m) => m.id !== "1")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          studySetTitle: setTitle,
          studySetDescription: setDescription,
          mode,
          quizHistory: quizHistory.length > 0 ? quizHistory : undefined,
          flashcardPerformance: flashcardPerf.totalCards > 0 ? flashcardPerf : undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantId = (Date.now() + 1).toString();

      // Add empty assistant message that we'll stream into
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", timestamp: new Date().toISOString() },
      ]);
      setIsTyping(false);

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                assistantContent += parsed.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: assistantContent } : m
                  )
                );
              } catch {
                // skip parse errors for partial chunks
              }
            }
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I had trouble connecting. Please try again!",
          timestamp: new Date().toISOString(),
        },
      ]);
      setIsTyping(false);
    }
  };

  const sendWithMode = (text: string, newMode: ChatMode) => {
    setMode(newMode);
    handleSend(text);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col h-[calc(100vh-320px)] min-h-[400px] max-h-[700px]">
      {/* Chat messages */}
      <div className="flex-1 space-y-4 overflow-y-auto rounded-t-2xl border border-b-0 border-primary-light/20 bg-white p-4 sm:p-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 animate-slide-up ${
              msg.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                msg.role === "assistant"
                  ? "bg-gradient-to-br from-primary to-accent text-white"
                  : "bg-primary-light/20 text-primary-dark"
              }`}
            >
              {msg.role === "assistant" ? (
                <Sparkles className="h-4 w-4" />
              ) : (
                <span className="text-xs font-bold">{userName?.charAt(0)?.toUpperCase() || "U"}</span>
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-primary to-accent text-white"
                  : "bg-surface text-primary-dark"
              }`}
            >
              {msg.content.split("\n").map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-2" />;
                // Simple bold parsing
                const parts = line.split(/(\*\*.*?\*\*)/);
                return (
                  <p key={i} className="text-sm leading-relaxed">
                    {parts.map((part, j) =>
                      part.startsWith("**") && part.endsWith("**") ? (
                        <strong key={j}>
                          {part.slice(2, -2)}
                        </strong>
                      ) : (
                        <span key={j}>{part}</span>
                      )
                    )}
                  </p>
                );
              })}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="rounded-2xl bg-surface px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse-dot" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse-dot" style={{ animationDelay: "200ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse-dot" style={{ animationDelay: "400ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick prompts — action-oriented, implicitly set chat mode */}
      <div className="flex gap-2 overflow-x-auto border-x border-primary-light/20 bg-surface px-4 py-2">
        {(() => {
          const prompts: { label: string; mode?: ChatMode }[] = [
            { label: "Explain this simply", mode: "explain_simply" },
            { label: "Quiz me on this", mode: "quiz_me" },
            { label: "Help me think through it", mode: "socratic" },
          ];
          // Dynamic prompts based on performance
          if (flashcardPerf.weakCards.length > 0) {
            const weakFront = flashcardPerf.weakCards[0].front;
            prompts.push({ label: `Help me with: ${weakFront.length > 30 ? weakFront.slice(0, 30) + "..." : weakFront}`, mode: "explain_simply" });
          }
          if (quizHistory.length > 0) {
            const accuracy = Math.round(
              (quizHistory.filter((q) => q.isCorrect).length / quizHistory.length) * 100
            );
            prompts.push(accuracy < 70 ? { label: "Explain my mistakes", mode: "explain_simply" } : { label: "Give me harder questions", mode: "quiz_me" });
          }
          return prompts.slice(0, 5);
        })().map((prompt) => (
          <button
            key={prompt.label}
            onClick={() => prompt.mode ? sendWithMode(prompt.label, prompt.mode) : handleSend(prompt.label)}
            className="shrink-0 rounded-full border border-primary-light/20 bg-white px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-primary hover:text-primary active:scale-95"
          >
            {prompt.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 rounded-b-2xl border border-t-0 border-primary-light/20 bg-white p-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          placeholder="Ask Spark.E anything about your study material..."
          className="flex-1 rounded-xl border border-primary-light/10 bg-white px-4 py-3 text-sm text-primary-dark outline-none placeholder:text-text-secondary focus:ring-2 focus:ring-primary/20"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim()}
          aria-label="Send message"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent text-white shadow-md transition-all hover:shadow-lg disabled:opacity-40 disabled:hover:shadow-md"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
