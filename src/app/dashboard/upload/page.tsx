"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Image,
  Video,
  Mic,
  Link as LinkIcon,
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from "lucide-react";
import { saveGeneratedSet } from "@/lib/store";
import type { GeneratedStudySet } from "@/lib/store";

const fileTypes = [
  { icon: FileText, label: "PDF", accept: ".pdf", color: "text-red-500" },
  { icon: FileText, label: "PPTX", accept: ".pptx,.ppt", color: "text-orange-500" },
  { icon: FileText, label: "DOCX", accept: ".docx,.doc", color: "text-blue-500" },
  { icon: Image, label: "Images", accept: ".jpg,.jpeg,.png", color: "text-green-500" },
  { icon: Video, label: "Video", accept: ".mp4,.mov", color: "text-purple-500" },
  { icon: Mic, label: "Audio", accept: ".mp3,.wav", color: "text-pink-500" },
];

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [topic, setTopic] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gradeLevel, setGradeLevel] = useState("High School");
  const [difficulty, setDifficulty] = useState("Medium");
  const [curriculum, setCurriculum] = useState("None");
  const [customInstructions, setCustomInstructions] = useState("");
  const [contentAmount, setContentAmount] = useState("standard");
  const [stepsDone, setStepsDone] = useState({
    flashcards: false,
    quizzes: false,
    notes: false,
    tutor: false,
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    setIsProcessing(true);
    setError("");
    setProgress(10);

    try {
      // Determine what to send to the API
      const topicText =
        topic.trim() ||
        (files.length > 0
          ? `Study materials from files: ${files.map((f) => f.name).join(", ")}`
          : youtubeUrl.trim()
          ? `YouTube video: ${youtubeUrl}`
          : "General study topic");

      // Read file contents if text-based files are provided
      let materialContent = "";
      for (const file of files) {
        if (
          file.type === "text/plain" ||
          file.name.endsWith(".txt") ||
          file.name.endsWith(".md")
        ) {
          materialContent += await file.text();
          materialContent += "\n\n";
        }
      }

      setProgress(20);

      // Call the generate API (allow up to 60s for AI generation)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicText,
          materialContent: materialContent || undefined,
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

      // Create the generated set with a unique ID
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

      // Save to session storage
      saveGeneratedSet(generated);

      setProgress(100);
      setStepsDone((prev) => ({ ...prev, tutor: true }));

      // Navigate to the new study set
      setTimeout(() => {
        router.push(`/dashboard/sets/${setId}`);
      }, 800);
    } catch (err) {
      console.error("Generation error:", err);
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setIsProcessing(false);
      setProgress(0);
      setStepsDone({ flashcards: false, quizzes: false, notes: false, tutor: false });
    }
  };

  const hasContent = files.length > 0 || youtubeUrl.trim() || topic.trim();

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
              ? "Generating Study Tools with DeepSeek AI..."
              : "All Done!"}
          </h2>
          <p className="mt-2 text-text-secondary">
            {progress < 30
              ? "Sending your materials to AI..."
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
          Upload your course materials or enter a topic to generate AI study
          tools.
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
            {fileTypes.map((type) => (
              <span
                key={type.label}
                className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-text-secondary"
              >
                {type.label}
              </span>
            ))}
          </div>
          <input
            type="file"
            multiple
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

      {/* YouTube URL */}
      <div className="mb-6 rounded-2xl border border-primary-light/20 bg-white p-6">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-primary-dark">
          <LinkIcon className="h-5 w-5 text-primary" />
          YouTube Video Link
        </h3>
        <input
          type="url"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full rounded-xl border border-primary-light/20 bg-surface px-4 py-3 text-sm text-primary-dark outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

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
          placeholder="e.g., Introduction to Cellular Biology"
          className="w-full rounded-xl border border-primary-light/20 bg-surface px-4 py-3 text-sm text-primary-dark outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <p className="mt-2 text-xs text-text-secondary">
          No materials? No problem! We&apos;ll generate study tools from any
          topic.
        </p>
      </div>

      {/* Generation Settings (collapsible) */}
      <div className="mb-8 rounded-2xl border border-primary-light/20 bg-white">
        <button
          type="button"
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="flex w-full items-center justify-between p-6"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-primary-dark">
              Generation Settings
            </h3>
          </div>
          {settingsOpen ? (
            <ChevronUp className="h-5 w-5 text-text-secondary" />
          ) : (
            <ChevronDown className="h-5 w-5 text-text-secondary" />
          )}
        </button>

        {settingsOpen && (
          <div className="space-y-6 border-t border-primary-light/10 px-6 pb-6 pt-4">
            {/* Grade Level */}
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-dark">
                Grade Level
              </label>
              <div className="flex flex-wrap gap-2">
                {["Elementary", "Middle School", "High School", "AP/College"].map(
                  (level) => (
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
                  )
                )}
              </div>
            </div>

            {/* Difficulty */}
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

            {/* Curriculum Alignment */}
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
                <option value="Common Core">Common Core</option>
                <option value="AP Standards">AP Standards</option>
                <option value="IB Programme">IB Programme</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            {/* Custom Instructions */}
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

            {/* Content Amount */}
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
