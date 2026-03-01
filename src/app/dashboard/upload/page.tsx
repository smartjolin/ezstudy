"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  BookOpen,
  Save,
  FolderOpen,
  Trash2,
} from "lucide-react";
import { saveGeneratedSet } from "@/lib/store";
import type { GeneratedStudySet } from "@/lib/store";

interface SettingsTemplate {
  name: string;
  subject: string;
  gradeLevel: string;
  difficulty: string;
  curriculum: string;
  customInstructions: string;
  contentAmount: string;
}

function getSavedTemplates(): SettingsTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("ezstudy-templates");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTemplate(template: SettingsTemplate) {
  const existing = getSavedTemplates();
  const updated = existing.filter((t) => t.name !== template.name);
  updated.push(template);
  localStorage.setItem("ezstudy-templates", JSON.stringify(updated));
}

function deleteTemplate(name: string) {
  const existing = getSavedTemplates();
  localStorage.setItem(
    "ezstudy-templates",
    JSON.stringify(existing.filter((t) => t.name !== name))
  );
}

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [topic, setTopic] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Smart defaults: load last-used settings from localStorage
  const getLastSettings = () => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("ezstudy-last-settings");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };
  const lastSettings = getLastSettings();
  const [subject, setSubject] = useState(lastSettings?.subject || "General");
  const [gradeLevel, setGradeLevel] = useState(lastSettings?.gradeLevel || "Middle School");
  const [difficulty, setDifficulty] = useState(lastSettings?.difficulty || "Medium");
  const [curriculum, setCurriculum] = useState(lastSettings?.curriculum || "None");
  const [customInstructions, setCustomInstructions] = useState(lastSettings?.customInstructions || "");
  const [contentAmount, setContentAmount] = useState(lastSettings?.contentAmount || "standard");
  const [stepsDone, setStepsDone] = useState({
    flashcards: false,
    quizzes: false,
    notes: false,
    tutor: false,
  });
  const [templates, setTemplates] = useState<SettingsTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  // Load templates on mount
  useState(() => {
    setTemplates(getSavedTemplates());
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (f) =>
        f.name.toLowerCase().endsWith(".pdf") ||
        f.name.toLowerCase().endsWith(".txt") ||
        f.name.toLowerCase().endsWith(".md")
    );
    if (droppedFiles.length === 0) {
      setError("Only PDF and text files are supported.");
      return;
    }
    setFiles((prev) => [...prev, ...droppedFiles]);
    setError("");
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const extractPdfText = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/extract-pdf", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to extract PDF text");
    }
    const data = await res.json();
    return data.text;
  };

  const handleGenerate = async () => {
    setIsProcessing(true);
    setError("");
    setProgress(10);

    try {
      // Save current settings for next time
      localStorage.setItem("ezstudy-last-settings", JSON.stringify({
        subject, gradeLevel, difficulty, curriculum, customInstructions, contentAmount,
      }));

      // Extract text from all files
      let materialContent = "";
      for (const file of files) {
        if (file.name.toLowerCase().endsWith(".pdf")) {
          setProgress(15);
          materialContent += await extractPdfText(file);
          materialContent += "\n\n";
        } else if (
          file.type === "text/plain" ||
          file.name.endsWith(".txt") ||
          file.name.endsWith(".md")
        ) {
          materialContent += await file.text();
          materialContent += "\n\n";
        }
      }

      const topicText =
        topic.trim() ||
        (files.length > 0
          ? `Study materials from: ${files.map((f) => f.name).join(", ")}`
          : "General study topic");

      setProgress(25);

      // Call the generate API
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicText,
          materialContent: materialContent || undefined,
          subject,
          gradeLevel,
          difficulty,
          curriculum,
          customInstructions: customInstructions.trim() || undefined,
          contentAmount,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      setProgress(50);
      setStepsDone((prev) => ({ ...prev, flashcards: true }));

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate study materials");
      }

      const studySet = await res.json();

      setProgress(70);
      setStepsDone((prev) => ({ ...prev, quizzes: true }));

      const setId = `gen-${Date.now()}`;
      const generated: GeneratedStudySet = {
        id: setId,
        title: studySet.title || topicText,
        description: studySet.description || `Study set about ${topicText}`,
        flashcards: studySet.flashcards || [],
        quizQuestions: studySet.quizQuestions || [],
        notes: studySet.notes || [],
        createdAt: new Date().toISOString(),
      };

      setProgress(85);
      setStepsDone((prev) => ({ ...prev, notes: true }));

      saveGeneratedSet(generated);

      setProgress(100);
      setStepsDone((prev) => ({ ...prev, tutor: true }));

      setTimeout(() => {
        router.push(`/dashboard/sets/${setId}`);
      }, 800);
    } catch (err) {
      console.error("Generation error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setIsProcessing(false);
      setProgress(0);
      setStepsDone({
        flashcards: false,
        quizzes: false,
        notes: false,
        tutor: false,
      });
    }
  };

  const hasContent = files.length > 0 || topic.trim();

  if (isProcessing) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
            {progress < 100 ? (
              <Loader2 className="h-10 w-10 animate-spin text-white" />
            ) : (
              <CheckCircle2 className="h-10 w-10 text-white" />
            )}
          </div>
          <h2 className="text-2xl font-extrabold text-primary-dark">
            {progress < 100
              ? "Generating Study Tools with AI..."
              : "All Done!"}
          </h2>
          <p className="mt-2 text-text-secondary">
            {progress < 20
              ? "Extracting text from your materials..."
              : progress < 40
                ? "Sending content to AI..."
                : progress < 60
                  ? "Creating flashcards and quizzes..."
                  : progress < 90
                    ? "Generating notes and summaries..."
                    : "Finalizing your study set..."}
          </p>

          <div className="mx-auto mt-8 w-full max-w-md">
            <div className="h-3 overflow-hidden rounded-full bg-primary-light/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-text-secondary">{progress}%</p>
          </div>

          {progress < 100 && (
            <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-3">
              {[
                { label: "Flashcards", done: stepsDone.flashcards },
                { label: "Quizzes", done: stepsDone.quizzes },
                { label: "Notes", done: stepsDone.notes },
                { label: "AI Tutor Ready", done: stepsDone.tutor },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm ${
                    item.done
                      ? "border-success/30 bg-success/5 text-success"
                      : "border-primary-light/20 bg-white text-text-secondary"
                  }`}
                >
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {item.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-primary-dark">
          Upload Study Materials
        </h1>
        <p className="mt-1 text-text-secondary">
          Upload a PDF, paste text, or enter a topic to generate AI study tools.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`mb-6 rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-primary-light/30 bg-white hover:border-primary-light"
        }`}
      >
        <div className="flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-light/20 to-accent-light/20">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <p className="text-lg font-semibold text-primary-dark">
            Drag & drop your files here
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            or click to browse files
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-text-secondary">
              PDF
            </span>
            <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-text-secondary">
              TXT
            </span>
          </div>
          <input
            type="file"
            multiple
            accept=".pdf,.txt,.md"
            onChange={handleFileSelect}
            className="absolute inset-0 cursor-pointer opacity-0"
            style={{ position: "relative", marginTop: "1rem" }}
          />
        </div>
      </div>

      {/* Selected files */}
      {files.length > 0 && (
        <div className="mb-6 rounded-2xl border border-primary-light/20 bg-white p-4">
          <h3 className="mb-3 font-semibold text-primary-dark">
            Selected Files ({files.length})
          </h3>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-xl bg-surface px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-primary-dark">
                      {file.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="rounded-lg p-1 text-text-secondary hover:bg-white hover:text-danger"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topic input */}
      <div className="mb-8 rounded-2xl border border-primary-light/20 bg-white p-6">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-primary-dark">
          <Sparkles className="h-5 w-5 text-primary" />
          Or just enter a topic
        </h3>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Photosynthesis and Plant Biology"
          className="w-full rounded-xl border border-primary-light/20 bg-surface px-4 py-3 text-sm text-primary-dark outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <p className="mt-2 text-xs text-text-secondary">
          No materials? No problem! We&apos;ll generate study tools from any
          topic.
        </p>
      </div>

      {/* Generation Settings (collapsible) — shows current settings inline */}
      <div className="mb-8 rounded-2xl border border-primary-light/20 bg-white">
        <button
          type="button"
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="flex w-full items-center justify-between p-6"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-primary-dark">
              Settings:
            </h3>
            <span className="text-sm text-text-secondary">
              {subject} · {gradeLevel} · {difficulty} · {contentAmount === "quick" ? "Quick" : contentAmount === "comprehensive" ? "Comprehensive" : "Standard"}
            </span>
          </div>
          {settingsOpen ? (
            <ChevronUp className="h-5 w-5 text-text-secondary" />
          ) : (
            <ChevronDown className="h-5 w-5 text-text-secondary" />
          )}
        </button>

        {settingsOpen && (
          <div className="space-y-6 border-t border-primary-light/10 px-6 pb-6 pt-4">
            {/* Row 1: Subject + Grade Level */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-primary-dark">
                  <BookOpen className="mr-1 inline h-4 w-4" />
                  Subject
                </label>
                <div className="flex flex-wrap gap-2">
                  {["General", "English", "Science", "Maths", "History"].map(
                    (s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSubject(s)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                          subject === s
                            ? "bg-primary text-white shadow-md"
                            : "border border-primary-light/20 bg-surface text-text-secondary hover:border-primary hover:text-primary-dark"
                        }`}
                      >
                        {s}
                      </button>
                    )
                  )}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-primary-dark">
                  Grade Level
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Elementary", "Middle School", "High School", "AP/College"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setGradeLevel(level)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        gradeLevel === level
                          ? "bg-primary text-white shadow-md"
                          : "border border-primary-light/20 bg-surface text-text-secondary hover:border-primary hover:text-primary-dark"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Difficulty + Content Amount */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-primary-dark">
                  Difficulty
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Easy", "Medium", "Hard"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        difficulty === d
                          ? "bg-primary text-white shadow-md"
                          : "border border-primary-light/20 bg-surface text-text-secondary hover:border-primary hover:text-primary-dark"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-primary-dark">
                  Content Amount
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "quick", label: "Quick (5 cards, 3 quiz)" },
                    { key: "standard", label: "Standard (8 cards, 5 quiz)" },
                    { key: "comprehensive", label: "Comprehensive (15 cards, 10 quiz)" },
                  ].map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setContentAmount(option.key)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        contentAmount === option.key
                          ? "bg-primary text-white shadow-md"
                          : "border border-primary-light/20 bg-surface text-text-secondary hover:border-primary hover:text-primary-dark"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced Options (nested collapsible) */}
            <div className="border-t border-primary-light/10 pt-4">
              <button
                type="button"
                onClick={() => setAdvancedOpen(!advancedOpen)}
                className="flex items-center gap-2 text-sm font-medium text-text-secondary transition-all hover:text-primary-dark"
              >
                {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Advanced Options
                {(curriculum !== "None" || customInstructions.trim()) && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">configured</span>
                )}
              </button>

              {advancedOpen && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-primary-dark">
                      Curriculum Alignment
                    </label>
                    <select
                      value={curriculum}
                      onChange={(e) => setCurriculum(e.target.value)}
                      className="w-full rounded-xl border border-primary-light/20 bg-surface px-4 py-3 text-sm text-primary-dark outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="None">None</option>
                      <option value="IB MYP">IB MYP (International Baccalaureate)</option>
                      <option value="IGCSE">IGCSE (Cambridge)</option>
                      <option value="Common Core">Common Core (US)</option>
                      <option value="AP Standards">AP Standards</option>
                      <option value="IB Programme">IB Diploma Programme</option>
                      <option value="HKDSE">HKDSE (Local HK)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-primary-dark">
                      Custom Instructions
                    </label>
                    <textarea
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="e.g., Focus on vocabulary, include trick questions, emphasize key formulas..."
                      rows={3}
                      className="w-full resize-none rounded-xl border border-primary-light/20 bg-surface px-4 py-3 text-sm text-primary-dark outline-none transition-all placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Templates — only show when templates exist or when saving */}
            {(templates.length > 0 || showSaveTemplate) && (
              <div className="border-t border-primary-light/10 pt-4">
                <label className="mb-2 block text-sm font-medium text-primary-dark">
                  Settings Templates
                </label>
                <div className="flex flex-wrap gap-2">
                  {templates.map((t) => (
                    <div
                      key={t.name}
                      className="group flex items-center gap-1 rounded-full border border-primary-light/20 bg-surface pl-4 pr-1 py-1"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSubject(t.subject);
                          setGradeLevel(t.gradeLevel);
                          setDifficulty(t.difficulty);
                          setCurriculum(t.curriculum);
                          setCustomInstructions(t.customInstructions);
                          setContentAmount(t.contentAmount);
                        }}
                        className="flex items-center gap-1.5 text-sm font-medium text-primary-dark hover:text-primary"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        {t.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteTemplate(t.name);
                          setTemplates(getSavedTemplates());
                        }}
                        className="rounded-full p-1 text-text-secondary/50 opacity-0 transition-all hover:text-danger group-hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {!showSaveTemplate && (
                    <button
                      type="button"
                      onClick={() => setShowSaveTemplate(true)}
                      className="flex items-center gap-1.5 rounded-full border border-dashed border-primary-light/30 px-4 py-1.5 text-sm font-medium text-text-secondary transition-all hover:border-primary hover:text-primary"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save Current
                    </button>
                  )}
                </div>
              </div>
            )}
            {showSaveTemplate && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template name..."
                  className="rounded-full border border-primary-light/20 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && templateName.trim()) {
                      saveTemplate({ name: templateName.trim(), subject, gradeLevel, difficulty, curriculum, customInstructions, contentAmount });
                      setTemplates(getSavedTemplates());
                      setTemplateName("");
                      setShowSaveTemplate(false);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (templateName.trim()) {
                      saveTemplate({ name: templateName.trim(), subject, gradeLevel, difficulty, curriculum, customInstructions, contentAmount });
                      setTemplates(getSavedTemplates());
                      setTemplateName("");
                      setShowSaveTemplate(false);
                    }
                  }}
                  className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => { setShowSaveTemplate(false); setTemplateName(""); }}
                  className="text-text-secondary hover:text-primary-dark"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!hasContent}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-semibold transition-all ${
          hasContent
            ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl hover:brightness-110"
            : "cursor-not-allowed bg-gray-200 text-gray-400"
        }`}
      >
        <Sparkles className="h-5 w-5" />
        Generate Study Tools with AI
      </button>
    </div>
  );
}
