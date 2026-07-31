"use client";

import { motion, type Variants } from "framer-motion";
import { BarChart3, Landmark, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { CategorySpend } from "@/lib/plaid-analytics";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  },
};

interface AnalyticsContentProps {
  categories: CategorySpend[];
  hasConnectedBank: boolean;
  cardCount: number;
  periodLabel: string;
}

/* ── empty state ─────────────────────────────────────────── */
function EmptyState() {
  return (
    <motion.div
      variants={item}
      className="flex flex-col items-center gap-4 rounded-2xl bg-white px-8 py-16 text-center"
      style={{
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)",
      }}
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: "linear-gradient(135deg, #f0f5ff, #e0ebff)" }}
      >
        <BarChart3 size={28} className="text-blue-500" />
      </div>
      <div>
        <h2 className="text-[17px] font-bold text-slate-900">
          No spending data yet
        </h2>
        <p className="mt-1 max-w-sm text-sm text-slate-400">
          Connect a bank account and your real spending breakdown will appear
          here automatically.
        </p>
      </div>
      <Link
        href="/wallet"
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-95"
      >
        <Landmark size={15} />
        Connect bank
        <ArrowRight size={13} />
      </Link>
    </motion.div>
  );
}

/* ── bar chart ───────────────────────────────────────────── */
function BarChart({ categories }: { categories: CategorySpend[] }) {
  const maxAmount = Math.max(...categories.map((c) => c.amount), 1);

  return (
    <div className="flex items-end justify-between gap-2 pt-2">
      {categories.slice(0, 7).map((cat, i) => (
        <div
          key={cat.label}
          className="group flex flex-1 flex-col items-center gap-2"
        >
          <div className="relative w-full" style={{ height: 160 }}>
            <motion.div
              className="absolute bottom-0 left-0 right-0 rounded-t-lg"
              style={{
                background: `linear-gradient(180deg, ${cat.color}, ${cat.color}88)`,
              }}
              initial={{ height: 0 }}
              animate={{
                height: `${Math.max((cat.amount / maxAmount) * 160, 4)}px`,
              }}
              transition={{
                delay: 0.1 + i * 0.055,
                duration: 0.52,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
            {/* Amount tooltip on hover */}
            <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow transition-opacity group-hover:opacity-100">
              ${cat.amount.toFixed(0)}
            </div>
          </div>
          <span className="text-[10px] text-slate-400">
            {cat.label.split(" ")[0]}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── main component ──────────────────────────────────────── */
export default function AnalyticsContent({
  categories,
  hasConnectedBank,
  periodLabel,
}: AnalyticsContentProps) {
  const total = categories.reduce((s, c) => s + c.amount, 0);
  const hasData = categories.length > 0;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item}>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Analytics
        </p>
        <h1 className="mt-0.5 text-[28px] font-black tracking-tight text-slate-900">
          Spending insights
        </h1>
      </motion.div>

      {!hasConnectedBank || !hasData ? (
        <EmptyState />
      ) : (
        <>
          {/* Summary card with bar chart */}
          <motion.div
            variants={item}
            className="rounded-2xl bg-white p-6"
            style={{
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)",
            }}
          >
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                  Total spend
                </p>
                <p
                  className="mt-1 font-mono text-3xl font-black text-slate-900"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  $
                  {total.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                {periodLabel}
              </span>
            </div>
            <BarChart categories={categories} />
          </motion.div>

          {/* Category breakdown */}
          <motion.div variants={item}>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              By category
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32 + i * 0.055, duration: 0.36 }}
                  className="rounded-2xl bg-white p-4"
                  style={{
                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {cat.label}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">
                      {cat.percent}%
                    </span>
                  </div>
                  <p
                    className="mt-2 font-mono text-xl font-black text-slate-900"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    ${cat.amount.toFixed(0)}
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: cat.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.percent}%` }}
                      transition={{
                        delay: 0.38 + i * 0.055,
                        duration: 0.52,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
