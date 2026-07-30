import { createAdminClient } from '@/lib/supabase/admin';
import { decryptAccessToken } from '@/lib/plaid-crypto';
import { hasPlaidCredentials, plaidClient } from '@/lib/plaid';
import { PersonalFinanceCategoryVersion } from 'plaid';

export type SpendingCategory = {
  accountId: string;
  primaryCategory: string;
  amount: number;
};

type CreditAccount = {
  plaidAccountId: string;
  plaidItemId: string;
};

function isoDateMonthStart() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * Fetches Plaid transactions only for the current request, then immediately
 * aggregates them. Raw transactions are never written to our database.
 */
export async function getSpendingCategories(
  userId: string,
  accounts: CreditAccount[],
): Promise<SpendingCategory[]> {
  if (!hasPlaidCredentials() || accounts.length === 0) return [];

  const accountsByItem = Map.groupBy(accounts, (account) => account.plaidItemId);
  const admin = createAdminClient();
  const { data: items, error } = await admin
    .from('plaid_items')
    .select('id, access_token_ciphertext, access_token_iv, access_token_auth_tag')
    .eq('user_id', userId)
    .in('id', [...accountsByItem.keys()]);

  if (error || !items) return [];

  const totals = new Map<string, number>();
  await Promise.all(items.map(async (item) => {
    const linkedAccounts = accountsByItem.get(item.id) ?? [];
    try {
      const accessToken = decryptAccessToken({
        ciphertext: item.access_token_ciphertext,
        iv: item.access_token_iv,
        authTag: item.access_token_auth_tag,
      });

      const response = await plaidClient.transactionsGet({
        access_token: accessToken,
        // The wallet donut is a calendar-month summary, not a rolling window.
        start_date: isoDateMonthStart(),
        end_date: new Date().toISOString().slice(0, 10),
        options: {
          account_ids: linkedAccounts.map((account) => account.plaidAccountId),
          include_original_description: false,
          personal_finance_category_version: PersonalFinanceCategoryVersion.V2,
        },
      });

      // Development-only inspection aid. Transactions remain in memory and
      // are never persisted; do not enable this log in production.
      if (process.env.NODE_ENV !== 'production') {
        console.info('Plaid Wallet transactions response', {
          plaidItemId: item.id,
          requestedAccountIds: linkedAccounts.map((account) => account.plaidAccountId),
          totalTransactions: response.data.total_transactions,
          transactions: response.data.transactions,
        });
      }

      for (const transaction of response.data.transactions) {
        if (transaction.amount <= 0) continue;
        const category = transaction.personal_finance_category?.primary ?? 'OTHER';
        const key = `${transaction.account_id}:${category}`;
        totals.set(key, (totals.get(key) ?? 0) + transaction.amount);
      }
    } catch (error) {
      // One institution can still be preparing Transactions data. Do not let
      // that suppress spending summaries for the user's other connected cards.
      if (process.env.NODE_ENV !== 'production') {
        console.info('Plaid Wallet skipped an unavailable connection', {
          plaidItemId: item.id,
          message: error instanceof Error ? error.message : 'Unknown Plaid error',
        });
      }
    }
  }));

  const categories = [...totals.entries()].map(([key, amount]) => {
    const separator = key.indexOf(':');
    return {
      accountId: key.slice(0, separator),
      primaryCategory: key.slice(separator + 1),
      amount,
    };
  });

  if (process.env.NODE_ENV !== 'production') {
    console.info('Plaid Wallet category totals', categories);
  }

  return categories;
}
