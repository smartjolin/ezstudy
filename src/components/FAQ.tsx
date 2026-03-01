"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How does the AI generate study materials?",
    answer:
      "Upload your course materials (PDFs, slides, notes, videos) and our AI analyzes the content to extract key concepts. It then generates flashcards, quizzes, notes, and study guides tailored to your specific material, ensuring everything is relevant to what you need to learn.",
  },
  {
    question: "What file formats can I upload?",
    answer:
      "You can upload PDFs, PowerPoint presentations, Word documents, images of notes, lecture recordings, and even YouTube video links. Our platform processes all of these formats and transforms them into organized study materials.",
  },
  {
    question: "How accurate are the AI-generated study tools?",
    answer:
      "Every flashcard, quiz question, and study tool comes with citations back to your original materials. The AI is grounded in exactly what your professor gave you, so you can trust the content is accurate and relevant.",
  },
  {
    question: "Can I use this for any subject?",
    answer:
      "Yes! Whether you're studying biology, calculus, history, law, medicine, or any other subject, our AI adapts to your content. You can even type in a topic without uploading materials and get study tools generated automatically.",
  },
  {
    question: "What is Spark.E?",
    answer:
      "Spark.E is your personal AI tutor. It can answer questions about your study materials, explain complex concepts, grade your essays, walk you through problems step by step, and even have voice conversations with you about your coursework.",
  },
  {
    question: "Is my uploaded content private?",
    answer:
      "Yes, absolutely. Your uploaded materials are private by default. You have full control over who can see your content. We take data privacy seriously and never share your materials with other users.",
  },
  {
    question: "Does it work on mobile?",
    answer:
      "Yes! The platform works on web, iOS, and Android. Your study materials sync across all your devices so you can study anywhere, anytime.",
  },
  {
    question: "What if my exam is tomorrow?",
    answer:
      "We have a cram mode that identifies the most important concepts from your materials and prioritizes them. Even if you're starting the night before, you'll get the key information front and center to make the most of your time.",
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
