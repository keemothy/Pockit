"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } },
};

const periods = ["This Week", "This Month", "This Year"] as const;
type Period = (typeof periods)[number];

const spendingData: Record<Period, { label: string; amount: number }[]> = {
  "This Week": [
    { label: "Mon", amount: 42 },
    { label: "Tue", amount: 118 },
    { label: "Wed", amount: 76 },
    { label: "Thu", amount: 205 },
    { label: "Fri", amount: 340 },
    { label: "Sat", amount: 190 },
    { label: "Sun", amount: 88 },
  ],
  "This Month": [
    { label: "Wk 1", amount: 380 },
    { label: "Wk 2", amount: 520 },
    { label: "Wk 3", amount: 290 },
    { label: "Wk 4", amount: 610 },
  ],
  "This Year": [
    { label: "Jan", amount: 1120 },
    { label: "Feb", amount: 1480 },
    { label: "Mar", amount: 890 },
    { label: "Apr", amount: 1650 },
    { label: "May", amount: 1290 },
    { label: "Jun", amount: 1840 },
    { label: "Jul", amount: 1540 },
  ],
};

const categories = [
  { label: "Dining", amount: 420, color: "#FF6B6B", percent: 23 },
  { label: "Shopping", amount: 380, color: "#4ECDC4", percent: 21 },
  { label: "Travel", amount: 290, color: "#45B7D1", percent: 16 },
  { label: "Entertainment", amount: 210, color: "#96CEB4", percent: 11 },
  { label: "Groceries", amount: 180, color: "#FBBF24", percent: 10 },
  { label: "Other", amount: 350, color: "#CBD5E1", percent: 19 },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("This Month");
  const bars = spendingData[period];
  const maxAmount = Math.max(...bars.map((b) => b.amount));
  const total = bars.reduce((s, b) => s + b.amount, 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Analytics</h1>
          <p className="mt-1 text-sm text-zinc-500">Your spending patterns at a glance.</p>
        </div>
        <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                period === p
                  ? "bg-[#1F78FF] text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Chart card */}
      <motion.div
        variants={item}
        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Total spend
            </p>
            <p className="mt-1 text-3xl font-bold text-zinc-900">
              ${total.toLocaleString()}
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
            Sample data
          </span>
        </div>

        {/* Bar chart */}
        <div className="mt-8 flex items-end justify-between gap-2">
          {bars.map((bar, i) => (
            <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
              <motion.div
                className="w-full rounded-t-lg"
                style={{ background: "linear-gradient(180deg, #1F78FF, #57BEFE)" }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max((bar.amount / maxAmount) * 160, 4)}px` }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.5, ease: "easeOut" }}
              />
              <span className="text-[10px] text-zinc-400">{bar.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Category breakdown */}
      <motion.div variants={item}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          By category
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.06, duration: 0.35 }}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-medium text-zinc-700">{cat.label}</span>
                </div>
                <span className="text-xs font-semibold text-zinc-400">{cat.percent}%</span>
              </div>
              <p className="mt-2 text-xl font-bold text-zinc-900">${cat.amount}</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: cat.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${cat.percent}%` }}
                  transition={{ delay: 0.4 + i * 0.06, duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
