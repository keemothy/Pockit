import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import WalletDashboard, { type ConnectedPlaidBank, type WalletCard } from './wallet-dashboard';
import { displayCatalogCardName, findCatalogCard, getCardCatalog } from '@/lib/rewards/card-catalog';
import { getRewardRulesForCard } from '@/lib/rewards/reward-rules';
import { getSpendingCategories } from '@/lib/plaid-spending';
import { getPlaidEnvironment, type PlaidEnvironment } from '@/lib/plaid';
import { restoreLegacyPlaidItemEnvironment } from '@/lib/plaid-item-environment';

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

function readManualCategoryList(value: unknown) {
  if (!Array.isArray(value)) return [] as WalletCard['categories'];
  const totals = new Map<string, number>();
  for (const category of value) {
    if (!category || typeof category !== 'object') return [];
    const candidate = category as Record<string, unknown>;
    if (typeof candidate.label !== 'string' || typeof candidate.amount !== 'number' || candidate.amount <= 0) continue;
    totals.set(candidate.label, (totals.get(candidate.label) ?? 0) + candidate.amount);
  }
  return [...totals.entries()].map(([label, amount], index) => ({
    label,
    amount,
    color: categoryColors[index % categoryColors.length],
  }));
}

function readManualCategories(value: unknown) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  if (Array.isArray(value)) return { [currentMonth]: readManualCategoryList(value) };
  if (!value || typeof value !== 'object') return {} as Record<string, WalletCard['categories']>;
  return Object.fromEntries(Object.entries(value).flatMap(([month, categories]) => (
    /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? [[month, readManualCategoryList(categories)]] : []
  )));
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

  const { data: accounts } = await supabase
    .from('financial_accounts')
    .select('id, plaid_item_id, plaid_account_id, name, official_name, type, subtype, mask, current_balance, available_balance, credit_limit, iso_currency_code')
    .eq('user_id', user.id)
    .order('name');

  const { data: manualCards } = await supabase
    .from('manual_cards')
    .select('id, name, last_four, current_balance, credit_limit, spending_categories, catalog_card_id')
    .eq('user_id', user.id)
    .order('created_at');

  const itemEnvironments = await restoreLegacyPlaidItemEnvironment(
    user.id,
    (accounts ?? []).map((account) => account.plaid_item_id),
    activePlaidEnvironment,
    plaidItemEnvironments,
  ).catch(() => plaidItemEnvironments);
  const activeAccounts = (accounts ?? []).filter(
    (account) => itemEnvironments[account.plaid_item_id] === activePlaidEnvironment,
  );
  const creditCardAccounts = activeAccounts.filter((account) => account.type?.toLowerCase() === 'credit');
  // Only credit cards belong in Wallets. Older connections can still have
  // checking or savings rows stored, but they must not appear as card links.
  const connectedBanks = Object.values(creditCardAccounts.reduce<Record<string, ConnectedPlaidBank>>(
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

  const connectedCards: WalletCard[] = creditCardAccounts.map((account, index) => {
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

    const spendingByMonth = new Map<string, Map<string, number>>();
    for (const transaction of spendingCategories) {
      if (transaction.accountId !== account.plaid_account_id) continue;
      const category = displayCategory(transaction.primaryCategory);
      const spendingByCategory = spendingByMonth.get(transaction.month) ?? new Map<string, number>();
      spendingByCategory.set(
        category,
        (spendingByCategory.get(category) ?? 0) + transaction.amount,
      );
      spendingByMonth.set(transaction.month, spendingByCategory);
    }
    const monthlyCategories = Object.fromEntries([...spendingByMonth.entries()].map(([month, spendingByCategory]) => [
      month,
      [...spendingByCategory.entries()]
        .sort(([, amountA], [, amountB]) => amountB - amountA)
        .map(([category, amount], categoryIndex) => ({
          label: category,
          amount,
          color: categoryColors[categoryIndex % categoryColors.length],
        })),
    ]));
    const categories = monthlyCategories[new Date().toISOString().slice(0, 7)] ?? [];

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
      monthlyCategories,
    };
  });

  const savedManualCards: WalletCard[] = (manualCards ?? []).map((card, index) => {
    const catalogCard = card.catalog_card_id ? catalog.find((catalogEntry) => catalogEntry.cardId === card.catalog_card_id) : undefined;
    const rules = getRewardRulesForCard(catalogCard?.cardId);
    const catalogRewardDetails = rules.map((rule) => ({
      label: rule.category.replace(/-/g, ' '),
      multiplier: rule.multiplier,
      rewardCurrency: rule.rewardCurrency,
    }));
    if (catalogRewardDetails.length === 0 && catalogCard?.universalCashbackPercent) {
      catalogRewardDetails.push({ label: 'base rewards', multiplier: catalogCard.universalCashbackPercent, rewardCurrency: 'CASH_BACK' });
    }
    const hasRewardOverride = Object.hasOwn(rewardOverrides, card.id);
    const monthlyCategories = readManualCategories(card.spending_categories);
    const categories = monthlyCategories[new Date().toISOString().slice(0, 7)] ?? [];
    return {
      id: card.id,
      name: catalogCard ? displayCatalogCardName(catalogCard) : card.name,
      issuer: 'CREDIT CARD',
      lastFour: card.last_four,
      cardholderName,
      currentBalance: Math.max(Number(card.current_balance) || 0, 0),
      limit: Math.max(Number(card.credit_limit) || 1, 1),
      color: index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'rainbow' : 'black',
      rewardDetails: hasRewardOverride ? rewardOverrides[card.id] : catalogRewardDetails,
      rewardsMatched: Boolean(catalogCard) || hasRewardOverride,
      catalogCardId: catalogCard?.cardId,
      hasSpendingData: categories.length > 0,
      categories,
      monthlyCategories,
      isManual: true,
    };
  });

  const cards = [...connectedCards, ...savedManualCards];

  return (
    <WalletDashboard
      key={cards.map((card) => `${card.id}:${card.name}:${JSON.stringify(card.monthlyCategories ?? card.categories)}`).join('|')}
      initialCards={cards}
      cardholderName={cardholderName}
      hasConnectedNonCreditAccounts={activeAccounts.some(
        (account) => account.type?.toLowerCase() !== 'credit',
      )}
      connectedBanks={connectedBanks}
    />
  );
}
