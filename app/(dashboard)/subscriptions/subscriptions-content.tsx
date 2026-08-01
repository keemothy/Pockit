"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SubscriptionCandidate } from "@/lib/plaid-analytics";
import { POPULAR_SUBSCRIPTION_CATEGORIES } from "@/lib/subscription-catalog";

type Cadence = "weekly" | "monthly" | "annual" | "custom";
export type ConfirmedSubscription = {
  id: string;
  displayName: string;
  merchantName: string;
  amount: number;
  cadence: Cadence;
  lastChargedOn: string | null;
  nextRenewalDate: string | null;
  detailedCategory: string | null;
  confidence: number | null;
  source: "plaid" | "manual";
};
type Draft = Omit<ConfirmedSubscription, "id">;
const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const emptyDraft: Draft = {
  displayName: "",
  merchantName: "",
  amount: 0,
  cadence: "monthly",
  lastChargedOn: null,
  nextRenewalDate: null,
  detailedCategory: null,
  confidence: null,
  source: "manual",
};

function monthlyAmount(
  subscription: Pick<ConfirmedSubscription, "amount" | "cadence">,
) {
  if (subscription.cadence === "weekly") return (subscription.amount * 52) / 12;
  if (subscription.cadence === "annual") return subscription.amount / 12;
  return subscription.amount;
}
function dateLabel(date: string | null) {
  return date
    ? new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Date not set";
}
function daysUntil(date: string | null) {
  if (!date) return null;
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  const today = new Date();
  const todayCalendarDay = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const renewalCalendarDay = Date.UTC(year, month - 1, day);
  return Math.round((renewalCalendarDay - todayCalendarDay) / 86_400_000);
}
function cadenceLabel(cadence: Cadence) {
  return cadence === "weekly"
    ? "week"
    : cadence === "annual"
      ? "year"
      : cadence === "custom"
        ? "cycle"
        : "month";
}
function calculateNextRenewal(lastChargedOn: string | null, cadence: Cadence) {
  if (!lastChargedOn || cadence === "custom") return null;
  let renewal = new Date(`${lastChargedOn}T12:00:00Z`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const moveToMonth = (date: Date, months: number) => {
    const targetMonth = date.getUTCMonth() + months;
    const targetYear = date.getUTCFullYear() + Math.floor(targetMonth / 12);
    const normalizedMonth = ((targetMonth % 12) + 12) % 12;
    const lastDay = new Date(
      Date.UTC(targetYear, normalizedMonth + 1, 0),
    ).getUTCDate();
    return new Date(
      Date.UTC(
        targetYear,
        normalizedMonth,
        Math.min(date.getUTCDate(), lastDay),
        12,
      ),
    );
  };
  while (renewal.getTime() < today.getTime()) {
    if (cadence === "weekly") renewal.setUTCDate(renewal.getUTCDate() + 7);
    if (cadence === "monthly") renewal = moveToMonth(renewal, 1);
    if (cadence === "annual") renewal = moveToMonth(renewal, 12);
  }
  return renewal.toISOString().slice(0, 10);
}
function effectiveNextRenewal(
  subscription: Pick<
    ConfirmedSubscription,
    "cadence" | "lastChargedOn" | "nextRenewalDate"
  >,
) {
  return subscription.cadence === "custom"
    ? subscription.nextRenewalDate
    : calculateNextRenewal(subscription.lastChargedOn, subscription.cadence);
}

function SubscriptionForm({
  draft,
  onChange,
  onSave,
  onClose,
  saving,
  title,
}: {
  draft: Draft;
  onChange: (draft: Draft) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
  title: string;
}) {
  const [popularCategory, setPopularCategory] = useState<string | null>(null);
  const field = (key: keyof Draft, value: string | number | null) => {
    const next = { ...draft, [key]: value } as Draft;
    if (key === "lastChargedOn" || key === "cadence")
      next.nextRenewalDate = calculateNextRenewal(
        next.lastChargedOn,
        next.cadence,
      );
    onChange(next);
  };
  const automaticRenewal = draft.cadence !== "custom";
  const displayedNextRenewal = automaticRenewal
    ? calculateNextRenewal(draft.lastChargedOn, draft.cadence)
    : draft.nextRenewalDate;
  const selectedPopularCategory = POPULAR_SUBSCRIPTION_CATEGORIES.find(
    (category) => category.id === popularCategory,
  );
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1F78FF]">
              Subscriptions
            </p>
            <h2 className="mt-1 text-2xl font-bold">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter the first charge date. We calculate the next renewal for
              weekly, monthly, and annual plans.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X />
          </button>
        </div>
        <div className="mt-5">
          <p className="text-sm font-semibold text-slate-700">
            Popular subscriptions
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Choose a category to browse services, or enter a custom service
            below.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {POPULAR_SUBSCRIPTION_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() =>
                  setPopularCategory((current) =>
                    current === category.id ? null : category.id,
                  )
                }
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${popularCategory === category.id ? "bg-blue-100 text-[#1F78FF]" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                {category.label}
              </button>
            ))}
          </div>
          {selectedPopularCategory && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {selectedPopularCategory.services.map((service) => (
                <button
                  key={service.name}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...draft,
                      displayName: service.name,
                      merchantName: service.name,
                    })
                  }
                  className={`rounded-lg border px-3 py-2 text-left text-xs font-medium ${draft.displayName === service.name ? "border-[#1F78FF] bg-blue-50 text-[#1F78FF]" : "border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-slate-50"}`}
                >
                  {service.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2 text-sm font-medium">
            Subscription name
            <input
              value={draft.displayName}
              onChange={(event) => field("displayName", event.target.value)}
              placeholder="e.g. Netflix"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-[#1F78FF]"
            />
          </label>
          <label className="text-sm font-medium">
            Amount
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.amount || ""}
              onChange={(event) => field("amount", Number(event.target.value))}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-[#1F78FF]"
            />
          </label>
          <label className="text-sm font-medium">
            Billing frequency
            <select
              value={draft.cadence}
              onChange={(event) =>
                field("cadence", event.target.value as Cadence)
              }
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-[#1F78FF]"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            First charged
            <input
              type="date"
              value={draft.lastChargedOn ?? ""}
              onChange={(event) =>
                field("lastChargedOn", event.target.value || null)
              }
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-[#1F78FF]"
            />
          </label>
          {automaticRenewal ? (
            <div className="text-sm font-medium">
              Next renewal
              <p className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-600">
                {displayedNextRenewal
                  ? dateLabel(displayedNextRenewal)
                  : "Set first charge date"}
              </p>
            </div>
          ) : (
            <label className="text-sm font-medium">
              Next renewal
              <input
                type="date"
                value={draft.nextRenewalDate ?? ""}
                onChange={(event) =>
                  field("nextRenewalDate", event.target.value || null)
                }
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-[#1F78FF]"
              />
            </label>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            onClick={onSave}
            className="rounded-xl bg-[#1F78FF] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save subscription"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionsContent({
  candidates,
  confirmedSubscriptions,
  dismissedCandidateKeys,
  hasConnectedBank,
}: {
  candidates: SubscriptionCandidate[];
  confirmedSubscriptions: ConfirmedSubscription[];
  dismissedCandidateKeys: string[];
  hasConnectedBank: boolean;
}) {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState(confirmedSubscriptions);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "soon" | "monthly" | "annual">(
    "all",
  );
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dismissedCandidates, setDismissedCandidates] = useState<string[]>(
    dismissedCandidateKeys,
  );
  const [potentialVisible, setPotentialVisible] = useState(true);
  const monthlyTotal = subscriptions.reduce(
    (sum, subscription) => sum + monthlyAmount(subscription),
    0,
  );
  const renewingSoon = subscriptions.filter((subscription) => {
    const days = daysUntil(effectiveNextRenewal(subscription));
    return days !== null && days >= 0 && days <= 7;
  });
  const shown = useMemo(
    () =>
      subscriptions.filter((subscription) => {
        const haystack =
          `${subscription.displayName} ${subscription.merchantName}`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
        if (filter === "soon") {
          const days = daysUntil(effectiveNextRenewal(subscription));
          return days !== null && days >= 0 && days <= 7;
        }
        return filter === "all" || subscription.cadence === filter;
      }),
    [subscriptions, search, filter],
  );
  const visibleCandidates = candidates.filter(
    (candidate) =>
      !dismissedCandidates.includes(candidate.name.trim().toLowerCase()),
  );
  const openCandidate = (candidate: SubscriptionCandidate) =>
    setDraft({
      displayName: candidate.name,
      merchantName: candidate.name,
      amount: candidate.amount,
      cadence: candidate.cadence,
      lastChargedOn: candidate.lastCharged,
      nextRenewalDate: calculateNextRenewal(
        candidate.lastCharged,
        candidate.cadence,
      ),
      detailedCategory: candidate.detailedCategory,
      confidence: candidate.confidence,
      source: "plaid",
    });
  const dismissCandidate = async (candidate: SubscriptionCandidate) => {
    const key = candidate.name.trim().toLowerCase();
    const response = await fetch("/api/subscriptions/dismissals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchantKey: key }),
    });
    if (!response.ok) {
      setError("Unable to dismiss this candidate.");
      return;
    }
    setDismissedCandidates((current) => [...new Set([...current, key])]);
  };
  const openEdit = (subscription: ConfirmedSubscription) => {
    setEditingId(subscription.id);
    setDraft({
      ...subscription,
      nextRenewalDate:
        subscription.cadence === "custom"
          ? subscription.nextRenewalDate
          : calculateNextRenewal(
              subscription.lastChargedOn,
              subscription.cadence,
            ),
    });
  };
  async function save() {
    if (!draft) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...draft,
        nextRenewalDate:
          draft.cadence === "custom"
            ? draft.nextRenewalDate
            : calculateNextRenewal(draft.lastChargedOn, draft.cadence),
        merchantName: draft.merchantName.trim() || draft.displayName.trim(),
      };
      const response = await fetch("/api/subscriptions", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId ? { id: editingId, ...payload } : payload,
        ),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to save subscription.");
      const saved: ConfirmedSubscription = {
        id: data.subscription.id,
        displayName: data.subscription.display_name,
        merchantName: data.subscription.merchant_name,
        amount: Number(data.subscription.amount),
        cadence: data.subscription.cadence,
        lastChargedOn: data.subscription.last_charged_on,
        nextRenewalDate: data.subscription.next_renewal_date,
        detailedCategory: data.subscription.detailed_category,
        confidence: data.subscription.confidence,
        source: data.subscription.source,
      };
      setSubscriptions((current) =>
        editingId
          ? current.map((subscription) =>
              subscription.id === editingId ? saved : subscription,
            )
          : [...current, saved],
      );
      setDraft(null);
      setEditingId(null);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save subscription.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function remove(id: string) {
    if (
      !window.confirm(
        "Remove this subscription from Pockit? This will not cancel it with the provider.",
      )
    )
      return;
    const response = await fetch("/api/subscriptions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.ok) {
      setSubscriptions((current) =>
        current.filter((subscription) => subscription.id !== id),
      );
      router.refresh();
    } else setError("Unable to remove subscription.");
  }
  return (
    <div className="space-y-6 text-slate-800">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Subscriptions
          </p>
          <h1 className="mt-0.5 text-[28px] font-black tracking-tight text-slate-900">
            Recurring charges
          </h1>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setDraft(emptyDraft);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1F78FF] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Add subscription
        </button>
      </header>
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={CircleDollarSign}
          label="Monthly cost"
          value={money.format(monthlyTotal)}
          note={`Across ${subscriptions.length} active subscriptions`}
        />
        <Metric
          icon={CalendarDays}
          label="Annual projected cost"
          value={money.format(monthlyTotal * 12)}
          note="Based on confirmed plans"
        />
        <Metric
          icon={Clock3}
          label="Renewing soon"
          value={String(renewingSoon.length)}
          note="Within the next 7 days"
        />
        <Metric
          icon={CircleDollarSign}
          label="Potential savings"
          value={money.format(monthlyTotal)}
          note="If all active plans were canceled"
        />
      </section>
      {hasConnectedBank && (
        <section className="potential-subscriptions rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Potential subscriptions</h2>
              <p className="mt-1 text-sm text-slate-500">
                High-confidence recurring charges from the last 90 days. Confirm
                only services you recognize.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-[#1F78FF]">
                {visibleCandidates.length} to review
              </span>
              <button
                onClick={() => setPotentialVisible((visible) => !visible)}
                className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1F78FF]"
              >
                {potentialVisible ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {potentialVisible && (
            <div className="mt-4">
              {visibleCandidates.length === 0 ? (
                <p className="rounded-xl border border-dashed border-blue-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                  No high-confidence subscription candidates right now.
                </p>
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {visibleCandidates.map((candidate) => (
                    <div
                      key={`${candidate.name}-${candidate.amount}`}
                      className="rounded-xl border border-blue-100 bg-white p-4"
                    >
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-semibold">{candidate.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {candidate.occurrences} charges · every{" "}
                            {candidate.cadence === "weekly" ? "week" : "month"}{" "}
                            · {candidate.confidence}% confidence
                          </p>
                        </div>
                        <strong>
                          {money.format(candidate.amount)}
                          <span className="font-normal text-slate-400">
                            /{cadenceLabel(candidate.cadence)}
                          </span>
                        </strong>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                          Next expected {dateLabel(candidate.nextRenewalDate)}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => dismissCandidate(candidate)}
                            className="rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                          >
                            Not a subscription
                          </button>
                          <button
                            onClick={() => openCandidate(candidate)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#1F78FF] px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Confirm
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}
      {!hasConnectedBank && (
        <section className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-10 text-center">
          <h2 className="text-lg font-bold">
            Connect a credit card to detect subscriptions
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            You can still add subscriptions manually.
          </p>
          <Link
            href="/wallet"
            className="mt-4 inline-flex rounded-xl bg-[#1F78FF] px-4 py-2 text-sm font-semibold text-white"
          >
            Go to Wallet
          </Link>
        </section>
      )}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-bold">Your subscriptions</h2>
            <p className="mt-1 text-sm text-slate-500">
              {subscriptions.length} confirmed subscription
              {subscriptions.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search subscriptions"
                className="w-52 rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1F78FF]"
              />
            </label>
            {(["all", "soon", "monthly", "annual"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setFilter(option)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold ${filter === option ? "bg-[#1F78FF] text-white" : "border border-slate-200 text-slate-500"}`}
              >
                {option === "all"
                  ? "All"
                  : option === "soon"
                    ? "Renewing soon"
                    : option[0].toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className={filter === "all" && !search ? "min-h-[390px]" : ""}>
          {shown.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No confirmed subscriptions yet. Confirm a candidate or add one
              manually.
            </div>
          ) : (
            shown.map((subscription) => {
              const nextRenewal = effectiveNextRenewal(subscription);
              const days = daysUntil(nextRenewal);
              return (
                <div
                  key={subscription.id}
                  className="grid min-h-[78px] gap-4 border-b border-slate-100 px-5 py-4 transition-colors hover:bg-blue-50/60 last:border-0 md:grid-cols-[minmax(220px,1.45fr)_minmax(140px,.7fr)_minmax(160px,.85fr)_auto] md:items-center"
                >
                  <div>
                    <p className="font-semibold">{subscription.displayName}</p>
                    <p className="text-xs text-slate-400">
                      {subscription.source === "plaid"
                        ? "Confirmed from Plaid"
                        : "Added manually"}
                    </p>
                  </div>
                  <strong>
                    {money.format(subscription.amount)}
                    <span className="font-normal text-slate-400">
                      /{cadenceLabel(subscription.cadence)}
                    </span>
                  </strong>
                  <div
                    className={
                      days !== null && days >= 0 && days <= 7
                        ? "text-amber-600"
                        : "text-slate-600"
                    }
                  >
                    {days === 0
                      ? "Renews today"
                      : days !== null && days > 0 && days <= 7
                        ? `Renews in ${days} days`
                        : `Renews ${dateLabel(nextRenewal)}`}
                  </div>
                  <div className="flex items-center justify-end gap-2 md:ml-auto">
                    <button
                      onClick={() => openEdit(subscription)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Manage
                    </button>
                    <Link
                      href={`/chatbot?q=${encodeURIComponent(`Help me cancel ${subscription.displayName} (${money.format(subscription.amount)} per ${cadenceLabel(subscription.cadence)}). List the official cancellation steps and important caveats.`)}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Cancel help
                    </Link>
                    <button
                      onClick={() => remove(subscription.id)}
                      title="Remove from Pockit"
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
      {draft && (
        <SubscriptionForm
          draft={draft}
          onChange={setDraft}
          onSave={save}
          onClose={() => {
            setDraft(null);
            setEditingId(null);
          }}
          saving={saving}
          title={
            editingId
              ? "Manage subscription"
              : draft.source === "plaid"
                ? "Confirm subscription"
                : "Add subscription"
          }
        />
      )}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof CircleDollarSign;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <Icon className="h-5 w-5 text-[#1F78FF]" />
      <p className="mt-5 text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{note}</p>
    </article>
  );
}
