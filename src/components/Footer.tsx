import Link from "next/link";
import { Sparkles } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "FAQ", href: "/#faq" },
  ],
  Features: [
    { label: "AI Flashcards", href: "/#features" },
    { label: "AI Quizzes", href: "/#features" },
    { label: "AI Notes", href: "/#features" },
    { label: "AI Tutor", href: "/#features" },
  ],
  Company: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
  "Get Started": [
    { label: "Sign Up", href: "/signup" },
    { label: "Login", href: "/login" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-primary-light/20 bg-primary-dark text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-light to-accent-light">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">EzStudy</span>
            </Link>
            <p className="mt-4 text-sm text-white/60">
              Free AI-powered study tools for students and tutors. Upload your
              materials, study smarter.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/80">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-white/40">
          &copy; {new Date().getFullYear()} EzStudy. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
