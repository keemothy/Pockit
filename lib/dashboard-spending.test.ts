/* eslint-disable @typescript-eslint/no-require-imports -- Node runs this TypeScript test directly. */
const assert: typeof import("node:assert/strict") = require("node:assert/strict");
const test: typeof import("node:test") = require("node:test");
const {
  calculateMonthlySpending,
  getCalendarMonthRange,
  getTransactionsForMonth,
  groupSpendingByCategory,
  groupSpendingByMonth,
} = require("./dashboard-spending.ts") as typeof import("./dashboard-spending");

const july = getCalendarMonthRange(2026, 7);
const transactions = [
  { id: "dining", amount: 120.25, date: "2026-07-01", category: "FOOD_AND_DRINK" },
  { id: "travel", amount: 264.2, date: "2026-07-31", category: "TRAVEL" },
  { id: "deposit", amount: -500, date: "2026-07-04", category: "INCOME" },
  { id: "refund", amount: -12, date: "2026-07-09", category: "GENERAL_MERCHANDISE" },
  { id: "transfer", amount: 70, date: "2026-07-10", category: "TRANSFER_OUT" },
  { id: "pending", amount: 30, date: "2026-07-10", category: "ENTERTAINMENT", pending: true },
  { id: "august", amount: 10, date: "2026-08-01", category: "OTHER" },
];

test("July spending is nonzero and category totals equal the monthly total", () => {
  const julyTransactions = getTransactionsForMonth(transactions, july);
  const total = calculateMonthlySpending(julyTransactions);
  const categories = groupSpendingByCategory(julyTransactions);
  assert.equal(total, 384.45);
  assert.equal(categories.reduce((sum, category) => sum + category.amount, 0), total);
});

test("income, refunds, transfers, and pending duplicates are excluded", () => {
  assert.equal(calculateMonthlySpending(getTransactionsForMonth(transactions, july)), 384.45);
});

test("calendar month boundaries are date-only and trend agrees with the July card", () => {
  const june = getCalendarMonthRange(2026, 6);
  const august = getCalendarMonthRange(2026, 8);
  const trend = groupSpendingByMonth(transactions, [june, july, august]);
  assert.deepEqual(trend.map((month) => month.key), ["2026-06", "2026-07", "2026-08"]);
  assert.equal(trend[1].amount, calculateMonthlySpending(getTransactionsForMonth(transactions, july)));
  assert.equal(trend[2].amount, 10);
});
