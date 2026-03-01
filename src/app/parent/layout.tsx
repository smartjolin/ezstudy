"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GraduationCap, LogOut, User } from "lucide-react";

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [parentName, setParentName] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("");

  useEffect(() => {
    // Fetch parent info from session or a profile endpoint
    // For now we parse from a lightweight call
    fetch("/api/branding")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.businessName) setBusinessName(data.businessName);
      })
      .catch(() => {});

    // Attempt to get parent name from a session-like endpoint
    // This is a lightweight approach; in production this would come from next-auth session
    setParentName("Parent");
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <header className="border-b border-primary-light/10 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/parent" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-primary-dark">
              {businessName
                ? `${businessName}'s Learning Portal`
                : "Learning Portal"}
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light/20">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="hidden text-sm font-medium text-primary-dark sm:block">
                {parentName}
              </span>
            </div>
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface hover:text-danger"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Log Out</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
