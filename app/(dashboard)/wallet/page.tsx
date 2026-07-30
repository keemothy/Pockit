import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import WalletDashboard, { type ConnectedPlaidBank, type WalletCard } from './wallet-dashboard';
import { displayCatalogCardName, findCatalogCard, getCardCatalog } from '@/lib/rewards/card-catalog';
import { getRewardRulesForCard } from '@/lib/rewards/reward-rules';
import { getSpendingCategories } from '@/lib/plaid-spending';
import { getPlaidEnvironment, type PlaidEnvironment } from '@/lib/plaid';

const categoryColors = ['#2184c7', '#ff9a57', '#9747ba', '#aac437', '#efc93c', '#ff626a'];

type RewardDetail = WalletCard['rewardDetails'][number];

type CardIdentityOverride = {
  cardId: string;
};

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

function readCardIdentityOverrides(metadata: Record<string, unknown>) {
  const value = metadata.card_identity_overrides;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {} as Record<string, CardIdentityOverride>;
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([accountId, identity]) => {
      if (!identity || typeof identity !== 'object' || Array.isArray(identity)) return [];
      const candidate = identity as Record<string, unknown>;
      return typeof candidate.cardId === 'string' && candidate.cardId.trim()
        ? [[accountId, { cardId: candidate.cardId }]]
        : [];
    }),
  );
}

function readPlaidItemEnvironments(metadata: Record<string, unknown>) {
  const value = metadata.plaid_item_environments;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {} as Record<string, PlaidEnvironment>;
  return Object.fromEntries(Object.entries(value).flatMap(([itemId, environment]) => (
    environment === 'sandbox' || environment === 'development' || environment === 'production'
      ? [[itemId, environment]]
      : []
  )));
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
  const cardIdentityOverrides = readCardIdentityOverrides(userMetadata);
  const plaidItemEnvironments = readPlaidItemEnvironments(userMetadata);
  const activePlaidEnvironment = getPlaidEnvironment();
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

  const activeAccounts = (accounts ?? []).filter(
    (account) => plaidItemEnvironments[account.plaid_item_id] === activePlaidEnvironment,
  );
  const creditCardAccounts = activeAccounts.filter((account) => account.type?.toLowerCase() === 'credit');
  const connectedBanks = Object.values(activeAccounts.reduce<Record<string, ConnectedPlaidBank>>(
    (banks, account) => {
      const existing = banks[account.plaid_item_id];
      banks[account.plaid_item_id] = {
        plaidItemId: account.plaid_item_id,
        name: existing?.name ?? account.official_name ?? account.name,
        accountCount: (existing?.accountCount ?? 0) + 1,
      };
      return banks;
    },
    {},
  ));

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
    const selectedCatalogCardId = cardIdentityOverrides[account.id]?.cardId;
    const catalogCard = selectedCatalogCardId
      ? catalog.find((card) => card.cardId === selectedCatalogCardId)
      : findCatalogCard([account.name, account.official_name], catalog);
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
      plaidItemId: account.plaid_item_id,
      name: catalogCard ? displayCatalogCardName(catalogCard) : account.official_name ?? account.name,
      issuer: (account.subtype ?? account.type ?? 'CONNECTED ACCOUNT').toUpperCase(),
      lastFour: account.mask ?? '••••',
      cardholderName,
      currentBalance: balance,
      limit,
      color: index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'rainbow' : 'black',
      rewardDetails,
      rewardsMatched: Boolean(catalogCard) || hasRewardOverride,
      catalogCardId: catalogCard?.cardId,
      hasSpendingData: categories.length > 0,
      categories,
    };
  });

  return (
    <WalletDashboard
      key={cards.map((card) => `${card.id}:${card.name}:${card.categories.map((category) => `${category.label}-${category.amount}`).join(',')}`).join('|')}
      initialCards={cards}
      cardholderName={cardholderName}
      spendingPeriodLabel={spendingPeriodLabel}
      hasConnectedNonCreditAccounts={activeAccounts.some(
        (account) => account.type?.toLowerCase() !== 'credit',
      )}
      connectedBanks={connectedBanks}
    />
  );
}
