"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Sparkles,
  LayoutDashboard,
  Upload,
  Users,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  LogIn,
  Moon,
  Sun,
} from "lucide-react";

const publicLinks = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/upload", icon: Upload, label: "Upload Materials" },
];

const authedLinks = [
  { href: "/dashboard/students", icon: Users, label: "Students" },
  { href: "/dashboard/sessions", icon: Calendar, label: "Sessions" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  // Clear search when navigating away from dashboard
  useEffect(() => {
    if (pathname !== "/dashboard") setSearchQuery("");
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/dashboard?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/dashboard");
    }
  };

  // Initialize dark mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("ezstudy-dark-mode");
    if (saved === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ezstudy-dark-mode", String(next));
  };

  const sidebarLinks = isLoggedIn
    ? [...publicLinks, ...authedLinks]
    : publicLinks;

  return (
    <div className="flex h-screen bg-surface">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-primary-light/20 bg-white transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-primary-light/10 px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-primary-dark">
              EzStudy
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {sidebarLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-md"
                    : "text-text-secondary hover:bg-surface hover:text-primary-dark"
                }`}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-primary-light/10 p-4">
          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard/settings"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  pathname === "/dashboard/settings"
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-md"
                    : "text-text-secondary hover:bg-surface hover:text-primary-dark"
                }`}
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-danger transition-all hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" />
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-text-secondary transition-all hover:bg-surface hover:text-primary-dark"
              >
                <LogIn className="h-5 w-5" />
                Log In
              </Link>
              <Link
                href="/signup"
                onClick={() => setSidebarOpen(false)}
                className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
              >
                <Sparkles className="h-4 w-4" />
                Sign Up
              </Link>
            </>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-primary-light/10 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-surface hover:text-primary-dark lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
            </Link>
            <form onSubmit={handleSearch} className="hidden items-center gap-2 rounded-xl border border-primary-light/20 bg-surface px-4 py-2 sm:flex">
              <Search className="h-4 w-4 text-text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search study sets..."
                className="w-64 bg-transparent text-sm text-primary-dark outline-none placeholder:text-text-secondary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); router.push("/dashboard"); }}
                  className="text-text-secondary hover:text-primary-dark"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="rounded-xl p-2 text-text-secondary transition-colors hover:bg-surface hover:text-primary-dark"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            {isLoggedIn ? (
              <>
                <button className="relative rounded-xl p-2 text-text-secondary transition-colors hover:bg-surface hover:text-primary-dark">
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
                </button>
                <button className="flex items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-surface">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
                    {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <span className="hidden text-sm font-medium text-primary-dark sm:block">
                    {session?.user?.name || "User"}
                  </span>
                  <ChevronDown className="hidden h-4 w-4 text-text-secondary sm:block" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-xl px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface hover:text-primary-dark"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
