import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  ChartNoAxesCombined,
  Check,
  DollarSign,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPlaidEnvironment, type PlaidEnvironment } from "@/lib/plaid";
import { getPlaidAnalyticsTransactions } from "@/lib/plaid-analytics";
import { syncCompletedMonthlySpendingSummaries } from "@/lib/monthly-spending-summaries";
import { InsightLink } from "./insight-link";

const categoryColors = [
  "#2878f0",
  "#8848bf",
  "#ff9353",
  "#38aaa5",
  "#ff6372",
  "#a9c3e8",
];
const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const moneyPrecise = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const categoryNames: Record<string, string> = {
  FOOD_AND_DRINK: "Dining & food",
  GENERAL_MERCHANDISE: "Shopping",
  TRANSPORTATION: "Transportation",
  TRAVEL: "Travel",
  ENTERTAINMENT: "Entertainment",
  GAS_STATIONS: "Gas & fuel",
  HOME_IMPROVEMENT: "Home",
  MEDICAL: "Health",
  PERSONAL_CARE: "Personal care",
  RENT_AND_UTILITIES: "Bills & utilities",
};

function categoryLabel(category: string) {
  return (
    categoryNames[category] ??
    category
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

type MonthOption = { key: string; label: string };

function monthOptionsForRange(now: Date, length: number): MonthOption[] {
  return Array.from({ length }, (_, offset) => {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1),
    );
    return {
      key: monthKey(date),
      label: new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(date),
    };
  });
}

function MonthSelector({
  months,
  selectedMonth,
  range,
}: {
  months: MonthOption[];
  selectedMonth: string;
  range: number;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Spending month">
      {months.map((month) => (
        <Link
          key={month.key}
          href={`/analytics?month=${month.key}&range=${range}`}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${month.key === selectedMonth ? "bg-[#2878f0] text-white" : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
        >
          {month.label}
        </Link>
      ))}
    </div>
  );
}

function RangeSelector({
  selectedRange,
  selectedMonth,
}: {
  selectedRange: number;
  selectedMonth: string;
}) {
  return (
    <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
      {[6, 12].map((range) => (
        <Link
          key={range}
          href={`/analytics?month=${selectedMonth}&range=${range}`}
          className={`rounded-lg px-3 py-1.5 ${range === selectedRange ? "bg-[#2878f0] text-white shadow-sm" : "text-slate-500 hover:bg-white"}`}
        >
          Past {range} months
        </Link>
      ))}
    </div>
  );
}

function readPlaidItemEnvironments(metadata: Record<string, unknown>) {
  const value = metadata.plaid_item_environments;
  if (!value || typeof value !== "object" || Array.isArray(value))
    return {} as Record<string, PlaidEnvironment>;
  return Object.fromEntries(
    Object.entries(value).flatMap(([itemId, environment]) =>
      environment === "sandbox" ||
      environment === "development" ||
      environment === "production"
        ? [[itemId, environment]]
        : [],
    ),
  );
}

function readWalletCategories(value: unknown, selectedMonth: string) {
  const entries = Array.isArray(value)
    ? value
    : value &&
        typeof value === "object" &&
        Array.isArray((value as Record<string, unknown>)[selectedMonth])
      ? ((value as Record<string, unknown>)[selectedMonth] as unknown[])
      : [];
  return entries.flatMap((category) => {
    if (!category || typeof category !== "object") return [];
    const candidate = category as Record<string, unknown>;
    return typeof candidate.label === "string" &&
      typeof candidate.amount === "number" &&
      candidate.amount > 0
      ? [{ label: candidate.label, amount: candidate.amount }]
      : [];
  });
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string | string[];
    range?: string | string[];
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const now = new Date();
  const query = await searchParams;
  const monthOptions = monthOptionsForRange(now, 3);
  const overviewRange = query.range === "12" ? 12 : 6;
  const overviewMonthOptions = monthOptionsForRange(now, overviewRange);
  const requestedMonth = typeof query.month === "string" ? query.month : "";
  const currentMonthKey = monthKey(now);
  const selectedMonthKey = monthOptions.some(
    (month) => month.key === requestedMonth,
  )
    ? requestedMonth
    : currentMonthKey;

  const { data: accounts } = await supabase
    .from("financial_accounts")
    .select("id, plaid_item_id, plaid_account_id, type")
    .eq("user_id", user.id);

  const { data: manualCardsData } = await supabase
    .from("manual_cards")
    .select(
      "id, name, last_four, current_balance, credit_limit, spending_categories",
    )
    .eq("user_id", user.id)
    .order("created_at");
  const manualCards = manualCardsData ?? [];

  const environments = readPlaidItemEnvironments(
    user.user_metadata as Record<string, unknown>,
  );
  const activeEnvironment = getPlaidEnvironment();
  const activeAccounts = (accounts ?? []).filter(
    (account) =>
      environments[account.plaid_item_id] === activeEnvironment &&
      account.type?.toLowerCase() === "credit",
  );
  const transactions = await getPlaidAnalyticsTransactions(
    user.id,
    activeAccounts.map((account) => ({
      plaidItemId: account.plaid_item_id,
      plaidAccountId: account.plaid_account_id,
    })),
    400,
  );
  const summaryAccounts = activeAccounts.map((account) => ({
    id: account.id,
    plaidItemId: account.plaid_item_id,
    plaidAccountId: account.plaid_account_id,
  }));
  // Page visits safely catch up in case a scheduled run was delayed. The table
  // retains only completed-month category totals, never individual transactions.
  try {
    await syncCompletedMonthlySpendingSummaries(user.id, summaryAccounts);
  } catch {
    /* schema may not be deployed yet */
  }
  const { data: savedSummaries } = await supabase
    .from("monthly_spending_summaries")
    .select("month, category, amount")
    .in(
      "month",
      overviewMonthOptions.map((month) => month.key),
    );

  const previousMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  );
  const previousMonthKey = monthKey(previousMonth);
  const summaryByMonth = new Map<string, Map<string, number>>();
  for (const summary of savedSummaries ?? []) {
    const categories =
      summaryByMonth.get(summary.month) ?? new Map<string, number>();
    categories.set(
      summary.category,
      (categories.get(summary.category) ?? 0) + Number(summary.amount),
    );
    summaryByMonth.set(summary.month, categories);
  }
  const rawCategoriesByMonth = new Map<string, Map<string, number>>();
  for (const transaction of transactions) {
    const month = transaction.date.slice(0, 7);
    const categories =
      rawCategoriesByMonth.get(month) ?? new Map<string, number>();
    categories.set(
      transaction.category,
      (categories.get(transaction.category) ?? 0) + transaction.amount,
    );
    rawCategoriesByMonth.set(month, categories);
  }
  const categoriesForMonth = (month: string) =>
    month === currentMonthKey || !summaryByMonth.has(month)
      ? (rawCategoriesByMonth.get(month) ?? new Map<string, number>())
      : (summaryByMonth.get(month) ?? new Map<string, number>());
  const selectedMonthTransactions = transactions.filter((transaction) =>
    transaction.date.startsWith(selectedMonthKey),
  );
  const currentMonthTransactions = transactions.filter((transaction) =>
    transaction.date.startsWith(currentMonthKey),
  );
  const walletCategoryTotals = new Map<string, number>();
  for (const card of manualCards ?? []) {
    for (const category of readWalletCategories(
      card.spending_categories,
      selectedMonthKey,
    )) {
      walletCategoryTotals.set(
        category.label,
        (walletCategoryTotals.get(category.label) ?? 0) + category.amount,
      );
    }
  }
  const walletSpending = [...walletCategoryTotals.values()].reduce(
    (sum, amount) => sum + amount,
    0,
  );
  const plaidCategoryTotals = categoriesForMonth(selectedMonthKey);
  const plaidSpending = [...plaidCategoryTotals.values()].reduce(
    (sum, amount) => sum + amount,
    0,
  );
  const totalSpent = plaidSpending + walletSpending;
  const currentWalletSpending = manualCards.reduce(
    (sum, card) =>
      sum +
      readWalletCategories(card.spending_categories, currentMonthKey).reduce(
        (cardSum, category) => cardSum + category.amount,
        0,
      ),
    0,
  );
  const currentTotalSpent =
    currentMonthTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0,
    ) + currentWalletSpending;
  const previousWalletSpending = manualCards.reduce(
    (sum, card) =>
      sum +
      readWalletCategories(card.spending_categories, previousMonthKey).reduce(
        (cardSum, category) => cardSum + category.amount,
        0,
      ),
    0,
  );
  const previousSpent =
    transactions
      .filter((transaction) => transaction.date.startsWith(previousMonthKey))
      .reduce((sum, transaction) => sum + transaction.amount, 0) +
    previousWalletSpending;
  const changePercent = previousSpent
    ? ((currentTotalSpent - previousSpent) / previousSpent) * 100
    : null;
  const currentMonthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${selectedMonthKey}-01T12:00:00`));
  const currentCalendarMonthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${currentMonthKey}-01T12:00:00`));

  const categoryTotals = new Map(plaidCategoryTotals);
  for (const [category, amount] of walletCategoryTotals) {
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + amount);
  }
  const categories = [...categoryTotals]
    .sort(([, firstAmount], [, secondAmount]) => secondAmount - firstAmount)
    .slice(0, 6)
    .map(([category, amount], index) => ({
      key: category,
      label: categoryLabel(category),
      amount,
      color: categoryColors[index],
    }));
  const topCategory = categories[0];
  const donutStops = categories.reduce(
    (parts, category) => {
      const start = parts.total;
      const end =
        start + (totalSpent ? (category.amount / totalSpent) * 100 : 0);
      parts.segments.push(`${category.color} ${start}% ${end}%`);
      parts.total = end;
      return parts;
    },
    { total: 0, segments: [] as string[] },
  );

  const months = [...overviewMonthOptions].reverse().map((month) => {
    const key = month.key;
    const walletAmount = manualCards.reduce(
      (sum, card) =>
        sum +
        readWalletCategories(card.spending_categories, key).reduce(
          (cardSum, category) => cardSum + category.amount,
          0,
        ),
      0,
    );
    return {
      key,
      label: month.label,
      amount:
        [...categoriesForMonth(key).values()].reduce(
          (sum, amount) => sum + amount,
          0,
        ) + walletAmount,
    };
  });
  const highestMonth = Math.max(...months.map((month) => month.amount), 1);

  const merchants = [
    ...selectedMonthTransactions.reduce((map, transaction) => {
      const merchant = transaction.merchantName ?? transaction.name;
      const entry = map.get(merchant) ?? {
        amount: 0,
        category: transaction.category,
      };
      entry.amount += transaction.amount;
      map.set(merchant, entry);
      return map;
    }, new Map<string, { amount: number; category: string }>()),
  ]
    .sort(([, first], [, second]) => second.amount - first.amount)
    .slice(0, 4)
    .map(([name, detail]) => ({ name, ...detail }));

  const categoryShare =
    topCategory && totalSpent
      ? Math.round((topCategory.amount / totalSpent) * 100)
      : 0;
  const insightRows = [
    topCategory
      ? {
          icon: ArrowUpRight,
          title: `${topCategory.label} is your biggest category`,
          body: `${moneyPrecise.format(topCategory.amount)} accounts for ${categoryShare}% of this month's spending.`,
          action: "View category",
          href: "#spending-by-category",
        }
      : null,
    changePercent !== null
      ? {
          icon: changePercent > 0 ? ArrowUpRight : ArrowDownRight,
          title: `Spending is ${Math.abs(changePercent).toFixed(0)}% ${changePercent > 0 ? "higher" : "lower"} than last month`,
          body: `${money.format(totalSpent)} this month compared with ${money.format(previousSpent)} last month.`,
          action: "View trend",
          href: "#spending-overview",
        }
      : null,
    selectedMonthTransactions.length > 0
      ? {
          icon: Check,
          title: `${selectedMonthTransactions.length} transactions analyzed`,
          body: `Your insights are based on Plaid data from connected cards.`,
        }
      : null,
    manualCards && manualCards.length > 0
      ? {
          icon: Check,
          title: `${manualCards.length} Wallet card${manualCards.length === 1 ? "" : "s"} included`,
          body: walletSpending
            ? `${moneyPrecise.format(walletSpending)} from manual spending details is included this month.`
            : "Add monthly spending details in Wallets to include manual-card spending.",
          action: "View cards",
          href: "/wallet",
        }
      : null,
  ].filter((row): row is NonNullable<typeof row> => Boolean(row));

  return (
    <div className="mx-auto max-w-[1280px] pb-10 text-[#172033]">
      <header className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-[15px] text-slate-500">
            Understand your spending patterns and make smarter decisions.
          </p>
        </div>
      </header>

      {transactions.length === 0 && manualCards.length === 0 ? (
        <section className="mt-7 rounded-2xl border border-dashed border-[#9dc8fa] bg-[#f7fbff] px-6 py-16 text-center shadow-sm">
          <ChartNoAxesCombined className="mx-auto h-11 w-11 text-[#1f78ff]" />
          <h2 className="mt-4 text-xl font-semibold">
            Your analytics will appear here
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Connect a credit card in Wallets. Plaid transaction data will
            populate your spending analytics.
          </p>
        </section>
      ) : (
        <>
          <section className="mt-7 grid max-w-sm gap-4">
            <article className="rounded-2xl border border-[#d7e0ed] bg-white p-5 shadow-[0_6px_18px_rgba(38,85,141,0.04)]">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e9f3ff]">
                <DollarSign className="h-5 w-5 text-[#247dff]" />
              </span>
              <p className="mt-4 text-[15px] font-medium text-slate-600">
                Total spending
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight">
                {moneyPrecise.format(currentTotalSpent)}
              </p>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  {currentCalendarMonthName}
                </span>
                {changePercent !== null && (
                  <span
                    className={
                      changePercent <= 0
                        ? "flex items-center text-emerald-600"
                        : "flex items-center text-rose-500"
                    }
                  >
                    {changePercent <= 0 ? (
                      <ArrowDownRight className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                    {Math.abs(changePercent).toFixed(1)}%
                  </span>
                )}
              </div>
            </article>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.9fr_1fr]">
            <article
              id="spending-overview"
              className="analytics-scroll-target scroll-mt-6 rounded-2xl border border-[#dbe3ee] bg-white p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">Spending overview</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Credit-card spending for the past {overviewRange} months
                  </p>
                </div>
                <RangeSelector
                  selectedRange={overviewRange}
                  selectedMonth={selectedMonthKey}
                />
              </div>
              <div className="mt-7 flex h-64 items-end gap-4 border-b border-slate-200 px-5">
                {months.map((month) => (
                  <div
                    key={month.key}
                    className="flex h-full flex-1 flex-col justify-end text-center"
                  >
                    <span className="mb-2 text-[11px] font-medium text-slate-500">
                      {month.amount ? money.format(month.amount) : "—"}
                    </span>
                    <div
                      className="mx-auto w-full max-w-9 rounded-t-md bg-[#2878f0]"
                      style={{
                        height: `${Math.max(month.amount ? (month.amount / highestMonth) * 100 : 2, 2)}%`,
                      }}
                    />
                    <span className="py-3 text-xs text-slate-400">
                      {month.label}
                    </span>
                  </div>
                ))}
              </div>
            </article>
            <article
              id="spending-by-category"
              className="analytics-scroll-target scroll-mt-6 rounded-2xl border border-[#dbe3ee] bg-white p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Spending by category</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {currentMonthName}
                  </p>
                </div>
                <MonthSelector
                  months={monthOptions}
                  selectedMonth={selectedMonthKey}
                  range={overviewRange}
                />
              </div>
              <div className="mt-5 flex items-center justify-center">
                <div
                  className="relative grid h-36 w-36 place-items-center rounded-full"
                  style={{
                    background: donutStops.segments.length
                      ? `conic-gradient(${donutStops.segments.join(",")})`
                      : "#e5edf7",
                  }}
                >
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center">
                    <strong className="text-xl">
                      {money.format(totalSpent)}
                    </strong>
                    <span className="text-xs text-slate-400">total</span>
                  </div>
                </div>
              </div>
              <div className="mt-5 space-y-2.5">
                {categories.map((category) => (
                  <div
                    key={category.key}
                    className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 text-xs"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-slate-600">
                      <i
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="truncate">{category.label}</span>
                    </span>
                    <strong>{moneyPrecise.format(category.amount)}</strong>
                    <span className="w-8 text-right text-slate-400">
                      {Math.round((category.amount / totalSpent) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.9fr_1fr]">
            <article className="rounded-2xl border border-[#dbe3ee] bg-white p-6">
              <h2 className="text-lg font-bold">Smart insights</h2>
              <p className="mt-1 text-sm text-slate-500">
                Personalized recommendations based on this month
              </p>
              <div className="mt-5 space-y-4">
                {insightRows.map((insight) => {
                  const Icon = insight.icon;
                  return (
                    <div
                      key={insight.title}
                      className="flex items-center gap-4"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#e9f3ff]">
                        <Icon className="h-4 w-4 text-[#247dff]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{insight.title}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {insight.body}
                        </p>
                      </div>
                      {insight.action && insight.href && (
                        <InsightLink href={insight.href}>
                          {insight.action} →
                        </InsightLink>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
            <article className="rounded-2xl border border-[#dbe3ee] bg-white p-6">
              <h2 className="text-lg font-bold">Top merchants</h2>
              <p className="mt-1 text-sm text-slate-500">
                Highest spend this month
              </p>
              <div className="mt-5 space-y-4">
                {merchants.map((merchant) => (
                  <div key={merchant.name} className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#e9f3ff] text-xs font-bold text-[#2878f0]">
                      {merchant.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {merchant.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {categoryLabel(merchant.category)}
                      </p>
                    </div>
                    <strong className="text-sm">
                      {moneyPrecise.format(merchant.amount)}
                    </strong>
                  </div>
                ))}
              </div>
            </article>
          </section>

          {manualCards.length > 0 && (
            <section className="mt-6 rounded-2xl border border-[#dbe3ee] bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Wallet cards</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Manual cards saved in your Wallet
                  </p>
                </div>
                <span className="rounded-lg bg-[#e9f3ff] px-2.5 py-1 text-xs font-semibold text-[#2878f0]">
                  {manualCards.length} saved
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {manualCards.map((card) => (
                  <div
                    key={card.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <p className="truncate text-sm font-semibold">
                      {card.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      •••• {card.last_four}
                    </p>
                    <div className="mt-4 flex justify-between text-xs text-slate-500">
                      <span>Current balance</span>
                      <strong className="text-slate-800">
                        {moneyPrecise.format(Number(card.current_balance) || 0)}
                      </strong>
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-slate-500">
                      <span>Credit limit</span>
                      <strong className="text-slate-800">
                        {moneyPrecise.format(Number(card.credit_limit) || 0)}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
