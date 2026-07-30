"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Bell, Lock, Landmark, Trash2, ChevronRight } from "lucide-react";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } },
};

type ToggleState = {
  spending: boolean;
  rewards: boolean;
  tips: boolean;
  marketing: boolean;
};

export default function SettingsPage() {
  const [toggles, setToggles] = useState<ToggleState>({
    spending: true,
    rewards: true,
    tips: false,
    marketing: false,
  });

  function toggle(key: keyof ToggleState) {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold text-zinc-900">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage your account and preferences.</p>
      </motion.div>

      {/* Profile */}
      <motion.div variants={item} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-zinc-900">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1F78FF] text-xl font-bold text-white">
            P
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500">Full name</label>
              <input
                type="text"
                defaultValue=""
                placeholder="Your name"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-[#1F78FF] focus:ring-2 focus:ring-[#1F78FF]/15"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500">Email</label>
              <input
                type="email"
                defaultValue=""
                placeholder="you@example.com"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-[#1F78FF] focus:ring-2 focus:ring-[#1F78FF]/15"
              />
            </div>
          </div>
        </div>
        <button className="mt-4 rounded-xl bg-[#1F78FF] px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
          Save changes
        </button>
      </motion.div>

      {/* Notifications */}
      <motion.div variants={item} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Bell size={16} className="text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-900">Notifications</h2>
        </div>
        <div className="space-y-4">
          {(
            [
              { key: "spending" as const, label: "Spending alerts", desc: "Get notified when you hit category limits" },
              { key: "rewards" as const, label: "Rewards updates", desc: "Weekly summary of points earned" },
              { key: "tips" as const, label: "Money-saving tips", desc: "Personalized suggestions from Pockit AI" },
              { key: "marketing" as const, label: "Product updates", desc: "New features and announcements" },
            ]
          ).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-zinc-800">{label}</p>
                <p className="text-xs text-zinc-400">{desc}</p>
              </div>
              <button
                type="button"
                onClick={() => toggle(key)}
                aria-pressed={toggles[key]}
                className="relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200"
                style={{ backgroundColor: toggles[key] ? "#1F78FF" : "#e5e7eb" }}
              >
                <span
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                  style={{ transform: toggles[key] ? "translateX(21px)" : "translateX(2px)" }}
                />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Security */}
      <motion.div variants={item} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Lock size={16} className="text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-900">Privacy & Security</h2>
        </div>
        <div className="space-y-1">
          {["Change password", "Two-factor authentication", "Download my data"].map((item) => (
            <button
              key={item}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm text-zinc-700 transition hover:bg-gray-50"
            >
              {item}
              <ChevronRight size={16} className="text-zinc-300" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Connected accounts */}
      <motion.div variants={item} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Landmark size={16} className="text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-900">Connected Accounts</h2>
        </div>
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
          <p className="text-sm text-zinc-500">No bank accounts connected yet.</p>
          <a
            href="/auth/connect-bank"
            className="mt-2 inline-block text-sm font-medium text-[#1F78FF] hover:underline"
          >
            Connect a bank →
          </a>
        </div>
      </motion.div>

      {/* Danger zone */}
      <motion.div variants={item} className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Trash2 size={16} className="text-red-400" />
          <h2 className="text-sm font-semibold text-red-600">Danger Zone</h2>
        </div>
        <p className="mb-4 text-sm text-zinc-500">
          Deleting your account is permanent and cannot be undone. All your data will be removed.
        </p>
        <button className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50">
          Delete account
        </button>
      </motion.div>
    </motion.div>
  );
}
