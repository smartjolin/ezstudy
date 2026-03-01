// Spaced repetition progress tracking with SM-2 algorithm
// Persisted in localStorage so progress survives across sessions

export interface CardReviewState {
  cardIndex: number;
  easeFactor: number; // SM-2 ease factor, starts at 2.5
  interval: number; // days until next review
  repetitions: number; // consecutive correct count
  nextReviewDate: string; // ISO date string
  lastReviewDate: string;
  lastRating: number; // 0-5 quality rating
}

export interface QuizAttemptAnswer {
  questionIndex: number;
  question: string;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
}

export interface QuizAttempt {
  timestamp: string;
  score: number;
  totalQuestions: number;
  answers: QuizAttemptAnswer[];
}

export interface StudySetProgress {
  setId: string;
  cardReviews: Record<number, CardReviewState>;
  quizAttempts: QuizAttempt[];
  lastStudied: string;
}

export interface PerformanceSummary {
  masteredCount: number;
  learningCount: number;
  newCount: number;
  quizAverage: number;
  weakTopics: string[];
}

export interface FlashcardPerformance {
  totalCards: number;
  masteredCount: number;
  learningCount: number;
  newCount: number;
  weakCards: { front: string; back: string; easeFactor: number }[];
}

const PROGRESS_PREFIX = "ezstudy_progress_";

function getStorageKey(setId: string): string {
  return `${PROGRESS_PREFIX}${setId}`;
}

// ─── SM-2 Algorithm ───

export function calculateSM2(
  prev: CardReviewState,
  quality: number // 0-5: 0=blackout, 3=correct with effort, 5=easy
): CardReviewState {
  let { easeFactor, interval, repetitions } = prev;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions++;
  } else {
    // Incorrect — reset
    repetitions = 0;
    interval = 1;
  }

  // Update ease factor (minimum 1.3)
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    ...prev,
    easeFactor,
    interval,
    repetitions,
    nextReviewDate: nextReview.toISOString(),
    lastReviewDate: new Date().toISOString(),
    lastRating: quality,
  };
}

function defaultCardState(cardIndex: number): CardReviewState {
  return {
    cardIndex,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(),
    lastReviewDate: "",
    lastRating: -1,
  };
}

// ─── Persistence ───

export function getProgress(setId: string): StudySetProgress {
  if (typeof window === "undefined") {
    return { setId, cardReviews: {}, quizAttempts: [], lastStudied: "" };
  }
  try {
    const data = localStorage.getItem(getStorageKey(setId));
    if (data) return JSON.parse(data);
  } catch {
    // corrupted data, return default
  }
  return { setId, cardReviews: {}, quizAttempts: [], lastStudied: "" };
}

function saveProgress(progress: StudySetProgress): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    getStorageKey(progress.setId),
    JSON.stringify(progress)
  );
}

// ─── Card Review ───

export function saveCardReview(
  setId: string,
  cardIndex: number,
  quality: number
): CardReviewState {
  const progress = getProgress(setId);
  const prev = progress.cardReviews[cardIndex] || defaultCardState(cardIndex);
  const updated = calculateSM2(prev, quality);
  progress.cardReviews[cardIndex] = updated;
  progress.lastStudied = new Date().toISOString();
  saveProgress(progress);
  return updated;
}

// ─── Card Ordering ───

export function getCardsForReview(
  setId: string,
  totalCards: number
): number[] {
  const progress = getProgress(setId);
  const now = new Date();
  const indices = Array.from({ length: totalCards }, (_, i) => i);

  // Sort: overdue cards first (by how overdue), then new cards, then future reviews
  return indices.sort((a, b) => {
    const stateA = progress.cardReviews[a];
    const stateB = progress.cardReviews[b];

    // New cards (never reviewed) come after overdue but before future
    if (!stateA && !stateB) return a - b;
    if (!stateA) return stateB && new Date(stateB.nextReviewDate) <= now ? 1 : -1;
    if (!stateB) return stateA && new Date(stateA.nextReviewDate) <= now ? -1 : 1;

    const dueA = new Date(stateA.nextReviewDate);
    const dueB = new Date(stateB.nextReviewDate);
    const overdueA = now.getTime() - dueA.getTime();
    const overdueB = now.getTime() - dueB.getTime();

    // Both overdue: most overdue first
    if (overdueA > 0 && overdueB > 0) return overdueB - overdueA;
    // One overdue: overdue first
    if (overdueA > 0) return -1;
    if (overdueB > 0) return 1;
    // Both future: soonest first
    return dueA.getTime() - dueB.getTime();
  });
}

export function getWeakCards(setId: string, totalCards: number): number[] {
  const progress = getProgress(setId);
  const indices = Array.from({ length: totalCards }, (_, i) => i);

  // Only include cards that have been reviewed at least once
  const reviewed = indices.filter((i) => progress.cardReviews[i]);
  if (reviewed.length === 0) return indices; // if none reviewed, show all

  // Sort by ease factor (lowest = weakest)
  return reviewed.sort((a, b) => {
    const easeA = progress.cardReviews[a]?.easeFactor ?? 2.5;
    const easeB = progress.cardReviews[b]?.easeFactor ?? 2.5;
    return easeA - easeB;
  });
}

// ─── Card Status ───

export type CardStatus = "new" | "learning" | "review" | "mastered";

export function getCardStatus(
  setId: string,
  cardIndex: number
): CardStatus {
  const progress = getProgress(setId);
  const state = progress.cardReviews[cardIndex];
  if (!state || state.lastRating === -1) return "new";
  if (state.repetitions === 0) return "learning";
  if (state.interval >= 21) return "mastered";
  return "review";
}

export function getCardStatuses(
  setId: string,
  totalCards: number
): Record<number, CardStatus> {
  const result: Record<number, CardStatus> = {};
  for (let i = 0; i < totalCards; i++) {
    result[i] = getCardStatus(setId, i);
  }
  return result;
}

export function getDueCount(setId: string, totalCards: number): number {
  const progress = getProgress(setId);
  const now = new Date();
  let count = 0;
  for (let i = 0; i < totalCards; i++) {
    const state = progress.cardReviews[i];
    if (!state || new Date(state.nextReviewDate) <= now) count++;
  }
  return count;
}

// ─── Quiz Persistence ───

export function saveQuizAttempt(setId: string, attempt: QuizAttempt): void {
  const progress = getProgress(setId);
  progress.quizAttempts.push(attempt);
  progress.lastStudied = new Date().toISOString();
  saveProgress(progress);
}

// ─── Performance Summary ───

export function getPerformanceSummary(
  setId: string,
  totalCards: number
): PerformanceSummary {
  const progress = getProgress(setId);
  let masteredCount = 0;
  let learningCount = 0;
  let newCount = 0;

  for (let i = 0; i < totalCards; i++) {
    const status = getCardStatus(setId, i);
    if (status === "mastered") masteredCount++;
    else if (status === "learning" || status === "review") learningCount++;
    else newCount++;
  }

  // Quiz average from last 5 attempts
  const recentAttempts = progress.quizAttempts.slice(-5);
  const quizAverage =
    recentAttempts.length > 0
      ? recentAttempts.reduce((sum, a) => sum + a.score / a.totalQuestions, 0) /
        recentAttempts.length
      : 0;

  // Weak topics from incorrect quiz answers
  const incorrectAnswers = progress.quizAttempts
    .flatMap((a) => a.answers)
    .filter((a) => !a.isCorrect);
  const topicCounts: Record<string, number> = {};
  incorrectAnswers.forEach((a) => {
    const topic = a.question.split(" ").slice(0, 5).join(" ");
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  });
  const weakTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);

  return { masteredCount, learningCount, newCount, quizAverage, weakTopics };
}

export function getFlashcardPerformance(
  setId: string,
  cards: { front: string; back: string }[]
): FlashcardPerformance {
  const progress = getProgress(setId);
  let masteredCount = 0;
  let learningCount = 0;
  let newCount = 0;

  for (let i = 0; i < cards.length; i++) {
    const status = getCardStatus(setId, i);
    if (status === "mastered") masteredCount++;
    else if (status === "learning" || status === "review") learningCount++;
    else newCount++;
  }

  // Weak cards: reviewed cards sorted by ease factor, take bottom 5
  const reviewed = cards
    .map((card, i) => ({
      ...card,
      easeFactor: progress.cardReviews[i]?.easeFactor ?? 2.5,
      index: i,
      hasReview: !!progress.cardReviews[i],
    }))
    .filter((c) => c.hasReview)
    .sort((a, b) => a.easeFactor - b.easeFactor)
    .slice(0, 5);

  return {
    totalCards: cards.length,
    masteredCount,
    learningCount,
    newCount,
    weakCards: reviewed.map((c) => ({
      front: c.front,
      back: c.back,
      easeFactor: c.easeFactor,
    })),
  };
}
