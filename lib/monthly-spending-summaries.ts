import { getPlaidAnalyticsTransactions } from "@/lib/plaid-analytics";
import { createAdminClient } from "@/lib/supabase/admin";

export type SummaryAccount = {
  id: string;
  plaidItemId: string;
  plaidAccountId: string;
};

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Stores completed-month category totals only. Individual merchants and
 * transactions are deliberately never written to this table.
 */
export async function syncCompletedMonthlySpendingSummaries(userId: string, accounts: SummaryAccount[]) {
  if (accounts.length === 0) return;

  const now = new Date();
  const currentMonth = monthKey(now);
  const oldestMonth = monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 12, 1)));
  const accountIds = new Map(accounts.map((account) => [account.plaidAccountId, account.id]));
  const transactions = await getPlaidAnalyticsTransactions(userId, accounts, 400);
  const totals = new Map<string, { financialAccountId: string; month: string; category: string; amount: number }>();

  for (const transaction of transactions) {
    const month = transaction.date.slice(0, 7);
    const financialAccountId = accountIds.get(transaction.accountId);
    if (!financialAccountId || month >= currentMonth || month < oldestMonth) continue;
    const key = `${financialAccountId}:${month}:${transaction.category}`;
    const current = totals.get(key);
    if (current) current.amount += transaction.amount;
    else totals.set(key, { financialAccountId, month, category: transaction.category, amount: transaction.amount });
  }

  if (totals.size === 0) return;
  const admin = createAdminClient();
  const { error } = await admin.from("monthly_spending_summaries").upsert(
    [...totals.values()].map((row) => ({
      user_id: userId,
      financial_account_id: row.financialAccountId,
      month: row.month,
      category: row.category,
      amount: row.amount,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "user_id,financial_account_id,month,category" },
  );
  if (error) throw error;
}
