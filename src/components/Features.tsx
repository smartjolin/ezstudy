"use client";

import {
  FileText,
  Layers,
  ClipboardCheck,
  Bot,
  Image,
  Mic,
  PenTool,
  GraduationCap,
  Phone,
  Headphones,
  Video,
  Calendar,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    name: "Notes AI",
    description:
      "Create comprehensive notes from your course material in seconds.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Layers,
    name: "Flashcards AI",
    description:
      "Generate flashcards from your materials with a single click.",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: ClipboardCheck,
    name: "Quizzes AI",
    description:
      "Create and practice with quizzes tailored to your course material.",
    color: "from-green-500 to-green-600",
  },
  {
    icon: Bot,
    name: "Spark.E AI Tutor",
    description:
      "Talk to your personal AI tutor and learn concepts in real time.",
    color: "from-orange-500 to-orange-600",
  },
  {
    icon: Image,
    name: "Visual Analysis",
    description:
      "Ask questions about pictures, diagrams, and charts from your notes.",
    color: "from-pink-500 to-pink-600",
  },
  {
    icon: Mic,
    name: "Record Live Lecture",
    description:
      "Take notes and ask questions in real-time during your lectures.",
    color: "from-red-500 to-red-600",
  },
  {
    icon: PenTool,
    name: "Essay Grader",
    description:
      "Grade your essays and get personalized feedback and suggestions.",
    color: "from-indigo-500 to-indigo-600",
  },
  {
    icon: GraduationCap,
    name: "Tutor Me",
    description:
      "Get taught an entire lecture about your course material by Spark.E.",
    color: "from-teal-500 to-teal-600",
  },
  {
    icon: Phone,
    name: "Call with Spark.E",
    description: "Have a voice conversation with Spark.E about your material.",
    color: "from-cyan-500 to-cyan-600",
  },
  {
    icon: Headphones,
    name: "Audio Recap",
    description:
      "Generate a podcast-style summary from your study materials.",
    color: "from-amber-500 to-amber-600",
  },
  {
    icon: Video,
    name: "Explainer Video",
    description:
      "Generate educational explainer videos using AI from your content.",
    color: "from-rose-500 to-rose-600",
  },
  {
    icon: Calendar,
    name: "Study Calendar",
    description:
      "Plan your study sessions with AI and achieve your academic goals.",
    color: "from-violet-500 to-violet-600",
  },
];

export default function Features() {
  return (
    <section id="features" className="bg-surface py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
            Explore Features
          </h2>
          <p className="mt-2 text-3xl font-bold text-primary-dark sm:text-4xl">
            Your course material to an entire study set in 1 click
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-text-secondary">
            Automatically receive flashcards, quizzes, and personalized chat
            help from your notes, videos, and PowerPoints.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="group cursor-pointer rounded-2xl border border-primary-light/10 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-lg`}
              >
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-primary-dark">
                {feature.name}
              </h3>
              <p className="text-sm leading-relaxed text-text-secondary">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
