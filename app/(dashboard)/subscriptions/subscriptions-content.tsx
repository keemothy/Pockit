"use client";

import { motion, type Variants } from "framer-motion";
import { CreditCard, Landmark, MessageCircle, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import type { SubscriptionCandidate } from "@/lib/plaid-analytics";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
};

interface SubscriptionsContentProps {
  subscriptions: SubscriptionCandidate[];
  hasConnectedBank: boolean;
  monthlyTotal: number;
}

/* ── no-bank empty state ─────────────────────────────────── */
function NoBank() {
  return (
    <motion.div
      variants={item}
      className="flex flex-col items-center gap-4 rounded-2xl bg-white px-8 py-16 text-center"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)" }}
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: "linear-gradient(135deg, #fffbeb, #fef3c7)" }}
      >
        <Landmark size={28} className="text-amber-500" />
      </div>
      <div>
        <h2 className="text-[17px] font-bold text-slate-900">Connect your bank to get started</h2>
        <p className="mt-1 max-w-sm text-sm text-slate-400">
          Pockit scans your transactions to automatically detect recurring charges — no manual entry needed.
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

/* ── no-subs-detected empty state ────────────────────────── */
function NoSubs() {
  return (
    <motion.div
      variants={item}
      className="flex flex-col items-center gap-3 rounded-2xl bg-white px-8 py-14 text-center"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)" }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}
      >
        <CreditCard size={24} className="text-emerald-500" />
      </div>
      <div>
        <h2 className="text-[16px] font-bold text-slate-900">No recurring charges detected</h2>
        <p className="mt-1 max-w-sm text-sm text-slate-400">
          We scan the past 65 days. If you've recently connected your bank, check back after a full billing cycle.
        </p>
      </div>
      <Link
        href="/chatbot"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
      >
        <MessageCircle size={13} />
        Ask the AI about your bills
      </Link>
    </motion.div>
  );
}

/* ── category icon color ─────────────────────────────────── */
function categoryColor(category: string) {
  const up = category.toUpperCase();
  if (up.includes("MUSIC") || up.includes("AUDIO")) return "#1DB954";
  if (up.includes("VIDEO") || up.includes("STREAMING")) return "#E50914";
  if (up.includes("GAMING")) return "#7b29ff";
  if (up.includes("SOFTWARE") || up.includes("SUBSCRIPTION")) return "#0078d4";
  if (up.includes("PHONE") || up.includes("CABLE")) return "#ff7f50";
  return "#64748b";
}

function categoryLabel(detailed: string) {
  if (detailed.includes("MUSIC")) return "Music";
  if (detailed.includes("VIDEO") || detailed.includes("STREAMING")) return "Streaming";
  if (detailed.includes("GAMING")) return "Gaming";
  if (detailed.includes("SOFTWARE") || detailed.includes("SUBSCRIPTION")) return "Subscription";
  if (detailed.includes("PHONE")) return "Phone";
  if (detailed.includes("CABLE") || detailed.includes("UTILITIES")) return "Utilities";
  return detailed
    .toLowerCase()
    .replace(/_/g, " ")
    .split(" ")
    .at(-1)
    ?.replace(/\b\w/g, (l) => l.toUpperCase()) ?? "Service";
}

/* ── main component ──────────────────────────────────────── */
export default function SubscriptionsContent({
  subscriptions,
  hasConnectedBank,
  monthlyTotal,
}: SubscriptionsContentProps) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

      {/* Header */}
      <motion.div variants={item} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Subscriptions
          </p>
          <h1 className="mt-0.5 text-[28px] font-black tracking-tight text-slate-900">
            Recurring bills
          </h1>
        </div>
        {hasConnectedBank && subscriptions.length > 0 && (
          <Link
            href="/chatbot"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <MessageCircle size={13} className="text-blue-500" />
            Help canceling one?
          </Link>
        )}
      </motion.div>

      {/* Content */}
      {!hasConnectedBank ? (
        <NoBank />
      ) : subscriptions.length === 0 ? (
        <NoSubs />
      ) : (
        <>
          {/* Monthly total card */}
          <div className="grid gap-4 sm:grid-cols-2">
            <motion.div
              variants={item}
              className="rounded-2xl bg-white p-5"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)" }}
            >
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                Est. monthly total
              </p>
              <p className="mt-2 font-mono text-3xl font-black text-slate-900" style={{ fontVariantNumeric: "tabular-nums" }}>
                ${monthlyTotal.toFixed(2)}
                <span className="ml-1 text-base font-normal text-slate-400">/mo</span>
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <RefreshCw size={11} />
                Detected from last 65 days of transactions
              </p>
            </motion.div>

            <motion.div
              variants={item}
              className="flex items-center gap-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-5 transition hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                <Landmark size={20} className="text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">Manage bank connections</p>
                <p className="text-sm text-slate-500">Add or remove accounts in Wallet</p>
              </div>
              <Link href="/wallet" className="ml-auto shrink-0">
                <ArrowRight size={16} className="text-blue-400" />
              </Link>
            </motion.div>
          </div>

          {/* Subscription list */}
          <motion.div variants={item}>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Detected subscriptions
            </p>

            <div className="space-y-2.5">
              {subscriptions.map((sub, i) => {
                const color = categoryColor(sub.detailedCategory);
                const label = categoryLabel(sub.detailedCategory);
                return (
                  <motion.div
                    key={`${sub.name}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.22 + i * 0.06, duration: 0.34 }}
                    className="flex items-center gap-4 rounded-2xl bg-white p-4 transition-all hover:shadow-md"
                    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)" }}
                  >
                    {/* Icon */}
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
                      style={{ backgroundColor: color }}
                    >
                      {sub.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name + category */}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{sub.name}</p>
                      <p className="text-sm text-slate-400">
                        {label} · last charged {new Date(sub.lastCharged + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p className="font-mono font-bold text-slate-900" style={{ fontVariantNumeric: "tabular-nums" }}>
                        ${sub.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-400">/mo</p>
                    </div>

                    {/* Ask AI */}
                    <Link
                      href={`/chatbot?q=Should I cancel ${encodeURIComponent(sub.name)}?`}
                      className="ml-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      Cancel?
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
