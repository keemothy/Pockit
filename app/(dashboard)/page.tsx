import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPlaidEnvironment, type PlaidEnvironment } from "@/lib/plaid";
import { getPlaidAnalyticsTransactions } from "@/lib/plaid-analytics";
import { calculateMonthlySpending, getCalendarMonthRange, getCurrentCalendarMonth, getTransactionsForMonth, groupSpendingByCategory, groupSpendingByMonth, isEligibleSpendingTransaction, normalizedCategory } from "@/lib/dashboard-spending";
import DashboardContent, { type DashboardData, type WidgetId } from "./dashboard-content";

const categoryNames: Record<string, string> = {
  FOOD_AND_DRINK: "Dining", GENERAL_MERCHANDISE: "Shopping", TRANSPORTATION: "Transit",
  TRAVEL: "Travel", ENTERTAINMENT: "Entertainment", GAS_STATIONS: "Gas", HOME_IMPROVEMENT: "Home",
  PERSONAL_CARE: "Personal care", HEALTH_AND_FITNESS: "Health", RENT_AND_UTILITIES: "Utilities",
  GENERAL_SERVICES: "Services", EDUCATION: "Education", OTHER: "Other",
};
const defaultOrder: WidgetId[] = ["total-balance", "monthly-spending", "subscription-spending", "category", "trend", "recent-transactions"];

type ManualSpendingEntry = { month: string; label: string; amount: number };

function activeItemEnvironments(metadata: Record<string, unknown>) {
  const environments = metadata.plaid_item_environments;
  if (!environments || typeof environments !== "object" || Array.isArray(environments)) return {} as Record<string, PlaidEnvironment>;
  return environments as Record<string, PlaidEnvironment>;
}
function validOrder(value: unknown): WidgetId[] {
  if (!Array.isArray(value)) return defaultOrder;
  const values = value.filter((id): id is WidgetId => typeof id === "string" && defaultOrder.includes(id as WidgetId));
  return [...values, ...defaultOrder.filter((id) => !values.includes(id))];
}

function readDashboardPreferences(metadata: Record<string, unknown>) {
  const value = metadata.dashboard_preferences;
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function readManualSpending(value: unknown, currentMonth: string): ManualSpendingEntry[] {
  const monthlyCategories = Array.isArray(value)
    ? [[currentMonth, value] as const]
    : value && typeof value === "object"
      ? Object.entries(value as Record<string, unknown>)
      : [];

  return monthlyCategories.flatMap(([month, categories]) => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !Array.isArray(categories)) {
      return [];
    }
    return categories.flatMap((category) => {
      if (!category || typeof category !== "object") return [];
      const candidate = category as Record<string, unknown>;
      return typeof candidate.label === "string" && candidate.label.trim() &&
        typeof candidate.amount === "number" && Number.isFinite(candidate.amount) && candidate.amount > 0
        ? [{ month, label: normalizedCategory(candidate.label), amount: candidate.amount }]
        : [];
    });
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: accounts, error: accountsError }, { data: subscriptions, error: subscriptionsError }, { data: databasePreferences }, { data: manualCards, error: manualCardsError }] = await Promise.all([
    supabase.from("financial_accounts").select("id, plaid_item_id, plaid_account_id, current_balance, type").eq("user_id", user.id),
    supabase.from("subscriptions").select("amount, last_charged_on").eq("user_id", user.id).eq("status", "active"),
    supabase.from("dashboard_preferences").select("widget_order, hidden_widgets").eq("user_id", user.id).maybeSingle(),
    supabase.from("manual_cards").select("current_balance, spending_categories").eq("user_id", user.id),
  ]);

  const errors = [accountsError, subscriptionsError, manualCardsError].filter(Boolean);
  const userMetadata = user.user_metadata as Record<string, unknown>;
  const preferences = databasePreferences ?? readDashboardPreferences(userMetadata);
  const environments = activeItemEnvironments(userMetadata);
  const activeEnvironment = getPlaidEnvironment();
  const activeAccounts = (accounts ?? []).filter((account) => account.type?.toLowerCase() === "credit" && environments[account.plaid_item_id] === activeEnvironment);
  const transactions = errors.length === 0 ? await getPlaidAnalyticsTransactions(user.id, activeAccounts.map((account) => ({ plaidItemId: account.plaid_item_id, plaidAccountId: account.plaid_account_id })), 200).catch(() => []) : [];
  const currentMonth = getCurrentCalendarMonth();
  const monthTransactions = getTransactionsForMonth(transactions, currentMonth);
  const manualSpending = (manualCards ?? []).flatMap((card) =>
    readManualSpending(card.spending_categories, currentMonth.key),
  );
  const manualMonthTotals = manualSpending.reduce((totals, entry) => {
    totals.set(entry.month, (totals.get(entry.month) ?? 0) + entry.amount);
    return totals;
  }, new Map<string, number>());
  const monthlySpending = calculateMonthlySpending(monthTransactions) +
    (manualMonthTotals.get(currentMonth.key) ?? 0);
  const categoryTotals = new Map(
    groupSpendingByCategory(monthTransactions).map((category) => [category.label, category.amount]),
  );
  for (const entry of manualSpending.filter((entry) => entry.month === currentMonth.key)) {
    categoryTotals.set(entry.label, (categoryTotals.get(entry.label) ?? 0) + entry.amount);
  }
  const categories = [...categoryTotals]
    .map(([label, amount]) => ({ label, amount }))
    .sort((first, second) => second.amount - first.amount);
  const sixMonthRanges = Array.from({ length: 6 }, (_, index) => {
    const offset = 5 - index;
    const month = Number(currentMonth.key.slice(5, 7));
    const year = Number(currentMonth.key.slice(0, 4));
    const date = new Date(Date.UTC(year, month - 1 - offset, 1));
    return getCalendarMonthRange(date.getUTCFullYear(), date.getUTCMonth() + 1);
  });
  const sixMonths = groupSpendingByMonth(transactions, sixMonthRanges).map((month) => ({
    key: month.key,
    label: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(new Date(`${month.key}-01T12:00:00Z`)),
    amount: month.amount + (manualMonthTotals.get(month.key) ?? 0),
  }));
  const hidden = Array.isArray(preferences?.hidden_widgets) ? preferences.hidden_widgets.filter((id): id is WidgetId => typeof id === "string" && defaultOrder.includes(id as WidgetId)) : [];
  const data: DashboardData = {
    totalBalance: activeAccounts.reduce((total, account) => total + (Number(account.current_balance) || 0), 0) +
      (manualCards ?? []).reduce((total, card) => total + (Number(card.current_balance) || 0), 0),
    monthlySpending,
    subscriptionSpending: (subscriptions ?? []).filter((subscription) => subscription.last_charged_on && subscription.last_charged_on >= currentMonth.start && subscription.last_charged_on < currentMonth.end).reduce((total, subscription) => total + Number(subscription.amount), 0),
    categories,
    months: sixMonths,
    transactions: transactions.filter(isEligibleSpendingTransaction).slice(0, 6).map((transaction) => ({ id: transaction.id, name: transaction.merchantName ?? transaction.name, amount: transaction.amount, date: transaction.date, category: categoryNames[transaction.category] ?? normalizedCategory(transaction.category) })),
    hasAccounts: activeAccounts.length > 0 || (manualCards ?? []).length > 0,
    hasTransactions: transactions.length > 0 || manualSpending.length > 0,
    error: errors.length ? "We couldn’t load your financial data. Please try again." : null,
    preferenceUnavailable: false,
  };
  return <DashboardContent data={data} initialOrder={validOrder(preferences?.widget_order)} initialHidden={hidden} />;
}
