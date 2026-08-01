"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const tabs = [
  { href: "/settings/profile", label: "Profile & account" },
  { href: "/settings/security", label: "Security" },
  { href: "/settings/appearance", label: "Appearance" },
  { href: "/settings/privacy", label: "Privacy & data" },
];

type Theme = "light" | "dark";

export default function AppearanceSettings() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("pockit-theme");
    if (savedTheme !== "dark") return;
    const timer = window.setTimeout(() => setTheme("dark"), 0);
    return () => window.clearTimeout(timer);
  }, []);

  // changing window browswer cache to change theme depending on user preference

  function chooseTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    window.localStorage.setItem("pockit-theme", nextTheme);
  }

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        Appearance
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Customize how Pockit looks and feels.
      </p>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => {
          const active = tab.href === "/settings/appearance";
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
          Theme
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <ThemeChoice
            theme="light"
            selected={theme === "light"}
            onSelect={chooseTheme}
          />
          <ThemeChoice
            theme="dark"
            selected={theme === "dark"}
            onSelect={chooseTheme}
          />
        </div>
      </section>
    </div>
  );
}

function ThemeChoice({
  theme,
  selected,
  onSelect,
}: {
  theme: Theme;
  selected: boolean;
  onSelect: (theme: Theme) => void;
}) {
  const dark = theme === "dark";
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(theme)}
      className={`cursor-pointer rounded-2xl border-2 p-4 text-left transition ${selected ? "border-blue-600" : "border-slate-200 hover:border-slate-300"}`}
    >
      <div
        className={`h-28 rounded-xl border ${dark ? "border-slate-700 bg-slate-900" : "border-blue-100 bg-blue-50"}`}
      >
        <div
          className={`m-4 h-3 w-20 rounded ${dark ? "bg-slate-600" : "bg-blue-200"}`}
        />
        <div
          className={`mx-4 h-2 w-32 rounded ${dark ? "bg-slate-700" : "bg-blue-100"}`}
        />
      </div>
      <p className="mt-4 text-lg font-semibold text-slate-900">
        {dark ? "Dark" : "Light"}
      </p>
      <p
        className={`mt-1 text-sm ${selected ? "text-blue-600" : "text-slate-500"}`}
      >
        {selected ? "Selected" : `Use ${theme} theme`}
      </p>
    </button>
  );
}
