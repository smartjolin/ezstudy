import {
  FileText,
  Layers,
  ClipboardCheck,
  Bot,
  GraduationCap,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: Layers,
    name: "AI Flashcards",
    description:
      "Generate flashcards from your materials with one click. Spaced repetition helps you remember what matters most.",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: ClipboardCheck,
    name: "AI Quizzes",
    description:
      "Practice with multiple-choice quizzes tailored to your material. Get hints, explanations, and track your score.",
    color: "from-green-500 to-green-600",
  },
  {
    icon: FileText,
    name: "AI Notes",
    description:
      "Get comprehensive, well-organized notes generated from your course material in seconds.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Bot,
    name: "Spark.E AI Tutor",
    description:
      "Chat with your personal AI tutor. It adapts to your weak areas and supports Socratic, quiz, and simple explanation modes.",
    color: "from-orange-500 to-orange-600",
  },
  {
    icon: GraduationCap,
    name: "Tutor Sessions",
    description:
      "Tutors can schedule sessions with students, take notes, and generate AI-powered session recaps for parents.",
    color: "from-teal-500 to-teal-600",
  },
  {
    icon: BarChart3,
    name: "Progress Tracking",
    description:
      "Track your mastery with spaced repetition stats, quiz scores, and study streaks across all your study sets.",
    color: "from-indigo-500 to-indigo-600",
  },
];

export default function Features() {
  return (
    <section id="features" className="bg-surface py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
            Features
          </h2>
          <p className="mt-2 text-3xl font-bold text-primary-dark sm:text-4xl">
            Your course material to a complete study set in one click
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-text-secondary">
            Upload your notes or PDFs and get flashcards, quizzes, and
            personalized AI tutoring — all for free.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
