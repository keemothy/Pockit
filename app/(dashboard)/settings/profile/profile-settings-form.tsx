"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ProfileSettingsFormProps = {
  email: string;
  metadata: Record<string, unknown>;
  avatarUrl: string | null;
};

const tabs = [
  { href: "/settings/profile", label: "Profile & account" },
  { href: "/settings/security", label: "Security" },
  { href: "/settings/appearance", label: "Appearance" },
  { href: "/settings/privacy", label: "Privacy & data" },
];

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

export default function ProfileSettingsForm({
  email,
  metadata,
  avatarUrl: initialAvatarUrl,
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const photoInput = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState(stringValue(metadata.first_name));
  const [lastName, setLastName] = useState(stringValue(metadata.last_name));
  const [emailAddress, setEmailAddress] = useState(email);
  const [currency, setCurrency] = useState(
    stringValue(metadata.currency) || "USD",
  );
  const [language, setLanguage] = useState(
    stringValue(metadata.language) || "en-US",
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const displayName = `${firstName} ${lastName}`.trim() || "Your account";
  const initials = useMemo(
    () => (firstName[0] ?? "").concat(lastName[0] ?? "").toUpperCase() || "P",
    [firstName, lastName],
  );

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsSaving(true);

    const supabase = createClient();
    let avatarPath = stringValue(metadata.avatar_path) || null;

    if (avatarFile) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsSaving(false);
        setStatus("Your session has expired. Please sign in again.");
        return;
      }

      const extension =
        avatarFile.type === "image/png"
          ? "png"
          : avatarFile.type === "image/webp"
            ? "webp"
            : "jpg";
      const nextAvatarPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(nextAvatarPath, avatarFile, {
          cacheControl: "3600",
          contentType: avatarFile.type,
        });

      if (uploadError) {
        setIsSaving(false);
        setStatus(uploadError.message);
        return;
      }

      avatarPath = nextAvatarPath;
    }

    const { error } = await supabase.auth.updateUser({
      email: emailAddress.trim(),
      data: {
        ...metadata,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName} ${lastName}`.trim(),
        currency,
        language,
        avatar_path: avatarPath,
      },
    });

    setIsSaving(false);
    if (error) {
      setStatus(error.message);
      return;
    }

    const previousAvatarPath = stringValue(metadata.avatar_path);
    if (avatarFile && previousAvatarPath && previousAvatarPath !== avatarPath) {
      await supabase.storage.from("avatars").remove([previousAvatarPath]);
    }

    setStatus(
      emailAddress.trim() !== email
        ? "Settings saved. Check your inbox to confirm your new email address."
        : "Your settings have been saved.",
    );
    router.refresh();
  }

  function chooseAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setStatus("Choose a JPG or PNG image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setStatus("Choose an image smaller than 2 MB.");
      return;
    }

    setStatus(null);
    setAvatarFile(file);
    setAvatarUrl(URL.createObjectURL(file));
  }

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        Profile &amp; account
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Update any personal information and account preferences.
      </p>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => {
          const active = tab.href === "/settings/profile";
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                active
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <form className="mt-7" onSubmit={saveSettings}>
        <div className="flex items-center gap-4">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-100 bg-cover bg-center text-2xl font-semibold text-blue-600"
            style={
              avatarUrl ? { backgroundImage: `url("${avatarUrl}")` } : undefined
            }
            role="img"
          >
            {!avatarUrl && initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-slate-900">
              {displayName}
            </p>
            <p className="truncate text-sm text-slate-500">
              {emailAddress || ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => photoInput.current?.click()}
            className="ml-auto cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Change photo
          </button>
          <input
            ref={photoInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={chooseAvatar}
          />
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            First name
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Last name
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              autoComplete="family-name"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Email address
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              type="email"
              value={emailAddress}
              onChange={(event) => setEmailAddress(event.target.value)}
              autoComplete="email"
              required
            />
          </label>
        </div>

        <fieldset className="mt-8 border-t border-slate-200 pt-7">
          <legend className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Other Preferences
          </legend>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Default currency
              <select
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              >
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="CAD">CAD — Canadian Dollar</option>
                <option value="JPY"> YEN — Japanese Yen</option>
                <option value="CNY"> CNY/RMB — Chinese Yuan</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Language
              <select
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
              >
                <option value="en-US">English (United States)</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="cn"> Chinese (Simplified) </option>
                <option value="kr"> Korean </option>
              </select>
            </label>
          </div>
        </fieldset>

        <div className="mt-8 flex flex-col-reverse gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p role="status" className="text-sm text-slate-500">
            {status ?? "Changes are saved securely to your Pockit account."}
          </p>
          <button
            type="submit"
            disabled={isSaving}
            className="cursor-pointer rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
