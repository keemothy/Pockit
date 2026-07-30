"use client";

import { motion, type Variants } from "framer-motion";
import { BarChart3, CreditCard, Star, TrendingUp, Zap, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const stats = [
  {
    label: "Total Balance",
    value: "—",
    hint: "Connect a bank to track balance",
    icon: CreditCard,
    gradient: "from-[#1F78FF] to-[#57BEFE]",
    glow: "#1F78FF",
  },
  {
    label: "Monthly Spend",
    value: "—",
    hint: "Sync transactions to see spending",
    icon: TrendingUp,
    gradient: "from-[#7c3aed] to-[#a78bfa]",
    glow: "#7c3aed",
  },
  {
    label: "Rewards Earned",
    value: "—",
    hint: "Add cards to track rewards points",
    icon: Star,
    gradient: "from-[#d97706] to-[#fbbf24]",
    glow: "#d97706",
  },
];

const actions = [
  {
    href: "/wallet",
    icon: CreditCard,
    title: "Manage Wallet",
    desc: "Track cards and credit usage",
    color: "#1F78FF",
  },
  {
    href: "/chatbot",
    icon: Zap,
    title: "Ask Pockit AI",
    desc: "Get personalized card picks",
    color: "#7c3aed",
  },
  {
    href: "/analytics",
    icon: BarChart3,
    title: "View Analytics",
    desc: "See your spending breakdown",
    color: "#059669",
  },
  {
    href: "/subscriptions",
    icon: Shield,
    title: "Subscriptions",
    desc: "Track and manage recurring bills",
    color: "#d97706",
  },
];

export default function DashboardPage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Greeting */}
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold text-zinc-900">Good morning 👋</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Here&apos;s an overview of your finances.
        </p>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={item} className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div
              className="absolute -right-5 -top-5 h-24 w-24 rounded-full opacity-10"
              style={{ background: `radial-gradient(circle, ${stat.glow}, transparent 70%)` }}
            />
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient}`}
            >
              <stat.icon className="h-5 w-5 text-white" />
            </div>
            <p className="mt-3 text-2xl font-bold text-zinc-900">{stat.value}</p>
            <p className="text-sm font-medium text-zinc-700">{stat.label}</p>
            <p className="mt-0.5 text-xs text-zinc-400">{stat.hint}</p>
          </div>
        ))}
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={item}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${action.color}18` }}
              >
                <action.icon className="h-5 w-5" style={{ color: action.color }} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-zinc-900">{action.title}</p>
                <p className="text-sm text-zinc-500">{action.desc}</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-zinc-300 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent activity placeholder */}
      <motion.div variants={item}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Recent activity
        </h2>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-32 rounded" />
                  <div className="skeleton h-2.5 w-20 rounded" />
                </div>
                <div className="skeleton h-3 w-14 rounded" />
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-zinc-400">
            Connect a bank account to see transactions
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
