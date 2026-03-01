import { Zap, Heart, Globe } from "lucide-react";

const values = [
  {
    icon: Zap,
    title: "Instant Study Tools",
    description:
      "Upload your materials and get flashcards, quizzes, and notes generated in seconds — no manual work needed.",
  },
  {
    icon: Heart,
    title: "100% Free, Always",
    description:
      "Built to help students and tutors learn better. No subscriptions, no paywalls, no hidden costs.",
  },
  {
    icon: Globe,
    title: "For Everyone",
    description:
      "Whether you're a student, tutor, or self-learner — EzStudy adapts to any subject at any level.",
  },
];

export default function Stats() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
            Why EzStudy
          </h2>
          <p className="mt-2 text-3xl font-bold text-primary-dark sm:text-4xl">
            Learning is hard. We make it easier.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {values.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-primary-light/20 bg-surface p-8 text-center shadow-sm transition-all hover:shadow-md"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg">
                <item.icon className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-primary-dark">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-text-secondary">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
