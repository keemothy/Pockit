import { createAdminClient } from '@/lib/supabase/admin';
import { decryptAccessToken } from '@/lib/plaid-crypto';
import { hasPlaidCredentials, plaidClient } from '@/lib/plaid';
import { PersonalFinanceCategoryVersion } from 'plaid';

export type SpendingCategory = {
  accountId: string;
  primaryCategory: string;
  month: string;
  amount: number;
};

type CreditAccount = {
  plaidAccountId: string;
  plaidItemId: string;
};

function isoDateThreeMonthStart() {
  const date = new Date();
  date.setUTCMonth(date.getUTCMonth() - 2, 1);
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
        // Fetch the current calendar month and the two preceding calendar months.
        start_date: isoDateThreeMonthStart(),
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
        const month = transaction.date.slice(0, 7);
        const key = `${transaction.account_id}:${month}:${category}`;
        totals.set(key, (totals.get(key) ?? 0) + transaction.amount);
      }
    } catch {
      // One institution can still be preparing Transactions data. Do not let
      // that suppress spending summaries for the user's other connected cards.
    }
  }));

  const categories = [...totals.entries()].map(([key, amount]) => {
    const firstSeparator = key.indexOf(':');
    const secondSeparator = key.indexOf(':', firstSeparator + 1);
    return {
      accountId: key.slice(0, firstSeparator),
      month: key.slice(firstSeparator + 1, secondSeparator),
      primaryCategory: key.slice(secondSeparator + 1),
      amount,
    };
  });

  return categories;
}
