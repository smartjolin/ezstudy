// AI-generated study sets — persisted in both localStorage and sessionStorage
export interface GeneratedStudySet {
  id: string;
  title: string;
  description: string;
  flashcards: { front: string; back: string }[];
  quizQuestions: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    hint?: string;
  }[];
  notes: { title: string; content: string }[];
  createdAt: string;
}

const STORAGE_KEY = "ezstudy_generated_sets";

export function saveGeneratedSet(set: GeneratedStudySet) {
  if (typeof window === "undefined") return;
  const existing = getGeneratedSets();
  existing.unshift(set);
  const json = JSON.stringify(existing);
  sessionStorage.setItem(STORAGE_KEY, json);
  try {
    localStorage.setItem(STORAGE_KEY, json);
  } catch {
    // localStorage full or unavailable — sessionStorage still works
  }
}

export function getGeneratedSets(): GeneratedStudySet[] {
  if (typeof window === "undefined") return [];
  try {
    // Try localStorage first (persists across tabs/sessions), fall back to sessionStorage
    const data =
      localStorage.getItem(STORAGE_KEY) ||
      sessionStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getGeneratedSet(id: string): GeneratedStudySet | undefined {
  return getGeneratedSets().find((s) => s.id === id);
}
