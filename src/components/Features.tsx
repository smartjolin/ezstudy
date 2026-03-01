import {
  FileText,
  Layers,
  ClipboardCheck,
  Bot,
} from "lucide-react";

const features = [
  {
    icon: Layers,
    name: "AI Flashcards",
    description:
      "Upload a PDF and get flashcards instantly. Spaced repetition tracks which concepts each student struggles with.",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: ClipboardCheck,
    name: "AI Quizzes",
    description:
      "Auto-generated quizzes with multiple question types. Students get hints and explanations so they learn from mistakes.",
    color: "from-green-500 to-green-600",
  },
  {
    icon: FileText,
    name: "AI Notes",
    description:
      "Turn your lesson materials into well-organized study notes your students can review before or after sessions.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Bot,
    name: "Spark.E AI Tutor",
    description:
      "An AI tutor that adapts to each student. It can explain concepts simply, quiz them, or guide them through problems step by step.",
    color: "from-orange-500 to-orange-600",
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

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2">
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
