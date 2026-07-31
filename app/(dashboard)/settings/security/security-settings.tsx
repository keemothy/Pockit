"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const tabs = [
  { href: "/settings/profile", label: "Profile & account" },
  { href: "/settings/security", label: "Security" },
  { href: "/settings/appearance", label: "Appearance" },
  { href: "/settings/privacy", label: "Privacy & data" },
];

export default function SecuritySettings({
  email,
  initialFactorId,
}: {
  email: string;
  initialFactorId: string | null;
}) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(initialFactorId);
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(
    Boolean(initialFactorId),
  );
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [twoFactorStatus, setTwoFactorStatus] = useState<string | null>(null);
  const [isUpdatingTwoFactor, setIsUpdatingTwoFactor] = useState(false);

  // PW changer; also apply restriction of at least 8 chars
  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 8) {
      setPasswordStatus("Your new password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus("New passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (signInError) {
      setIsChangingPassword(false);
      setPasswordStatus("Your current password is incorrect.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setIsChangingPassword(false);
    if (updateError) {
      setPasswordStatus(updateError.message);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordForm(false);
    setPasswordStatus("Your password has been updated.");
  }

  // 2FA enrollment process; users MUST use an external app for registration
  async function beginTwoFactorEnrollment() {
    setTwoFactorStatus(null);
    setIsUpdatingTwoFactor(true);
    const resetResponse = await fetch("/api/auth/mfa/reset-enrollment", {
      method: "POST",
    });
    const resetResult = (await resetResponse.json().catch(() => null)) as {
      error?: string;
    } | null;
    if (!resetResponse.ok) {
      setIsUpdatingTwoFactor(false);
      setTwoFactorStatus(
        resetResult?.error ??
          "Unable to reset the incomplete two-factor setup.",
      );
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Pockit authenticator",
    });
    setIsUpdatingTwoFactor(false);
    if (error) {
      setTwoFactorStatus(error.message);
      return;
    }

    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
  }

  async function cancelTwoFactorEnrollment() {
    setIsUpdatingTwoFactor(true);
    const response = await fetch("/api/auth/mfa/reset-enrollment", {
      method: "POST",
    });
    const result = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    setIsUpdatingTwoFactor(false);
    if (!response.ok) {
      setTwoFactorStatus(
        result?.error ?? "Unable to cancel the incomplete two-factor setup.",
      );
      return;
    }

    setFactorId(null);
    setQrCode(null);
    setSecret(null);
    setVerificationCode("");
    setTwoFactorStatus("Two-factor setup was cancelled.");
  }

  async function verifyTwoFactor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!factorId) return;

    setTwoFactorStatus(null);
    setIsUpdatingTwoFactor(true);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: verificationCode.trim(),
    });
    setIsUpdatingTwoFactor(false);
    if (error) {
      setTwoFactorStatus(error.message);
      return;
    }

    setIsTwoFactorEnabled(true);
    setQrCode(null);
    setSecret(null);
    setVerificationCode("");
    setTwoFactorStatus("Two-factor authentication is enabled.");
  }

  // users may also disable the 2FA if they want; ideally have this off for dev purposes
  async function disableTwoFactor() {
    if (!factorId) return;

    setTwoFactorStatus(null);
    setIsUpdatingTwoFactor(true);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setIsUpdatingTwoFactor(false);
    if (error) {
      setTwoFactorStatus(error.message);
      return;
    }

    setFactorId(null);
    setIsTwoFactorEnabled(false);
    setTwoFactorStatus("Two-factor authentication is disabled.");
  }

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        Security
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Protect your account and manage authentication.
      </p>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => {
          const active = tab.href === "/settings/security";
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${active ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <section className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Sign-in &amp; authentication
        </p>
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Password</h3>
              <p className="mt-1 text-sm text-slate-500">
                Use a strong, unique password to keep your account secure.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowPasswordForm((value) => !value);
                setPasswordStatus(null);
              }}
              className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {showPasswordForm ? "Cancel" : "Change password"}
            </button>
          </div>

          {showPasswordForm && (
            <form
              onSubmit={changePassword}
              className="border-t border-slate-200 p-5"
            >
              <div className="grid gap-4 md:grid-cols-3">
                <PasswordInput
                  label="Current password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  autoComplete="current-password"
                />
                <PasswordInput
                  label="New password"
                  value={newPassword}
                  onChange={setNewPassword}
                  autoComplete="new-password"
                />
                <PasswordInput
                  label="Retype new password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  autoComplete="new-password"
                />
              </div>
              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p role="status" className="text-sm text-slate-500">
                  {passwordStatus}
                </p>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isChangingPassword ? "Updating…" : "Update password"}
                </button>
              </div>
            </form>
          )}

          <div className="border-t border-slate-200 p-5">
            <div className="flex items-center justify-between gap-5">
              <div>
                <h3 className="font-semibold text-slate-900">
                  Two-factor authentication
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add an extra layer of security with an authenticator app.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                disabled={isUpdatingTwoFactor}
                onClick={() =>
                  void (isTwoFactorEnabled
                    ? disableTwoFactor()
                    : beginTwoFactorEnrollment())
                }
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isTwoFactorEnabled ? "bg-blue-600" : "bg-slate-300"}`}
              >
                <span
                  className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${isTwoFactorEnabled ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            </div>

            {qrCode && factorId && (
              <form
                onSubmit={verifyTwoFactor}
                className="mt-5 rounded-xl bg-slate-50 p-5"
              >
                <p className="text-sm font-medium text-slate-800">
                  Scan this code with your authenticator app, then enter its
                  six-digit code.
                </p>
                <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
                  <img
                    src={
                      qrCode.startsWith("data:")
                        ? qrCode
                        : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrCode)}`
                    }
                    alt="Authenticator app QR code"
                    className="h-36 w-36 shrink-0 rounded-lg bg-white"
                  />
                  <label className="block flex-1 text-sm font-medium text-slate-700">
                    Verification code
                    <input
                      value={verificationCode}
                      onChange={(event) =>
                        setVerificationCode(
                          event.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      required
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                </div>
                <p className="mt-4 break-all text-xs text-slate-500">
                  Scan the QR Code abvoe or enter this key manually:{" "}
                  <span className="font-mono text-slate-700">{secret}</span>
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={isUpdatingTwoFactor}
                    className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isUpdatingTwoFactor
                      ? "Verifying…"
                      : "Enable two-factor authentication"}
                  </button>
                  <button
                    type="button"
                    disabled={isUpdatingTwoFactor}
                    onClick={() => void cancelTwoFactorEnrollment()}
                    className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel setup
                  </button>
                </div>
              </form>
            )}

            <p role="status" className="mt-4 text-sm text-slate-500">
              {twoFactorStatus ??
                (isTwoFactorEnabled
                  ? "Two-factor authentication is enabled."
                  : "Two-factor authentication is off.")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required
        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}
