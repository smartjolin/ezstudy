import { Upload, Cpu, BookOpen } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Your Materials",
    description:
      "Upload PDFs or text files, or simply type in any topic. The AI works with whatever you give it.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "AI Generates Study Tools",
    description:
      "Our AI analyzes your content and instantly creates flashcards, quizzes, and comprehensive study notes.",
  },
  {
    icon: BookOpen,
    step: "03",
    title: "Study & Track Progress",
    description:
      "Use your personalized study tools, chat with your AI tutor, and track your mastery over time.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
            How It Works
          </h2>
          <p className="mt-2 text-3xl font-bold text-primary-dark sm:text-4xl">
            Get insights. Practice what matters. Track your progress.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.step} className="relative text-center">
              {index < steps.length - 1 && (
                <div className="absolute right-0 top-12 hidden h-0.5 w-full translate-x-1/2 bg-gradient-to-r from-primary-light/40 to-transparent md:block" />
              )}
              <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl">
                <step.icon className="h-10 w-10 text-white" />
                <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-primary shadow-md">
                  {step.step}
                </span>
              </div>
              <h3 className="mb-3 text-xl font-bold text-primary-dark">
                {step.title}
              </h3>
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-text-secondary">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
