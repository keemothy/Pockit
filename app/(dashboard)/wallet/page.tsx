import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import WalletDashboard, { type WalletCard } from './wallet-dashboard';
import { findCatalogCard, getCardCatalog } from '@/lib/rewards/card-catalog';
import { getRewardRulesForCard } from '@/lib/rewards/reward-rules';
import { getSpendingCategories } from '@/lib/plaid-spending';

const categoryColors = ['#2184c7', '#ff9a57', '#9747ba', '#aac437', '#efc93c', '#ff626a'];

type RewardDetail = WalletCard['rewardDetails'][number];

function readRewardOverrides(metadata: Record<string, unknown>) {
  const value = metadata.card_reward_overrides;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {} as Record<string, RewardDetail[]>;

  return Object.fromEntries(
    Object.entries(value).flatMap(([cardId, rules]) => {
      if (!Array.isArray(rules)) return [];
      const validRules = rules.flatMap((rule) => {
        if (!rule || typeof rule !== 'object') return [];
        const candidate = rule as Record<string, unknown>;
        if (typeof candidate.label !== 'string' || typeof candidate.multiplier !== 'number') return [];
        return [{
          label: candidate.label,
          multiplier: candidate.multiplier,
          rewardCurrency: typeof candidate.rewardCurrency === 'string' ? candidate.rewardCurrency : 'POINTS',
        }];
      });
      return [[cardId, validRules]];
    }),
  );
}

const categoryLabels: Record<string, string> = {
  FOOD_AND_DRINK: 'Dining',
  TRAVEL: 'Travel',
  GENERAL_MERCHANDISE: 'Shopping',
  TRANSPORTATION: 'Transit',
  GAS_STATIONS: 'Gas',
  ENTERTAINMENT: 'Entertainment',
  HOME_IMPROVEMENT: 'Home',
};

function displayCategory(category: string) {
  return categoryLabels[category] ?? category
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function WalletPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const userMetadata = user.user_metadata as Record<string, unknown>;
  const cardholderName =
    (typeof userMetadata.full_name === 'string' && userMetadata.full_name.trim()) ||
    (typeof userMetadata.name === 'string' && userMetadata.name.trim()) ||
    user.email?.split('@')[0] ||
    'Pockit member';
  const rewardOverrides = readRewardOverrides(userMetadata);
  const spendingPeriodLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Los_Angeles',
  }).format(new Date());

  const { data: accounts } = await supabase
    .from('financial_accounts')
    .select('id, plaid_item_id, plaid_account_id, name, official_name, type, subtype, mask, current_balance, available_balance, credit_limit, iso_currency_code')
    .eq('user_id', user.id)
    .order('name');

  const creditCardAccounts = (accounts ?? []).filter(
    (account) => account.type?.toLowerCase() === 'credit',
  );

  const spendingCategories = await getSpendingCategories(
    user.id,
    creditCardAccounts.map((account) => ({
      plaidAccountId: account.plaid_account_id,
      plaidItemId: account.plaid_item_id,
    })),
  ).catch(() => []);

  const catalog = await getCardCatalog().catch(() => []);

  const cards: WalletCard[] = creditCardAccounts.map((account, index) => {
    const balance = Math.max(Number(account.current_balance) || 0, 0);
    const available = Math.max(Number(account.available_balance) || 0, 0);
    const reportedLimit = Math.max(Number(account.credit_limit) || 0, 0);
    const limit = reportedLimit || balance + available || Math.max(balance, 1);
    const catalogCard = findCatalogCard([account.name, account.official_name], catalog);
    const rules = getRewardRulesForCard(catalogCard?.cardId);
    const catalogRewardDetails = rules.map((rule) => ({
      label: rule.category.replace(/-/g, ' '),
      multiplier: rule.multiplier,
      rewardCurrency: rule.rewardCurrency,
    }));

    if (catalogRewardDetails.length === 0 && catalogCard?.universalCashbackPercent) {
      catalogRewardDetails.push({
        label: 'base rewards',
        multiplier: catalogCard.universalCashbackPercent,
        rewardCurrency: 'CASH_BACK',
      });
    }
    const hasRewardOverride = Object.hasOwn(rewardOverrides, account.id);
    const rewardDetails = hasRewardOverride ? rewardOverrides[account.id] : catalogRewardDetails;

    const spendingByCategory = new Map<string, number>();
    for (const transaction of spendingCategories) {
      if (transaction.accountId !== account.plaid_account_id) continue;
      const category = displayCategory(transaction.primaryCategory);
      spendingByCategory.set(
        category,
        (spendingByCategory.get(category) ?? 0) + transaction.amount,
      );
    }
    const categories = [...spendingByCategory.entries()]
      .sort(([, amountA], [, amountB]) => amountB - amountA)
      .map(([category, amount], categoryIndex) => ({
        label: category,
        amount,
        color: categoryColors[categoryIndex % categoryColors.length],
      }));

    return {
      id: account.id,
      name: account.name,
      issuer: (account.subtype ?? account.type ?? 'CONNECTED ACCOUNT').toUpperCase(),
      lastFour: account.mask ?? '••••',
      cardholderName,
      currentBalance: balance,
      limit,
      color: index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'rainbow' : 'black',
      rewardDetails,
      rewardsMatched: Boolean(catalogCard) || hasRewardOverride,
      hasSpendingData: categories.length > 0,
      categories,
    };
  });

  return (
    <WalletDashboard
      initialCards={cards}
      cardholderName={cardholderName}
      spendingPeriodLabel={spendingPeriodLabel}
      hasConnectedNonCreditAccounts={(accounts ?? []).some(
        (account) => account.type?.toLowerCase() !== 'credit',
      )}
    />
  );
}
