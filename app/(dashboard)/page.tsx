"use client";

import { motion, type Variants } from "framer-motion";
import { BarChart3, CreditCard, Star, TrendingUp, Zap, Shield, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function DashboardPage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold text-zinc-900">Good morning 👋</h1>
        <p className="mt-1 text-sm text-zinc-500">Here&apos;s an overview of your finances.</p>
      </motion.div>

      {/* Bento grid */}
      <motion.div variants={item} className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Hero card — AI assistant */}
        <Link
          href="/chatbot"
          className="group relative col-span-1 overflow-hidden rounded-3xl p-6 lg:col-span-2"
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e1040 50%, #0f172a 100%)",
          }}
        >
          {/* Glow blobs */}
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full opacity-40"
            style={{ background: "radial-gradient(circle, rgba(168,85,247,0.5) 0%, transparent 70%)" }} />
          <div className="pointer-events-none absolute bottom-0 left-20 h-48 w-48 rounded-full opacity-30"
            style={{ background: "radial-gradient(circle, rgba(31,120,255,0.5) 0%, transparent 70%)" }} />
          <div className="pointer-events-none absolute right-20 top-10 h-32 w-32 rounded-full opacity-25"
            style={{ background: "radial-gradient(circle, rgba(236,72,153,0.5) 0%, transparent 70%)" }} />

          <div className="relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "linear-gradient(135deg, #1F78FF, #a855f7)" }}>
                <Sparkles size={16} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-white/70">Pockit AI</span>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-white leading-snug">
              Which card should I use<br />for my next purchase?
            </h2>
            <p className="mt-2 text-sm text-white/45">
              Ask anything — card picks, subscription help, reward math.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white/80 transition-all group-hover:bg-white/15">
              Ask Pockit AI <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </Link>

        {/* Rewards card */}
        <div className="relative overflow-hidden rounded-3xl p-6"
          style={{ background: "linear-gradient(135deg, #fef9ee 0%, #fdf3d7 100%)" }}>
          <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(251,191,36,0.4) 0%, transparent 70%)" }} />
          <div className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)" }}>
            <Star size={18} className="text-white" />
          </div>
          <p className="mt-4 text-3xl font-black text-zinc-900">—</p>
          <p className="text-sm font-semibold text-zinc-700">Rewards earned</p>
          <p className="mt-1 text-xs text-zinc-400">Add cards to track points</p>
        </div>

        {/* Balance card */}
        <div className="relative overflow-hidden rounded-3xl p-6"
          style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" }}>
          <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(31,120,255,0.3) 0%, transparent 70%)" }} />
          <div className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #1F78FF, #57BEFE)" }}>
            <CreditCard size={18} className="text-white" />
          </div>
          <p className="mt-4 text-3xl font-black text-zinc-900">—</p>
          <p className="text-sm font-semibold text-zinc-700">Total balance</p>
          <p className="mt-1 text-xs text-zinc-400">Connect a bank to see balance</p>
        </div>

        {/* Monthly spend */}
        <div className="relative overflow-hidden rounded-3xl p-6"
          style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)" }}>
          <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)" }} />
          <div className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
            <TrendingUp size={18} className="text-white" />
          </div>
          <p className="mt-4 text-3xl font-black text-zinc-900">—</p>
          <p className="text-sm font-semibold text-zinc-700">Monthly spend</p>
          <p className="mt-1 text-xs text-zinc-400">Sync transactions to track</p>
        </div>

        {/* Quick nav cards */}
        {[
          { href: "/wallet", icon: CreditCard, label: "Wallet", desc: "Cards & credit usage", color: "#1F78FF", bg: "#eff6ff" },
          { href: "/analytics", icon: BarChart3, label: "Analytics", desc: "Spending breakdown", color: "#059669", bg: "#f0fdf4" },
          { href: "/subscriptions", icon: Shield, label: "Subscriptions", desc: "Recurring bills", color: "#d97706", bg: "#fffbeb" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-center gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: action.bg }}>
              <action.icon size={20} style={{ color: action.color }} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-zinc-900">{action.label}</p>
              <p className="text-xs text-zinc-400">{action.desc}</p>
            </div>
            <ArrowRight size={15} className="ml-auto shrink-0 text-zinc-300 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        ))}

        {/* Recent activity */}
        <div className="col-span-1 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">Recent activity</h3>
            <Link href="/wallet" className="text-xs font-medium text-[#1F78FF] hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-28 rounded" />
                  <div className="skeleton h-2.5 w-16 rounded" />
                </div>
                <div className="skeleton h-3 w-12 rounded" />
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-zinc-400">
            Connect a bank to see your transactions
          </p>
        </div>

      </motion.div>
    </motion.div>
  );
}
