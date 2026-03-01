"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Sparkles } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-primary-dark">
              EzStudy
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/#features"
              className="text-sm font-medium text-text-secondary transition-colors hover:text-primary"
            >
              Features
            </Link>
            <Link
              href="/#faq"
              className="text-sm font-medium text-text-secondary transition-colors hover:text-primary"
            >
              FAQ
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-text-secondary transition-colors hover:text-primary"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110"
            >
              Sign Up
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="h-6 w-6 text-primary-dark" />
            ) : (
              <Menu className="h-6 w-6 text-primary-dark" />
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-primary-light/20 bg-white px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-3">
            <Link
              href="/#features"
              onClick={() => setIsOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface"
            >
              Features
            </Link>
            <Link
              href="/#faq"
              onClick={() => setIsOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface"
            >
              FAQ
            </Link>
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-center text-sm font-semibold text-white"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
