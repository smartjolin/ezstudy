"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Palette,
  User,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";

const presetColors = [
  { name: "Purple", value: "#7c3aed" },
  { name: "Blue", value: "#2563eb" },
  { name: "Green", value: "#16a34a" },
  { name: "Teal", value: "#0d9488" },
  { name: "Rose", value: "#e11d48" },
  { name: "Orange", value: "#ea580c" },
];

export default function SettingsPage() {
  const { data: session } = useSession();

  // Branding state
  const [businessName, setBusinessName] = useState("");
  const [brandColor, setBrandColor] = useState("#7c3aed");
  const [logoUrl, setLogoUrl] = useState("");
  const [customHex, setCustomHex] = useState("");

  // Account state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Load existing branding on mount
  useEffect(() => {
    const loadBranding = async () => {
      try {
        const res = await fetch("/api/branding");
        if (res.ok) {
          const data = await res.json();
          if (data.businessName) setBusinessName(data.businessName);
          if (data.brandColor) {
            setBrandColor(data.brandColor);
            if (!presetColors.some((c) => c.value === data.brandColor)) {
              setCustomHex(data.brandColor);
            }
          }
          if (data.logoUrl) setLogoUrl(data.logoUrl);
        }
      } catch {
        // Silently fail if branding not available
      }
    };
    loadBranding();
  }, []);

  useEffect(() => {
    if (session?.user) {
      if (session.user.name) setName(session.user.name);
      if (session.user.email) setEmail(session.user.email);
    }
  }, [session]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSelectPreset = (color: string) => {
    setBrandColor(color);
    setCustomHex("");
  };

  const handleCustomHexChange = (value: string) => {
    setCustomHex(value);
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      setBrandColor(value);
    }
  };

  const handleSave = async () => {
    // Validate password change if attempted
    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        setToast({ type: "error", message: "Please enter your current password." });
        return;
      }
      if (newPassword.length < 6) {
        setToast({ type: "error", message: "New password must be at least 6 characters." });
        return;
      }
      if (newPassword !== confirmPassword) {
        setToast({ type: "error", message: "New passwords do not match." });
        return;
      }
    }

    setSaving(true);
    try {
      // Save branding
      const res = await fetch("/api/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim() || undefined,
          brandColor,
          logoUrl: logoUrl.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save settings");
      }

      // Clear password fields on success
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setToast({ type: "success", message: "Settings saved successfully!" });
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setSaving(false);
    }
  };

  const isPresetSelected = presetColors.some((c) => c.value === brandColor);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed right-6 top-20 z-50 flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-lg transition-all ${
            toast.type === "success"
              ? "border-success/20 bg-success/5 text-success"
              : "border-danger/20 bg-danger/5 text-danger"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-primary-dark">Settings</h1>
        <p className="mt-1 text-text-secondary">
          Manage your branding and account preferences.
        </p>
      </div>

      {/* Branding Section */}
      <div className="mb-8 rounded-2xl border border-primary-light/20 bg-white p-6">
        <div className="mb-6 flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-primary-dark">Branding</h2>
        </div>

        <div className="space-y-6">
          {/* Business Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-primary-dark">
              Business Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your tutoring business name"
              className="w-full rounded-xl border border-primary-light/20 bg-surface px-4 py-3 text-sm text-primary-dark outline-none transition-all placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Brand Color */}
          <div>
            <label className="mb-2 block text-sm font-medium text-primary-dark">
              Brand Color
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {presetColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleSelectPreset(color.value)}
                  title={color.name}
                  className={`h-10 w-10 rounded-full border-2 transition-all ${
                    brandColor === color.value && isPresetSelected
                      ? "scale-110 border-primary-dark shadow-md"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.value }}
                />
              ))}
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">Custom:</span>
                <input
                  type="text"
                  value={customHex}
                  onChange={(e) => handleCustomHexChange(e.target.value)}
                  placeholder="#hex"
                  className="w-24 rounded-lg border border-primary-light/20 bg-surface px-3 py-2 text-sm text-primary-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label className="mb-2 block text-sm font-medium text-primary-dark">
              Logo URL
            </label>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary-light/20 bg-surface">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="h-10 w-10 rounded-lg object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <ImageIcon className="h-5 w-5 text-text-secondary" />
                )}
              </div>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="flex-1 rounded-xl border border-primary-light/20 bg-surface px-4 py-3 text-sm text-primary-dark outline-none transition-all placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Branding Preview */}
          <div>
            <label className="mb-2 block text-sm font-medium text-primary-dark">
              Preview
            </label>
            <div
              className="overflow-hidden rounded-2xl border border-primary-light/20"
              style={{ borderColor: `${brandColor}33` }}
            >
              <div
                className="flex items-center gap-3 px-5 py-4"
                style={{ backgroundColor: brandColor }}
              >
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-8 w-8 rounded-lg object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                )}
                <span className="text-lg font-bold text-white">
                  {businessName || "Your Business"}
                </span>
              </div>
              <div className="bg-white px-5 py-4">
                <p className="text-sm text-text-secondary">
                  This is how your branding will appear to students when they
                  access your study materials and AI tutor.
                </p>
                <div className="mt-3 flex gap-2">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium text-white"
                    style={{ backgroundColor: brandColor }}
                  >
                    Flashcards
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: `${brandColor}15`,
                      color: brandColor,
                    }}
                  >
                    Quiz
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: `${brandColor}15`,
                      color: brandColor,
                    }}
                  >
                    AI Tutor
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div className="mb-8 rounded-2xl border border-primary-light/20 bg-white p-6">
        <div className="mb-6 flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-primary-dark">Account</h2>
        </div>

        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-primary-dark">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-primary-light/20 bg-surface px-4 py-3 text-sm text-primary-dark outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-primary-dark">
              Email
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full cursor-not-allowed rounded-xl border border-primary-light/20 bg-surface/50 px-4 py-3 text-sm text-text-secondary outline-none"
            />
            <p className="mt-1 text-xs text-text-secondary">
              Email cannot be changed.
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="mb-8 rounded-2xl border border-primary-light/20 bg-white p-6">
        <div className="mb-6 flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-primary-dark">
            Change Password
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-primary-dark">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full rounded-xl border border-primary-light/20 bg-surface px-4 py-3 text-sm text-primary-dark outline-none transition-all placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-primary-dark">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full rounded-xl border border-primary-light/20 bg-surface px-4 py-3 text-sm text-primary-dark outline-none transition-all placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-primary-dark">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-xl border border-primary-light/20 bg-surface px-4 py-3 text-sm text-primary-dark outline-none transition-all placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="mt-1 text-xs text-danger">
                Passwords do not match.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent py-4 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110 disabled:opacity-50"
      >
        {saving ? (
          <>
            <svg
              className="h-5 w-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Saving...
          </>
        ) : (
          <>
            <Save className="h-5 w-5" />
            Save Settings
          </>
        )}
      </button>
    </div>
  );
}
