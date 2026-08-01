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

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: accounts, error: accountsError }, { data: subscriptions, error: subscriptionsError }, { data: preferences, error: preferencesError }] = await Promise.all([
    supabase.from("financial_accounts").select("id, plaid_item_id, plaid_account_id, current_balance, type").eq("user_id", user.id),
    supabase.from("subscriptions").select("amount, last_charged_on").eq("user_id", user.id).eq("status", "active"),
    supabase.from("dashboard_preferences").select("widget_order, hidden_widgets").eq("user_id", user.id).maybeSingle(),
  ]);

  const errors = [accountsError, subscriptionsError].filter(Boolean);
  // A missing migration should not prevent the core dashboard from loading.
  const preferenceUnavailable = Boolean(preferencesError && preferencesError.code !== "PGRST116");
  const environments = activeItemEnvironments(user.user_metadata as Record<string, unknown>);
  const activeEnvironment = getPlaidEnvironment();
  const activeAccounts = (accounts ?? []).filter((account) => account.type?.toLowerCase() === "credit" && environments[account.plaid_item_id] === activeEnvironment);
  const transactions = errors.length === 0 ? await getPlaidAnalyticsTransactions(user.id, activeAccounts.map((account) => ({ plaidItemId: account.plaid_item_id, plaidAccountId: account.plaid_account_id })), 200).catch(() => []) : [];
  const currentMonth = getCurrentCalendarMonth();
  const monthTransactions = getTransactionsForMonth(transactions, currentMonth);
  const monthlySpending = calculateMonthlySpending(monthTransactions);
  const categories = groupSpendingByCategory(monthTransactions);
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
    amount: month.amount,
  }));
  const hidden = Array.isArray(preferences?.hidden_widgets) ? preferences.hidden_widgets.filter((id): id is WidgetId => typeof id === "string" && defaultOrder.includes(id as WidgetId)) : [];
  const data: DashboardData = {
    totalBalance: activeAccounts.reduce((total, account) => total + (Number(account.current_balance) || 0), 0),
    monthlySpending,
    subscriptionSpending: (subscriptions ?? []).filter((subscription) => subscription.last_charged_on && subscription.last_charged_on >= currentMonth.start && subscription.last_charged_on < currentMonth.end).reduce((total, subscription) => total + Number(subscription.amount), 0),
    categories,
    months: sixMonths,
    transactions: transactions.filter(isEligibleSpendingTransaction).slice(0, 6).map((transaction) => ({ id: transaction.id, name: transaction.merchantName ?? transaction.name, amount: transaction.amount, date: transaction.date, category: categoryNames[transaction.category] ?? normalizedCategory(transaction.category) })),
    hasAccounts: activeAccounts.length > 0,
    hasTransactions: transactions.length > 0,
    error: errors.length ? "We couldn’t load your financial data. Please try again." : null,
    preferenceUnavailable,
  };
  return <DashboardContent data={data} initialOrder={validOrder(preferences?.widget_order)} initialHidden={hidden} />;
}
