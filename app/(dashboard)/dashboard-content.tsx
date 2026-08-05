"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, CreditCard, Landmark, Pencil, Plus, RefreshCcw, TrendingUp, X } from "lucide-react";

export type WidgetId = "total-balance" | "monthly-spending" | "subscription-spending" | "category" | "trend" | "recent-transactions";
export type DashboardData = {
  totalBalance: number; monthlySpending: number; subscriptionSpending: number;
  categories: { label: string; amount: number }[]; months: { key: string; label: string; amount: number }[];
  transactions: { id: string; name: string; amount: number; date: string; category: string }[];
  hasAccounts: boolean; hasTransactions: boolean; error: string | null; preferenceUnavailable: boolean;
};
const widgets: { id: WidgetId; title: string; description: string; essential?: boolean }[] = [
  { id: "total-balance", title: "Total Balance", description: "Balances across connected cards", essential: true },
  { id: "monthly-spending", title: "Monthly Spending", description: "Outgoing card transactions this month" },
  { id: "subscription-spending", title: "Subscription Spending", description: "Active subscription charges this month" },
  { id: "category", title: "Spending by Category", description: "Where this month’s spending went" },
  { id: "trend", title: "Monthly Spending Trend", description: "Your last six months" },
  { id: "recent-transactions", title: "Recent Transactions", description: "Newest activity first" },
];
const defaultOrder = widgets.map((widget) => widget.id);
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const colors = ["#1f78ff", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899", "#64748b"];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,.04),0_4px_16px_rgba(0,0,0,.06)] ${className}`}>{children}</section>;
}
function Stat({ title, value, sub, color }: { title: string; value: number; sub: string; color: string }) {
  return <Card><div className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: color }}><CreditCard size={18} /></div><p className="mt-5 font-sans text-3xl font-black text-slate-900">{money.format(value)}</p><p className="mt-2 text-[10px] font-semibold uppercase tracking-[.13em] text-slate-400">{title}</p><p className="mt-1 text-xs text-slate-400">{sub}</p></Card>;
}

export default function DashboardContent({ data, initialOrder, initialHidden }: { data: DashboardData; initialOrder: WidgetId[]; initialHidden: WidgetId[] }) {
  const [order, setOrder] = useState(initialOrder);
  const [hidden, setHidden] = useState<WidgetId[]>(initialHidden.filter((id) => id !== "total-balance"));
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const visible = order.filter((id) => !hidden.includes(id));
  const categoryTotal = data.categories.reduce((total, category) => total + category.amount, 0);
  const maxMonth = Math.max(...data.months.map((month) => month.amount), 1);
  const save = async (nextOrder = order, nextHidden = hidden) => {
    setStatus("saving");
    try {
      const response = await fetch("/api/dashboard/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ widgetOrder: nextOrder, hiddenWidgets: nextHidden }) });
      if (!response.ok) throw new Error();
      setStatus("saved"); setTimeout(() => setStatus("idle"), 1800);
    } catch { setStatus("error"); }
  };
  const move = (id: WidgetId, direction: -1 | 1) => {
    const index = order.indexOf(id); const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const next = [...order]; [next[index], next[target]] = [next[target], next[index]]; setOrder(next); void save(next, hidden);
  };
  const toggle = (id: WidgetId) => {
    if (id === "total-balance") return;
    const next = hidden.includes(id) ? hidden.filter((item) => item !== id) : [...hidden, id]; setHidden(next); void save(order, next);
  };
  const restore = () => {
    if (!window.confirm("Restore the default dashboard layout?")) return;
    setOrder(defaultOrder); setHidden([]); void save(defaultOrder, []);
  };
  const monthName = useMemo(() => new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date()), []);

  if (data.error) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center"><p className="font-semibold text-rose-900">{data.error}</p><button onClick={() => window.location.reload()} className="mt-3 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white">Retry</button></div>;
  if (!data.hasAccounts) return <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50 px-6 text-center"><Landmark className="h-12 w-12 text-blue-600" /><h1 className="mt-4 text-2xl font-black text-slate-900">Connect a credit card to get started</h1><p className="mt-2 max-w-md text-sm text-slate-500">Your dashboard will show balances, spending, and subscriptions once an account is connected.</p><Link href="/auth/connect-bank" className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Connect bank</Link></div>;
  return <div className="mx-auto max-w-[1280px] space-y-5 pb-8">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400">{monthName} overview</p><h1 className="mt-1 text-[28px] font-black tracking-tight text-slate-900">Your dashboard</h1></div><button onClick={() => setEditing((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"><Pencil size={15} />{editing ? "Done editing" : "Edit dashboard"}</button></header>
    {data.preferenceUnavailable && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Dashboard changes can’t be saved until the latest database migration is applied.</p>}
    {editing && <Card><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-slate-900">Customize your dashboard</h2><p className="text-sm text-slate-500">Use the buttons to show, hide, or reorder widgets. Changes save automatically.</p></div><button onClick={restore} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"><RefreshCcw size={14} />Restore default</button></div><div className="mt-4 space-y-2">{order.map((id, index) => { const widget = widgets.find((item) => item.id === id)!; const isHidden = hidden.includes(id); return <div key={id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2"><div><p className="text-sm font-semibold text-slate-800">{widget.title} {widget.essential && <span className="text-xs font-normal text-slate-400">(always shown)</span>}</p><p className="text-xs text-slate-500">{widget.description}</p></div><div className="flex items-center gap-1"><button aria-label={`Move ${widget.title} up`} disabled={index === 0} onClick={() => move(id, -1)} className="rounded p-2 text-slate-600 disabled:opacity-30"><ArrowUp size={15} /></button><button aria-label={`Move ${widget.title} down`} disabled={index === order.length - 1} onClick={() => move(id, 1)} className="rounded p-2 text-slate-600 disabled:opacity-30"><ArrowDown size={15} /></button>{!widget.essential && <button onClick={() => toggle(id)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600">{isHidden ? <><Plus className="mr-1 inline" size={13} />Add</> : <><X className="mr-1 inline" size={13} />Remove</>}</button>}</div></div>; })}</div>{status !== "idle" && <p className={`mt-3 text-xs ${status === "error" ? "text-rose-600" : "text-emerald-600"}`} aria-live="polite">{status === "saving" ? "Saving layout…" : status === "saved" ? "Layout saved" : "Couldn’t save your layout. Try again."}</p>}</Card>}
    {!data.hasTransactions && <Card><div className="flex flex-col items-center py-8 text-center"><TrendingUp className="h-9 w-9 text-blue-500" /><h2 className="mt-3 font-bold text-slate-900">No transactions yet</h2><p className="mt-1 text-sm text-slate-500">Your dashboard will update when your connected card has transaction data.</p></div></Card>}
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">{visible.includes("total-balance") && <Stat title="Total Balance" value={data.totalBalance} sub="Across connected accounts" color="linear-gradient(135deg,#1f78ff,#57befe)" />}{visible.includes("monthly-spending") && <Stat title="Monthly Spending" value={data.monthlySpending} sub={`${monthName} outgoing transactions`} color="linear-gradient(135deg,#7c3aed,#a855f7)" />}{visible.includes("subscription-spending") && <Stat title="Subscription Spending" value={data.subscriptionSpending} sub="Confirmed charges this month" color="linear-gradient(135deg,#f59e0b,#fbbf24)" />}</div>
    <div className="grid gap-4 xl:grid-cols-2">{visible.includes("category") && <Card><h2 className="font-bold text-slate-900">Spending by category</h2><p className="mt-1 text-sm text-slate-500">{monthName} spending</p>{data.categories.length ? <div className="mt-5 space-y-3">{data.categories.map((category, index) => <div key={category.label}><div className="flex justify-between gap-4 text-sm"><span className="font-medium text-slate-700"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />{category.label}</span><span className="font-semibold text-slate-800">{money.format(category.amount)} · {Math.round((category.amount / categoryTotal) * 100)}%</span></div><div className="mt-1.5 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${(category.amount / categoryTotal) * 100}%`, backgroundColor: colors[index % colors.length] }} /></div></div>)}</div> : <p className="mt-6 text-sm text-slate-500">No spending categories to show yet.</p>}</Card>}{visible.includes("trend") && <Card><h2 className="font-bold text-slate-900">Monthly spending trend</h2><p className="mt-1 text-sm text-slate-500">Last six months</p><div className="mt-6 flex h-48 items-end gap-3 border-b border-slate-200">{data.months.map((month) => <div key={month.key} className="group flex h-full flex-1 flex-col justify-end text-center"><span className="mb-1 text-[10px] text-slate-500">{month.amount ? money.format(month.amount) : "—"}</span><div aria-label={`${month.label}: ${money.format(month.amount)}`} className="mx-auto w-full max-w-10 rounded-t-md bg-blue-500" style={{ height: `${Math.max((month.amount / maxMonth) * 100, 2)}%` }} /><span className="py-2 text-xs text-slate-400">{month.label}</span></div>)}</div></Card>}</div>
    {visible.includes("recent-transactions") && <Card><div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Recent transactions</h2><p className="mt-1 text-sm text-slate-500">Newest transactions first</p></div><Link href="/analytics" className="text-sm font-semibold text-blue-600">View analytics</Link></div>{data.transactions.length ? <ul className="mt-4 divide-y divide-slate-100">{data.transactions.map((transaction) => <li key={transaction.id} className="flex items-center justify-between gap-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{transaction.name}</p><p className="text-xs text-slate-400">{transaction.category} · {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${transaction.date}T12:00:00Z`))}</p></div><span className="font-sans text-sm font-bold text-slate-800">{money.format(transaction.amount)}</span></li>)}</ul> : <p className="mt-6 text-sm text-slate-500">No transaction activity to show.</p>}</Card>}
  </div>;
}
