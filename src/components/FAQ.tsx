"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How does the AI generate study materials?",
    answer:
      "Upload your course materials (PDFs, text documents, or notes) or type in a topic, and our AI analyzes the content to extract key concepts. It then generates flashcards, quizzes, and study notes tailored to your specific material.",
  },
  {
    question: "What can I upload?",
    answer:
      "You can upload PDF documents and text files, or simply type in a topic and let the AI generate study materials from scratch. We're working on supporting more formats in the future.",
  },
  {
    question: "Is EzStudy really free?",
    answer:
      "Yes, EzStudy is completely free to use. We believe every student deserves access to effective study tools, and the AI costs are low enough that we can offer this as a free service. No credit card required, no hidden fees.",
  },
  {
    question: "Can I use this for any subject?",
    answer:
      "Yes! Whether you're studying English, science, history, maths, or any other subject, the AI adapts to your content. You can also customize the grade level and difficulty when generating study sets.",
  },
  {
    question: "What is Spark.E?",
    answer:
      "Spark.E is your personal AI tutor built into every study set. It can answer questions about your study materials, explain complex concepts, quiz you, and guide you through topics using the Socratic method. It also tracks your quiz and flashcard performance to focus on your weak areas.",
  },
  {
    question: "How does spaced repetition work?",
    answer:
      "EzStudy uses the SM-2 spaced repetition algorithm for flashcards. When you rate how well you know a card (Again, Good, or Easy), the system schedules it for review at the optimal time. Cards you struggle with appear more often, while mastered cards appear less frequently.",
  },
  {
    question: "Is my uploaded content private?",
    answer:
      "Yes. Your uploaded materials and generated study sets are private to your account. We do not share your content with other users.",
  },
  {
    question: "Can tutors use this with their students?",
    answer:
      "Absolutely! Tutors can create study sets for their students, schedule tutoring sessions, and generate session recaps. The platform is designed for both independent study and tutor-student collaboration.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-white py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
            FAQ
          </h2>
          <p className="mt-2 text-3xl font-bold text-primary-dark sm:text-4xl">
            Frequently Asked Questions
          </p>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border border-primary-light/20 bg-surface transition-all"
            >
              <button
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
                className="flex w-full items-center justify-between px-6 py-5 text-left"
              >
                <span className="pr-4 font-semibold text-primary-dark">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-primary transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="border-t border-primary-light/10 px-6 pb-5 pt-3">
                  <p className="leading-relaxed text-text-secondary">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
