"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowDown, ArrowUp, ArrowRight, BarChart3, Bot,
  CreditCard, Landmark, Pencil, Plus, RefreshCcw,
  Shield, Sparkles, TrendingUp, Wallet, X,
} from "lucide-react";

export type WidgetId = "total-balance" | "monthly-spending" | "subscription-spending" | "category" | "trend" | "recent-transactions";
export type DashboardData = {
  totalBalance: number;
  monthlySpending: number;
  subscriptionSpending: number;
  categories: { label: string; amount: number }[];
  months: { key: string; label: string; amount: number }[];
  transactions: { id: string; name: string; amount: number; date: string; category: string }[];
  hasAccounts: boolean;
  hasTransactions: boolean;
  error: string | null;
  preferenceUnavailable: boolean;
};

const widgets: { id: WidgetId; title: string; description: string; essential?: boolean }[] = [
  { id: "total-balance", title: "Total Balance", description: "Balances across connected cards", essential: true },
  { id: "monthly-spending", title: "Monthly Spending", description: "Outgoing card transactions this month" },
  { id: "subscription-spending", title: "Subscription Spending", description: "Active subscription charges this month" },
  { id: "category", title: "Spending by Category", description: "Where this month's spending went" },
  { id: "trend", title: "Monthly Spending Trend", description: "Your last six months" },
  { id: "recent-transactions", title: "Recent Transactions", description: "Newest activity first" },
];

const defaultOrder = widgets.map((w) => w.id);
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const categoryColors = ["#1F78FF", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899", "#64748b"];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Good night";
}

function Sparkline({ color }: { color: string }) {
  return (
    <svg width="80" height="28" viewBox="0 0 80 28" fill="none"
      className="absolute bottom-5 right-5 opacity-[0.18]" aria-hidden>
      <polyline points="0,22 14,14 26,18 40,8 54,13 66,5 80,9"
        stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatCard({ icon: Icon, label, value, sub, accentClass, iconGrad, iconShadow, sparkColor }: {
  icon: React.ElementType; label: string; value: string; sub: string;
  accentClass: string; iconGrad: string; iconShadow: string; sparkColor: string;
}) {
  return (
    <motion.div
      variants={item}
      whileHover={{ y: -3, boxShadow: "0 8px 28px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)" }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden rounded-2xl bg-white ${accentClass}`}
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)" }}
    >
      <Sparkline color={sparkColor} />
      <div className="relative z-10 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: iconGrad, boxShadow: iconShadow }}>
          <Icon size={19} className="text-white" />
        </div>
        <p className="mt-5 font-mono text-[38px] font-black leading-none tracking-tight text-slate-900"
          style={{ fontVariantNumeric: "tabular-nums" }}>
          {value}
        </p>
        <p className="mt-2 text-[10.5px] font-semibold uppercase tracking-[0.13em] text-slate-400">{label}</p>
        <p className="mt-0.5 text-xs text-slate-400/70">{sub}</p>
      </div>
    </motion.div>
  );
}

function FeatureTile({ href, icon: Icon, label, desc, grad, glow, blobColor }: {
  href: string; icon: React.ElementType; label: string; desc: string;
  grad: string; glow: string; blobColor: string;
}) {
  return (
    <motion.div variants={item} whileTap={{ scale: 0.97 }}>
      <Link href={href}
        className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-white p-4 transition-all duration-200"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 8px rgba(0,0,0,0.06), 0 12px 28px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.04)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)"; }}
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: `radial-gradient(circle, ${blobColor} 0%, transparent 70%)` }} />
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-shadow duration-200"
          style={{ background: grad, boxShadow: glow }}>
          <Icon size={19} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800 transition-colors group-hover:text-slate-900">{label}</p>
          <p className="text-xs text-slate-400">{desc}</p>
        </div>
        <ArrowRight size={14} className="shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-blue-400" />
      </Link>
    </motion.div>
  );
}

export default function DashboardContent({ data, initialOrder, initialHidden }: {
  data: DashboardData; initialOrder: WidgetId[]; initialHidden: WidgetId[];
}) {
  const [order, setOrder] = useState(initialOrder);
  const [hidden, setHidden] = useState<WidgetId[]>(initialHidden.filter((id) => id !== "total-balance"));
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const greeting = useMemo(getGreeting, []);
  const monthName = useMemo(() => new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date()), []);
  const visible = order.filter((id) => !hidden.includes(id));
  const categoryTotal = data.categories.reduce((t, c) => t + c.amount, 0);
  const maxMonth = Math.max(...data.months.map((m) => m.amount), 1);

  const AI_PROMPTS = ["Best card for travel?", "Should I cancel Netflix?", "Maximize cashback →"];

  async function save(nextOrder = order, nextHidden = hidden) {
    setStatus("saving");
    try {
      const res = await fetch("/api/dashboard/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgetOrder: nextOrder, hiddenWidgets: nextHidden }),
      });
      if (!res.ok) throw new Error();
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1800);
    } catch { setStatus("error"); }
  }

  function move(id: WidgetId, direction: -1 | 1) {
    const idx = order.indexOf(id);
    const target = idx + direction;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrder(next);
    void save(next, hidden);
  }

  function toggle(id: WidgetId) {
    if (id === "total-balance") return;
    const next = hidden.includes(id) ? hidden.filter((x) => x !== id) : [...hidden, id];
    setHidden(next);
    void save(order, next);
  }

  function restore() {
    if (!window.confirm("Restore the default dashboard layout?")) return;
    setOrder(defaultOrder);
    setHidden([]);
    void save(defaultOrder, []);
  }

  if (data.error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="font-semibold text-rose-900">{data.error}</p>
        <button onClick={() => window.location.reload()}
          className="mt-3 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white">
          Retry
        </button>
      </div>
    );
  }

  if (!data.hasAccounts) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 px-6 text-center">
        <Landmark className="h-12 w-12 text-[#1F78FF]" />
        <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">Connect a credit card to get started</h1>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Your dashboard will show balances, spending, and subscriptions once an account is connected.
        </p>
        <Link href="/auth/connect-bank"
          className="mt-5 rounded-xl bg-[#1F78FF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
          Connect bank
        </Link>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">

      {/* Header */}
      <motion.div variants={item} className="flex items-end justify-between">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {monthName} overview
          </p>
          <h1 className="mt-0.5 text-[28px] font-black tracking-tight text-slate-900">
            {greeting} 👋
          </h1>
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-[#1F78FF] transition hover:bg-blue-50"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)" }}
        >
          <Pencil size={14} />
          {editing ? "Done" : "Edit layout"}
        </button>
      </motion.div>

      {data.preferenceUnavailable && (
        <motion.p variants={item} className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Dashboard changes can't be saved until the latest database migration is applied.
        </motion.p>
      )}

      {/* Edit panel */}
      {editing && (
        <motion.div variants={item}
          className="rounded-2xl bg-white p-5"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">Customize your dashboard</h2>
              <p className="text-sm text-slate-500">Show, hide, or reorder widgets. Changes save automatically.</p>
            </div>
            <button onClick={restore}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
              <RefreshCcw size={14} /> Restore default
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {order.map((id, idx) => {
              const widget = widgets.find((w) => w.id === id)!;
              const isHidden = hidden.includes(id);
              return (
                <div key={id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {widget.title}{widget.essential && <span className="ml-1.5 text-xs font-normal text-slate-400">(always shown)</span>}
                    </p>
                    <p className="text-xs text-slate-500">{widget.description}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button aria-label={`Move ${widget.title} up`} disabled={idx === 0} onClick={() => move(id, -1)}
                      className="rounded p-1.5 text-slate-600 transition hover:bg-slate-200 disabled:opacity-30">
                      <ArrowUp size={14} />
                    </button>
                    <button aria-label={`Move ${widget.title} down`} disabled={idx === order.length - 1} onClick={() => move(id, 1)}
                      className="rounded p-1.5 text-slate-600 transition hover:bg-slate-200 disabled:opacity-30">
                      <ArrowDown size={14} />
                    </button>
                    {!widget.essential && (
                      <button onClick={() => toggle(id)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                        {isHidden ? <><Plus className="mr-1 inline" size={12} />Add</> : <><X className="mr-1 inline" size={12} />Remove</>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {status !== "idle" && (
            <p className={`mt-3 text-xs ${status === "error" ? "text-rose-600" : "text-emerald-600"}`} aria-live="polite">
              {status === "saving" ? "Saving…" : status === "saved" ? "Layout saved" : "Couldn't save. Try again."}
            </p>
          )}
        </motion.div>
      )}

      {/* AI hero + quick tiles */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div variants={item} whileTap={{ scale: 0.99 }} className="col-span-1 lg:col-span-2">
          <Link href="/chatbot"
            className="group relative block overflow-hidden rounded-2xl p-7"
            style={{
              background: "linear-gradient(135deg, #0a1628 0%, #16104a 55%, #0a1628 100%)",
              boxShadow: "0 4px 24px rgba(10,22,40,0.25), 0 1px 3px rgba(0,0,0,0.2)",
            }}
          >
            <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full opacity-50"
              style={{ background: "radial-gradient(circle, rgba(168,85,247,0.55) 0%, transparent 70%)" }} />
            <div className="pointer-events-none absolute bottom-0 left-16 h-48 w-48 rounded-full opacity-35"
              style={{ background: "radial-gradient(circle, rgba(31,120,255,0.55) 0%, transparent 70%)" }} />
            <div className="pointer-events-none absolute right-24 top-8 h-28 w-28 rounded-full opacity-30"
              style={{ background: "radial-gradient(circle, rgba(236,72,153,0.45) 0%, transparent 70%)" }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: "linear-gradient(135deg, #1F78FF, #a855f7)" }}>
                  <Sparkles size={15} className="text-white" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-white/50">Pockit AI</span>
              </div>
              <h2 className="mt-4 text-2xl font-black leading-snug tracking-tight text-white">
                Smart money decisions,<br />
                <span className="animated-gradient-text">powered by AI.</span>
              </h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {AI_PROMPTS.map((q, i) => (
                  <span key={q}
                    className={`rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-xs text-white/65 backdrop-blur-sm pill-float-${i + 1}`}>
                    {q}
                  </span>
                ))}
              </div>
              <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/85 backdrop-blur-sm transition-all duration-200 group-hover:bg-white/[0.16]">
                Ask a question
                <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        </motion.div>

        <div className="flex flex-col gap-3">
          {[
            { href: "/wallet", icon: Wallet, label: "Wallet", desc: "Manage your cards", grad: "linear-gradient(135deg, #1F78FF, #57BEFE)", glow: "0 4px 14px rgba(31,120,255,0.3)", blobColor: "rgba(31,120,255,0.08)" },
            { href: "/analytics", icon: BarChart3, label: "Analytics", desc: "Spending breakdown", grad: "linear-gradient(135deg, #059669, #34d399)", glow: "0 4px 14px rgba(5,150,105,0.3)", blobColor: "rgba(5,150,105,0.08)" },
            { href: "/subscriptions", icon: Shield, label: "Subscriptions", desc: "Track recurring bills", grad: "linear-gradient(135deg, #f59e0b, #fcd34d)", glow: "0 4px 14px rgba(245,158,11,0.3)", blobColor: "rgba(245,158,11,0.08)" },
          ].map((t) => <FeatureTile key={t.href} {...t} />)}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {visible.includes("total-balance") && (
          <StatCard icon={CreditCard} label="Total Balance"
            value={data.hasTransactions ? money.format(data.totalBalance) : "—"}
            sub="Across connected accounts"
            accentClass="card-accent-blue"
            iconGrad="linear-gradient(135deg, #1F78FF, #57BEFE)"
            iconShadow="0 4px 14px rgba(31,120,255,0.32)"
            sparkColor="#1F78FF" />
        )}
        {visible.includes("monthly-spending") && (
          <StatCard icon={TrendingUp} label="Monthly Spending"
            value={data.hasTransactions ? money.format(data.monthlySpending) : "—"}
            sub={`${monthName} outgoing`}
            accentClass="card-accent-violet"
            iconGrad="linear-gradient(135deg, #7c3aed, #a855f7)"
            iconShadow="0 4px 14px rgba(124,58,237,0.32)"
            sparkColor="#a855f7" />
        )}
        {visible.includes("subscription-spending") && (
          <StatCard icon={Bot} label="Subscriptions"
            value={data.hasTransactions ? money.format(data.subscriptionSpending) : "—"}
            sub="Confirmed charges this month"
            accentClass="card-accent-amber"
            iconGrad="linear-gradient(135deg, #f59e0b, #fbbf24)"
            iconShadow="0 4px 14px rgba(245,158,11,0.32)"
            sparkColor="#f59e0b" />
        )}
      </div>

      {/* Category + Trend */}
      {(visible.includes("category") || visible.includes("trend")) && (
        <div className="grid gap-4 xl:grid-cols-2">
          {visible.includes("category") && (
            <motion.div variants={item}
              className="overflow-hidden rounded-2xl bg-white p-6"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)" }}>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-slate-400">This month</p>
              <h2 className="mt-0.5 text-base font-bold text-slate-900">Spending by category</h2>
              {data.categories.length ? (
                <div className="mt-5 space-y-3">
                  {data.categories.map((cat, i) => (
                    <div key={cat.label}>
                      <div className="flex justify-between gap-4 text-sm">
                        <span className="font-medium text-slate-700 flex items-center gap-2">
                          <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: categoryColors[i % categoryColors.length] }} />
                          {cat.label}
                        </span>
                        <span className="font-semibold text-slate-800 font-mono" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {money.format(cat.amount)} · {Math.round((cat.amount / categoryTotal) * 100)}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-slate-100">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${(cat.amount / categoryTotal) * 100}%`, backgroundColor: categoryColors[i % categoryColors.length] }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-sm text-slate-500">No spending categories to show yet.</p>
              )}
            </motion.div>
          )}

          {visible.includes("trend") && (
            <motion.div variants={item}
              className="overflow-hidden rounded-2xl bg-white p-6"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)" }}>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-slate-400">Trend</p>
              <h2 className="mt-0.5 text-base font-bold text-slate-900">Monthly spending</h2>
              <div className="mt-6 flex h-48 items-end gap-3 border-b border-slate-100">
                {data.months.map((month) => (
                  <div key={month.key} className="flex h-full flex-1 flex-col justify-end text-center">
                    <span className="mb-1.5 text-[10px] font-medium text-slate-500">
                      {month.amount ? money.format(month.amount) : "—"}
                    </span>
                    <div className="mx-auto w-full max-w-10 rounded-t-md bg-[#1F78FF]"
                      style={{ height: `${Math.max((month.amount / maxMonth) * 100, 2)}%` }} />
                    <span className="py-2.5 text-xs text-slate-400">{month.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Recent transactions */}
      {visible.includes("recent-transactions") && (
        <motion.div variants={item}
          className="overflow-hidden rounded-2xl bg-white"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)" }}>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-slate-400">Recent Activity</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">Transaction history</p>
            </div>
            <Link href="/analytics"
              className="flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#1F78FF] transition-colors hover:bg-blue-100">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {data.transactions.length ? (
            <ul className="divide-y divide-slate-100">
              {data.transactions.slice(0, 8).map((txn) => (
                <li key={txn.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{txn.name}</p>
                    <p className="text-xs text-slate-400">
                      {txn.category} · {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${txn.date}T12:00:00Z`))}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-bold text-slate-800" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {money.format(txn.amount)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "linear-gradient(135deg, #f0f5ff, #e8f0ff)" }}>
                <CreditCard size={18} className="text-blue-400" />
              </div>
              <p className="text-sm font-medium text-slate-700">No transactions yet</p>
              <p className="text-xs text-slate-400">Connect a bank account to see your spending history.</p>
              <Link href="/wallet"
                className="mt-1 rounded-lg bg-[#1F78FF] px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-blue-700 active:scale-95">
                Connect bank
              </Link>
            </div>
          )}
        </motion.div>
      )}

    </motion.div>
  );
}
