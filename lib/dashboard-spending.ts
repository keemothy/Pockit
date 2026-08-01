/** Shared dashboard rules. Plaid supplies transaction dates as `YYYY-MM-DD`,
 * so all comparisons remain date-only and are not shifted by a JS timezone. */
export type SpendingTransaction = {
  id: string;
  amount: number;
  date: string;
  category: string;
  pending?: boolean;
};

export type CalendarMonthRange = { key: string; start: string; end: string };

const NON_SPENDING_CATEGORIES = new Set([
  "INCOME", "TRANSFER_IN", "TRANSFER_OUT", "LOAN_PAYMENTS", "BANK_FEES",
]);

export function getCalendarMonthRange(year: number, month: number): CalendarMonthRange {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return { key: start.slice(0, 7), start, end: `${nextYear}-${String(nextMonth).padStart(2, "0")}-01` };
}

export function getCurrentCalendarMonth(timeZone = "America/Los_Angeles", now = new Date()): CalendarMonthRange {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit" }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return getCalendarMonthRange(year, month);
}

export function isEligibleSpendingTransaction(transaction: SpendingTransaction) {
  // Plaid represents card purchases as positive amounts; income/refunds are
  // negative. Pending entries are omitted to avoid a pending/posted duplicate.
  return Number.isFinite(transaction.amount) && transaction.amount > 0 && !transaction.pending && !NON_SPENDING_CATEGORIES.has(transaction.category);
}

export function getTransactionsForMonth<T extends SpendingTransaction>(transactions: T[], range: CalendarMonthRange) {
  return transactions.filter((transaction) => transaction.date >= range.start && transaction.date < range.end);
}

export function calculateMonthlySpending<T extends SpendingTransaction>(transactions: T[]) {
  return transactions.filter(isEligibleSpendingTransaction).reduce((total, transaction) => total + transaction.amount, 0);
}

export function normalizedCategory(category: string | null | undefined) {
  if (!category || category === "OTHER") return "Other";
  return category.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function groupSpendingByCategory<T extends SpendingTransaction>(transactions: T[]) {
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    if (!isEligibleSpendingTransaction(transaction)) continue;
    const category = normalizedCategory(transaction.category);
    totals.set(category, (totals.get(category) ?? 0) + transaction.amount);
  }
  return [...totals].map(([label, amount]) => ({ label, amount })).sort((first, second) => second.amount - first.amount);
}

export function groupSpendingByMonth<T extends SpendingTransaction>(transactions: T[], months: CalendarMonthRange[]) {
  return months.map((month) => ({ ...month, amount: calculateMonthlySpending(getTransactionsForMonth(transactions, month)) }));
}
