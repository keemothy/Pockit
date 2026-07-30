"use client";

import { motion, type Variants } from "framer-motion";
import { MessageCircle, Plus, Landmark } from "lucide-react";
import Link from "next/link";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } },
};

const sampleSubs = [
  { name: "Netflix", plan: "Standard", price: 15.49, color: "#E50914", initial: "N", billing: "Monthly" },
  { name: "Spotify", plan: "Individual Premium", price: 11.99, color: "#1DB954", initial: "S", billing: "Monthly" },
  { name: "Adobe Creative Cloud", plan: "All Apps (annual)", price: 59.99, color: "#FF0000", initial: "A", billing: "Monthly" },
  { name: "Microsoft 365", plan: "Personal", price: 9.99, color: "#00A4EF", initial: "M", billing: "Monthly" },
  { name: "Amazon Prime", plan: "Annual", price: 11.58, color: "#FF9900", initial: "P", billing: "Monthly" },
  { name: "YouTube Premium", plan: "Individual", price: 13.99, color: "#FF0000", initial: "Y", billing: "Monthly" },
];

const monthlyTotal = sampleSubs.reduce((sum, s) => sum + s.price, 0);

export default function SubscriptionsPage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Subscriptions</h1>
          <p className="mt-1 text-sm text-zinc-500">Track and manage your recurring bills.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-[#1F78FF] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700">
          <Plus size={16} />
          Add subscription
        </button>
      </motion.div>

      {/* Monthly total + CTA row */}
      <motion.div variants={item} className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Est. monthly total
          </p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            ${monthlyTotal.toFixed(2)}
            <span className="ml-1 text-base font-normal text-zinc-400">/mo</span>
          </p>
          <p className="mt-1 text-xs text-zinc-400">Based on sample data below</p>
        </div>

        <Link
          href="/auth/connect-bank"
          className="group flex items-center gap-4 rounded-2xl border border-dashed border-[#1F78FF]/30 bg-[#E9F1FF]/50 p-5 transition-all hover:border-[#1F78FF]/60 hover:bg-[#E9F1FF]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1F78FF]/10">
            <Landmark size={20} className="text-[#1F78FF]" />
          </div>
          <div>
            <p className="font-semibold text-zinc-900">Connect a bank</p>
            <p className="text-sm text-zinc-500">Auto-detect subscriptions from transactions</p>
          </div>
        </Link>
      </motion.div>

      {/* Subscription list */}
      <motion.div variants={item}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Your subscriptions
          </h2>
          <Link href="/chatbot" className="flex items-center gap-1.5 text-xs font-medium text-[#1F78FF] hover:underline">
            <MessageCircle size={13} />
            Help canceling one?
          </Link>
        </div>

        <div className="space-y-2.5">
          {sampleSubs.map((sub, i) => (
            <motion.div
              key={sub.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.07, duration: 0.35 }}
              className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: sub.color }}
              >
                {sub.initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-zinc-900">{sub.name}</p>
                <p className="text-sm text-zinc-500">{sub.plan} · {sub.billing}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-zinc-900">${sub.price.toFixed(2)}</p>
                <p className="text-xs text-zinc-400">/month</p>
              </div>
              <Link
                href="/chatbot"
                className="ml-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                Cancel?
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
