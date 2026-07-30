"use client";

import { motion, type Variants } from "framer-motion";
import {
  BarChart3, CreditCard, Star, TrendingUp,
  ArrowRight, Sparkles, Shield, Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

/* ── animation variants ────────────────────────────────── */
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};

/* ── helpers ────────────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Good night";
}

function getDateString() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

/* ── decorative sparkline ───────────────────────────────── */
function Sparkline({ color }: { color: string }) {
  return (
    <svg
      width="80" height="28" viewBox="0 0 80 28" fill="none"
      className="absolute bottom-5 right-5 opacity-[0.18]"
      aria-hidden
    >
      <polyline
        points="0,22 14,14 26,18 40,8 54,13 66,5 80,9"
        stroke={color} strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── stat card ──────────────────────────────────────────── */
type StatCardProps = {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  accentClass: string;
  iconGrad: string;
  iconShadow: string;
  sparkColor: string;
};

function StatCard({ icon: Icon, label, value, sub, accentClass, iconGrad, iconShadow, sparkColor }: StatCardProps) {
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
        {/* Icon */}
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: iconGrad, boxShadow: iconShadow }}
        >
          <Icon size={19} className="text-white" />
        </div>

        {/* Value */}
        <p
          className="mt-5 font-mono text-[42px] font-black leading-none tracking-tight text-slate-900"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </p>

        {/* Label */}
        <p className="mt-2 text-[10.5px] font-semibold uppercase tracking-[0.13em] text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 text-xs text-slate-400/70">{sub}</p>
      </div>
    </motion.div>
  );
}

/* ── quick feature tile ─────────────────────────────────── */
type FeatureTileProps = {
  href: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  grad: string;
  glow: string;
  blobColor: string;
};

function FeatureTile({ href, icon: Icon, label, desc, grad, glow, blobColor }: FeatureTileProps) {
  return (
    <motion.div variants={item} whileTap={{ scale: 0.97 }}>
      <Link
        href={href}
        className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-white p-4 transition-all duration-200"
        style={{
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.boxShadow =
            "0 4px 8px rgba(0,0,0,0.06), 0 12px 28px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.04)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.boxShadow =
            "0 1px 3px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)";
        }}
      >
        {/* Background blob on hover */}
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: `radial-gradient(circle, ${blobColor} 0%, transparent 70%)` }}
        />

        {/* Icon */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-shadow duration-200"
          style={{ background: grad, boxShadow: glow }}
        >
          <Icon size={19} className="text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">{label}</p>
          <p className="text-xs text-slate-400">{desc}</p>
        </div>

        <ArrowRight
          size={14}
          className="shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-blue-400"
        />
      </Link>
    </motion.div>
  );
}

/* ── main page ──────────────────────────────────────────── */
export default function DashboardPage() {
  const greeting = useMemo(getGreeting, []);
  const dateStr  = useMemo(getDateString, []);

  const AI_PROMPTS = [
    "Best card for travel?",
    "Should I cancel Netflix?",
    "Maximize cashback →",
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">

      {/* ── Header ── */}
      <motion.div variants={item} className="flex items-end justify-between">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {dateStr}
          </p>
          <h1 className="mt-0.5 text-[28px] font-black tracking-tight text-slate-900">
            {greeting} 👋
          </h1>
        </div>

      </motion.div>

      {/* ── Top row: AI hero + Net Worth ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* AI Hero card */}
        <motion.div
          variants={item}
          whileTap={{ scale: 0.99 }}
          className="col-span-1 lg:col-span-2"
        >
          <Link
            href="/chatbot"
            className="group relative block overflow-hidden rounded-2xl p-7"
            style={{
              background: "linear-gradient(135deg, #0a1628 0%, #16104a 55%, #0a1628 100%)",
              boxShadow: "0 4px 24px rgba(10,22,40,0.25), 0 1px 3px rgba(0,0,0,0.2)",
            }}
          >
            {/* Mesh blobs */}
            <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full opacity-50"
              style={{ background: "radial-gradient(circle, rgba(168,85,247,0.55) 0%, transparent 70%)" }} />
            <div className="pointer-events-none absolute bottom-0 left-16 h-48 w-48 rounded-full opacity-35"
              style={{ background: "radial-gradient(circle, rgba(31,120,255,0.55) 0%, transparent 70%)" }} />
            <div className="pointer-events-none absolute right-24 top-8 h-28 w-28 rounded-full opacity-30"
              style={{ background: "radial-gradient(circle, rgba(236,72,153,0.45) 0%, transparent 70%)" }} />

            <div className="relative z-10">
              {/* Eyebrow */}
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: "linear-gradient(135deg, #1F78FF, #a855f7)" }}>
                  <Sparkles size={15} className="text-white" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-white/50">
                  Pockit AI
                </span>
              </div>

              {/* Headline */}
              <h2 className="mt-4 text-2xl font-black leading-snug text-white tracking-tight">
                Smart money decisions,<br />
                <span className="animated-gradient-text">powered by AI.</span>
              </h2>

              {/* Floating prompt pills */}
              <div className="mt-5 flex flex-wrap gap-2">
                {AI_PROMPTS.map((q, i) => (
                  <span
                    key={q}
                    className={`rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-xs text-white/65 backdrop-blur-sm pill-float-${i + 1}`}
                  >
                    {q}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/85 backdrop-blur-sm transition-all duration-200 group-hover:bg-white/[0.16]">
                Ask a question
                <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Right panel: quick tiles stacked */}
        <div className="flex flex-col gap-3">
          {[
            {
              href: "/wallet",
              icon: Wallet,
              label: "Wallet",
              desc: "Manage your cards",
              grad: "linear-gradient(135deg, #1F78FF, #57BEFE)",
              glow: "0 4px 14px rgba(31,120,255,0.3)",
              blobColor: "rgba(31,120,255,0.08)",
            },
            {
              href: "/analytics",
              icon: BarChart3,
              label: "Analytics",
              desc: "Spending breakdown",
              grad: "linear-gradient(135deg, #059669, #34d399)",
              glow: "0 4px 14px rgba(5,150,105,0.3)",
              blobColor: "rgba(5,150,105,0.08)",
            },
            {
              href: "/subscriptions",
              icon: Shield,
              label: "Subscriptions",
              desc: "Track recurring bills",
              grad: "linear-gradient(135deg, #f59e0b, #fcd34d)",
              glow: "0 4px 14px rgba(245,158,11,0.3)",
              blobColor: "rgba(245,158,11,0.08)",
            },
          ].map((t) => (
            <FeatureTile key={t.href} {...t} />
          ))}
        </div>
      </div>

      {/* ── Stat row ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={CreditCard}
          label="Total Balance"
          value="—"
          sub="Connect a bank to track"
          accentClass="card-accent-blue"
          iconGrad="linear-gradient(135deg, #1F78FF, #57BEFE)"
          iconShadow="0 4px 14px rgba(31,120,255,0.32)"
          sparkColor="#1F78FF"
        />
        <StatCard
          icon={TrendingUp}
          label="Monthly Spend"
          value="—"
          sub="Sync transactions to track"
          accentClass="card-accent-violet"
          iconGrad="linear-gradient(135deg, #7c3aed, #a855f7)"
          iconShadow="0 4px 14px rgba(124,58,237,0.32)"
          sparkColor="#a855f7"
        />
        <StatCard
          icon={Star}
          label="Rewards Earned"
          value="—"
          sub="Add cards to track points"
          accentClass="card-accent-amber"
          iconGrad="linear-gradient(135deg, #f59e0b, #fbbf24)"
          iconShadow="0 4px 14px rgba(245,158,11,0.32)"
          sparkColor="#f59e0b"
        />
      </div>

      {/* ── Recent activity ── */}
      <motion.div
        variants={item}
        className="overflow-hidden rounded-2xl bg-white"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-slate-400">
              Recent Activity
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">Transaction history</p>
          </div>
          <Link
            href="/wallet"
            className="flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100"
          >
            View all <ArrowRight size={11} />
          </Link>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #f0f5ff, #e8f0ff)" }}
          >
            <CreditCard size={18} className="text-blue-400" />
          </div>
          <p className="text-sm font-medium text-slate-700">No transactions yet</p>
          <p className="text-xs text-slate-400">Connect a bank account to see your spending history.</p>
          <Link
            href="/wallet"
            className="mt-1 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-blue-700 active:scale-95"
          >
            Connect bank
          </Link>
        </div>
      </motion.div>

    </motion.div>
  );
}
