import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-accent py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent-light/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/90">
          <Sparkles className="h-4 w-4" />
          Ready to prepare your next lesson?
        </div>
        <h2 className="text-4xl font-extrabold text-white sm:text-5xl">
          Create study materials in seconds
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/70">
          Upload your course materials and let AI generate flashcards, quizzes,
          and notes for you. Completely free — no credit card, no catch.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="group flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-primary-dark shadow-xl transition-all hover:bg-surface hover:shadow-2xl"
          >
            Get Started
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
