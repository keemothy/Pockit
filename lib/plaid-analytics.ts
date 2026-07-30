import { createAdminClient } from '@/lib/supabase/admin';
import { decryptAccessToken } from '@/lib/plaid-crypto';
import { hasPlaidCredentials, plaidClient } from '@/lib/plaid';
import { PersonalFinanceCategoryVersion } from 'plaid';

type CreditAccount = { plaidAccountId: string; plaidItemId: string };

export type CategorySpend = {
  label: string;
  amount: number;
  color: string;
  percent: number;
};

export type SubscriptionCandidate = {
  name: string;
  amount: number;
  lastCharged: string;
  detailedCategory: string;
};

const CATEGORY_COLORS = ['#2184c7', '#ff9a57', '#9747ba', '#aac437', '#efc93c', '#ff626a'];

const CATEGORY_LABELS: Record<string, string> = {
  FOOD_AND_DRINK: 'Dining',
  TRAVEL: 'Travel',
  GENERAL_MERCHANDISE: 'Shopping',
  TRANSPORTATION: 'Transit',
  GAS_STATIONS: 'Gas',
  ENTERTAINMENT: 'Entertainment',
  HOME_IMPROVEMENT: 'Home',
  PERSONAL_CARE: 'Personal Care',
  HEALTH_AND_FITNESS: 'Health',
  RENT_AND_UTILITIES: 'Utilities',
  GENERAL_SERVICES: 'Services',
  EDUCATION: 'Education',
  INCOME: 'Income',
  OTHER: 'Other',
};

function labelForCategory(primary: string) {
  return CATEGORY_LABELS[primary] ?? primary
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

async function fetchAllTransactions(
  userId: string,
  accounts: CreditAccount[],
  startDate: string,
  endDate: string,
) {
  if (!hasPlaidCredentials() || accounts.length === 0) return [];

  const accountsByItem = Map.groupBy(accounts, (a) => a.plaidItemId);
  const admin = createAdminClient();
  const { data: items, error } = await admin
    .from('plaid_items')
    .select('id, access_token_ciphertext, access_token_iv, access_token_auth_tag')
    .eq('user_id', userId)
    .in('id', [...accountsByItem.keys()]);

  if (error || !items) return [];

  type TxnRow = {
    transaction_id: string;
    name: string;
    amount: number;
    merchant_name?: string | null;
    date: string;
    account_id: string;
    personal_finance_category?: { primary: string; detailed: string } | null;
  };
  const all: TxnRow[] = [];

  await Promise.all(
    items.map(async (item) => {
      const linked = accountsByItem.get(item.id) ?? [];
      try {
        const accessToken = decryptAccessToken({
          ciphertext: item.access_token_ciphertext,
          iv: item.access_token_iv,
          authTag: item.access_token_auth_tag,
        });
        const response = await plaidClient.transactionsGet({
          access_token: accessToken,
          start_date: startDate,
          end_date: endDate,
          options: {
            account_ids: linked.map((a) => a.plaidAccountId),
            include_original_description: false,
            personal_finance_category_version: PersonalFinanceCategoryVersion.V2,
          },
        });
        all.push(...response.data.transactions);
      } catch {
        // one institution failing should not block others
      }
    }),
  );

  return all;
}

export type PlaidAnalyticsTransaction = {
  id: string;
  accountId: string;
  name: string;
  merchantName: string | null;
  amount: number;
  date: string;
  category: string;
  detailedCategory: string | null;
};

/** Recent, presentation-safe Plaid transactions for the detailed analytics page. */
export async function getPlaidAnalyticsTransactions(
  userId: string,
  accounts: CreditAccount[],
  days = 180,
): Promise<PlaidAnalyticsTransaction[]> {
  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const transactions = await fetchAllTransactions(userId, accounts, startDate, endDate);
  return transactions
    .filter((transaction) => transaction.amount > 0)
    .map((transaction) => ({
      id: transaction.transaction_id,
      accountId: transaction.account_id,
      name: transaction.name,
      merchantName: transaction.merchant_name ?? null,
      amount: transaction.amount,
      date: transaction.date,
      category: transaction.personal_finance_category?.primary ?? "OTHER",
      detailedCategory: transaction.personal_finance_category?.detailed ?? null,
    }))
    .sort((first, second) => second.date.localeCompare(first.date));
}

/** Spending aggregated by primary category for a given date range. */
export async function getSpendingByCategory(
  userId: string,
  accounts: CreditAccount[],
  startDate: string,
  endDate: string,
): Promise<CategorySpend[]> {
  const txns = await fetchAllTransactions(userId, accounts, startDate, endDate);

  const totals = new Map<string, number>();
  for (const txn of txns) {
    if (txn.amount <= 0) continue;
    const cat = txn.personal_finance_category?.primary ?? 'OTHER';
    totals.set(cat, (totals.get(cat) ?? 0) + txn.amount);
  }

  const sorted = [...totals.entries()]
    .filter(([cat]) => cat !== 'INCOME' && cat !== 'TRANSFER_IN')
    .sort(([, a], [, b]) => b - a);

  const grandTotal = sorted.reduce((s, [, v]) => s + v, 0);

  return sorted.map(([cat, amount], i) => ({
    label: labelForCategory(cat),
    amount,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    percent: grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0,
  }));
}

const SUBSCRIPTION_KEYWORDS = [
  'SUBSCRIPTION', 'STREAMING', 'MUSIC', 'AUDIO', 'SOFTWARE',
  'VIDEO', 'GAMING', 'CABLE', 'PHONE',
];

/** Recurring-charge detection: look back 65 days, surface merchants that
 *  billed at least twice with a consistent amount, or whose Plaid detailed
 *  category indicates subscription / streaming services. */
export async function getSubscriptionCandidates(
  userId: string,
  accounts: CreditAccount[],
): Promise<SubscriptionCandidate[]> {
  const endDate  = new Date().toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - 65 * 86_400_000).toISOString().slice(0, 10);

  const txns = await fetchAllTransactions(userId, accounts, startDate, endDate);

  type Group = { dates: string[]; category: string };
  const byMerchantAmount = new Map<string, Group>();

  for (const txn of txns) {
    if (txn.amount <= 0 || !txn.merchant_name) continue;
    const name   = txn.merchant_name.trim();
    const amount = Math.round(txn.amount * 100);
    const key    = `${name}|${amount}`;
    const detail = txn.personal_finance_category?.detailed ?? txn.personal_finance_category?.primary ?? 'OTHER';
    const existing = byMerchantAmount.get(key);
    if (existing) {
      existing.dates.push(txn.date);
    } else {
      byMerchantAmount.set(key, { dates: [txn.date], category: detail });
    }
  }

  const results: SubscriptionCandidate[] = [];

  for (const [key, group] of byMerchantAmount.entries()) {
    const isRecurring = group.dates.length >= 2;
    const isSubCategory = SUBSCRIPTION_KEYWORDS.some((kw) =>
      group.category.toUpperCase().includes(kw),
    );
    if (!isRecurring && !isSubCategory) continue;

    const [name, amountCents] = key.split('|');
    results.push({
      name,
      amount: Number(amountCents) / 100,
      lastCharged: group.dates.reduce((a, b) => (a > b ? a : b)),
      detailedCategory: group.category,
    });
  }

  return results.sort((a, b) => b.amount - a.amount);
}
