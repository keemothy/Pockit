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

function isoDateDaysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
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
        // Plaid supports a 90-day history window; keep Wallet aligned with it.
        start_date: isoDateDaysAgo(90),
        end_date: new Date().toISOString().slice(0, 10),
        options: {
          account_ids: linkedAccounts.map((account) => account.plaidAccountId),
          include_original_description: false,
          personal_finance_category_version: PersonalFinanceCategoryVersion.V2,
        },
      });

      for (const transaction of response.data.transactions) {
        if (transaction.amount <= 0) continue;
        const category = transaction.personal_finance_category?.primary ?? 'OTHER';
        const key = `${transaction.account_id}:${category}`;
        totals.set(key, (totals.get(key) ?? 0) + transaction.amount);
      }
    } catch {
      // One institution can still be preparing Transactions data. Do not let
      // that suppress spending summaries for the user's other connected cards.
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

  return categories;
}
