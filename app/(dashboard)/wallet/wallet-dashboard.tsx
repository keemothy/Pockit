'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, ChevronUp, Landmark, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { getRewardRulesForCard } from '@/lib/rewards/reward-rules';

export type WalletCard = {
  id: string;
  plaidItemId?: string;
  name: string;
  issuer: string;
  lastFour: string;
  cardholderName: string;
  currentBalance: number;
  limit: number;
  color: 'blue' | 'rainbow' | 'black';
  rewardDetails: {
    label: string;
    multiplier: number;
    rewardCurrency: string;
  }[];
  rewardsMatched: boolean;
  catalogCardId?: string;
  hasSpendingData: boolean;
  categories: { label: string; amount: number; color: string }[];
  monthlyCategories?: Record<string, { label: string; amount: number; color: string }[]>;
  isManual?: boolean;
};

export type ConnectedPlaidBank = {
  plaidItemId: string;
  name: string;
  accountCount: number;
};

type CatalogCard = { cardId: string; name: string; issuer: string; network: string; universalCashbackPercent: number };
type EditableSpendingCategory = WalletCard['categories'][number] & { month: string };

function displayIssuerName(issuer: string) {
  const trimmedIssuer = issuer.trim();
  if (trimmedIssuer !== trimmedIssuer.toUpperCase()) return trimmedIssuer;
  return trimmedIssuer.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayCatalogCardName(card: CatalogCard) {
  const issuer = displayIssuerName(card.issuer);
  return card.name.toLowerCase().startsWith(issuer.toLowerCase()) ? card.name : `${issuer} ${card.name}`;
}

function cardCatalogMatchesName(card: CatalogCard, value: string) {
  const query = value.trim().toLowerCase();
  return Boolean(query) && [card.name, displayCatalogCardName(card)].some((name) => name.toLowerCase() === query);
}

function cardCatalogMatchesSearch(card: CatalogCard, value: string) {
  const query = value.trim().toLowerCase();
  return !query || [displayCatalogCardName(card), card.name, card.issuer]
    .some((candidate) => candidate.toLowerCase().includes(query));
}

function catalogRewardDetails(card: CatalogCard | undefined) {
  if (!card) return [];
  const rules = getRewardRulesForCard(card.cardId);
  if (rules.length > 0) return rules.map((rule) => ({ label: rule.category.replace(/-/g, ' '), multiplier: rule.multiplier, rewardCurrency: rule.rewardCurrency }));
  return card.universalCashbackPercent ? [{ label: 'base cashback', multiplier: card.universalCashbackPercent, rewardCurrency: 'CASH_BACK' }] : [];
}

const cardBackground: Record<WalletCard['color'], string> = {
  blue: 'linear-gradient(140deg, #030c31 0%, #05255c 38%, #0a9ee6 76%, #03194d 100%)',
  rainbow: 'linear-gradient(135deg, #fff6e6 0%, #f7b9cc 30%, #a581fa 52%, #ffb74d 77%, #ffe45f 100%)',
  black: 'linear-gradient(140deg, #191b22, #44464b 52%, #121317)',
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const rewardCategoryOptions = [
  'Dining', 'Travel', 'Groceries', 'Gas', 'Transit', 'Online shopping',
  'Entertainment', 'Drugstores', 'Streaming', 'Rent and utilities',
  'Loan payments', 'Base rewards', 'Other',
];
const rewardMultiplierOptions = [1, 1.25, 1.5, 2, 3, 4, 5, 6, 10];
const spendingCategoryOptions = [
  'Dining', 'Travel', 'Groceries', 'Gas', 'Transit', 'Online shopping',
  'Entertainment', 'Drugstores', 'Streaming', 'Rent and utilities',
  'Loan payments', 'Personal care', 'Other',
];
const manualCategoryColors = ['#2184c7', '#ff9a57', '#9747ba', '#aac437', '#efc93c', '#ff626a'];

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function recentMonthKeys() {
  const now = new Date();
  return Array.from({ length: 3 }, (_, offset) => {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  });
}

function displayMonth(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
    .format(new Date(year, monthNumber - 1, 1));
}

function cardForMonth(card: WalletCard, month: string): WalletCard {
  const categories = card.monthlyCategories?.[month] ?? (month === currentMonthKey() ? card.categories : []);
  return { ...card, categories, hasSpendingData: categories.length > 0 };
}

function groupCategoriesByMonth(categories: EditableSpendingCategory[]) {
  return categories.reduce<Record<string, WalletCard['categories']>>((monthlyCategories, category, index) => {
    if (category.amount <= 0 || !/^\d{4}-(0[1-9]|1[0-2])$/.test(category.month)) return monthlyCategories;
    const entries = monthlyCategories[category.month] ?? [];
    const existing = entries.find((entry) => entry.label === category.label);
    if (existing) existing.amount += category.amount;
    else entries.push({ label: category.label, amount: category.amount, color: manualCategoryColors[index % manualCategoryColors.length] });
    monthlyCategories[category.month] = entries;
    return monthlyCategories;
  }, {});
}

// The donut center and the unmatched-card fallback both use this one total,
// so the displayed monthly amount cannot drift from the category data.
function monthlySpendingTotal(card: WalletCard) {
  return card.categories.reduce((sum, category) => sum + category.amount, 0);
}

function normalizeRewardCategory(category: string) {
  return category.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function rewardMultiplierForCategory(card: WalletCard, category: string) {
  const normalizedCategory = normalizeRewardCategory(category);
  const exactRate = card.rewardDetails.find(
    (detail) => normalizeRewardCategory(detail.label) === normalizedCategory,
  );
  const baseRate = card.rewardDetails.find(
    (detail) => normalizeRewardCategory(detail.label) === 'baserewards',
  );
  return exactRate?.multiplier ?? baseRate?.multiplier ?? 0;
}

function monthlyRewards(card: WalletCard) {
  return card.categories.flatMap((category) => {
    const multiplier = rewardMultiplierForCategory(card, category.label);
    return multiplier > 0 ? [{
      label: category.label,
      amount: category.amount,
      multiplier,
      points: Math.round(category.amount * multiplier),
    }] : [];
  });
}

function CreditCardVisual({ card, compact = false }: { card: WalletCard; compact?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl text-white shadow-inner ${compact ? 'h-[86px] w-[136px]' : 'h-[150px] w-[240px]'}`}
      style={{ background: cardBackground[card.color] }}
    >
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(124deg, transparent 31%, rgba(255,255,255,.55) 32%, transparent 33%, transparent 52%, rgba(91,228,255,.8) 53%, transparent 54%)' }} />
      <div className={`relative flex h-full flex-col justify-between ${compact ? 'p-2.5' : 'p-4'}`}>
        <div className="flex items-start">
          <span className={`${compact ? 'text-[7px]' : 'text-xs'} font-semibold tracking-wide`}>{card.issuer === 'POCKIT CARD' ? 'CREDIT CARD' : card.issuer}</span>
        </div>
        {!compact && <div className="h-6 w-8 rounded-md bg-gradient-to-br from-stone-300 via-yellow-100 to-stone-400 opacity-90" />}
        {!compact && <p className="font-mono text-xs tracking-[0.18em]">****  ****  ****  {card.lastFour}</p>}
        {!compact && <div className="text-[8px] text-white/75">Card holder<br /><strong className="text-sm text-white">{card.cardholderName}</strong></div>}
      </div>
    </div>
  );
}

function Donut({ card }: { card: WalletCard }) {
  const monthlyTotal = monthlySpendingTotal(card);
  const total = Math.max(monthlyTotal, 1);
  const stops = card.categories.reduce(
    (accumulator, category) => {
      const start = accumulator.total;
      const segment = (category.amount / total) * 100;
      accumulator.parts.push(`${category.color} ${start}% ${start + segment}%`);
      accumulator.total += segment;
      return accumulator;
    },
    { total: 0, parts: [] as string[] },
  );

  const donutBackground = !card.hasSpendingData
    ? '#2184c7'
    : `conic-gradient(${stops.parts.join(', ')})`;

  return (
    <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-full shadow-sm" style={{ background: donutBackground }}>
      <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-center shadow-inner">
        <strong className="text-sm">{money.format(monthlyTotal)}</strong>
      </div>
    </div>
  );
}

type RewardEditorCard = Pick<WalletCard, 'id' | 'name' | 'rewardDetails'>;

export default function WalletDashboard({ initialCards, cardholderName, hasConnectedNonCreditAccounts, connectedBanks }: { initialCards: WalletCard[]; cardholderName: string; hasConnectedNonCreditAccounts: boolean; connectedBanks: ConnectedPlaidBank[] }) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [focusedCardId, setFocusedCardId] = useState(initialCards[0]?.id ?? '');
  const [currentCardId, setCurrentCardId] = useState(initialCards[0]?.id ?? '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageCardsOpen, setIsManageCardsOpen] = useState(false);
  const [areCardPreviewsVisible, setAreCardPreviewsVisible] = useState(true);
  const [name, setName] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [balance, setBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [newCategories, setNewCategories] = useState<EditableSpendingCategory[]>([]);
  const [selectedSpendingMonths, setSelectedSpendingMonths] = useState<Record<string, string>>({});
  const [catalogCards, setCatalogCards] = useState<CatalogCard[]>([]);
  const [cardMatcherCard, setCardMatcherCard] = useState<WalletCard | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [isSavingCardMatch, setIsSavingCardMatch] = useState(false);
  const [cardMatchError, setCardMatchError] = useState('');
  const [isRefreshingSpending, setIsRefreshingSpending] = useState(false);
  const [rewardEditorCard, setRewardEditorCard] = useState<RewardEditorCard | null>(null);
  const [editableRewards, setEditableRewards] = useState<WalletCard['rewardDetails']>([]);
  const [isSavingRewards, setIsSavingRewards] = useState(false);
  const [rewardSaveError, setRewardSaveError] = useState('');
  const [manualEditorCard, setManualEditorCard] = useState<WalletCard | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualBalance, setManualBalance] = useState('');
  const [manualLimit, setManualLimit] = useState('');
  const [manualCategories, setManualCategories] = useState<EditableSpendingCategory[]>([]);
  const [manualCardError, setManualCardError] = useState('');
  const [isSavingManualCard, setIsSavingManualCard] = useState(false);
  const [disconnectingItemId, setDisconnectingItemId] = useState('');
  const [disconnectError, setDisconnectError] = useState('');

  function focusCard(cardId: string) {
    setFocusedCardId(cardId);
    document.getElementById(`wallet-card-${cardId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }

  useEffect(() => {
    if ((!isModalOpen && !cardMatcherCard) || catalogCards.length > 0) return;
    fetch('/api/cards/catalog')
      .then((response) => response.ok ? response.json() : { cards: [] })
      .then((payload: { cards?: CatalogCard[] }) => setCatalogCards(payload.cards ?? []))
      .catch(() => setCatalogCards([]));
  }, [isModalOpen, cardMatcherCard, catalogCards.length]);

  async function addCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedLastFour = lastFour.replace(/\D/g, '').slice(-4);
    const parsedBalance = Number.parseFloat(balance);
    const parsedLimit = Number.parseFloat(creditLimit);
    if (!name.trim() || normalizedLastFour.length !== 4 || Number.isNaN(parsedBalance) || Number.isNaN(parsedLimit) || parsedLimit <= 0) {
      setManualCardError('Enter valid card details before saving.');
      return;
    }

    const catalogMatch = catalogCards.find((catalogCard) => cardCatalogMatchesName(catalogCard, name));
    const monthlyCategories = groupCategoriesByMonth(newCategories);
    if (newCategories.some((category) => !/^\d{4}-(0[1-9]|1[0-2])$/.test(category.month))) {
      setManualCardError('Choose a valid spending month for every entry.');
      return;
    }
    setIsSavingManualCard(true);
    setManualCardError('');
    try {
      const response = await fetch('/api/cards/manual', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catalogMatch ? displayCatalogCardName(catalogMatch) : name.trim(), lastFour: normalizedLastFour, currentBalance: parsedBalance, creditLimit: parsedLimit, monthlyCategories, catalogCardId: catalogMatch?.cardId }),
      });
      const payload = (await response.json()) as { card?: { id: string }; error?: string };
      if (!response.ok || !payload.card) throw new Error(payload.error ?? 'Unable to save this card.');
      const currentCategories = monthlyCategories[currentMonthKey()] ?? [];
      const card: WalletCard = { id: payload.card.id, name: catalogMatch ? displayCatalogCardName(catalogMatch) : name.trim(), issuer: 'CREDIT CARD', lastFour: normalizedLastFour, cardholderName, currentBalance: parsedBalance, limit: parsedLimit, color: 'blue', rewardDetails: catalogRewardDetails(catalogMatch), rewardsMatched: Boolean(catalogMatch), catalogCardId: catalogMatch?.cardId, hasSpendingData: currentCategories.length > 0, categories: currentCategories, monthlyCategories, isManual: true };
      setCards((currentCards) => [...currentCards, card]);
      setFocusedCardId(card.id); setCurrentCardId(card.id);
      setName(''); setLastFour(''); setBalance(''); setCreditLimit(''); setNewCategories([]); setIsModalOpen(false);
      router.refresh();
    } catch (error) {
      setManualCardError(error instanceof Error ? error.message : 'Unable to save this card.');
    } finally {
      setIsSavingManualCard(false);
    }
  }

  function refreshSpending() {
    setIsRefreshingSpending(true);
    try {
      router.refresh();
    } finally {
      window.setTimeout(() => setIsRefreshingSpending(false), 500);
    }
  }

  async function disconnectPlaidItem(bank: ConnectedPlaidBank) {
    const confirmed = window.confirm(
      `Disconnect ${bank.name}? This removes ${bank.accountCount} connected account${bank.accountCount === 1 ? '' : 's'} from Wallets.`,
    );
    if (!confirmed) return;

    setDisconnectError('');
    setDisconnectingItemId(bank.plaidItemId);
    try {
      const response = await fetch('/api/plaid/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plaidItemId: bank.plaidItemId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'Unable to disconnect this bank.');

      const disconnectedCardIds = new Set(cards.filter(
        (connectedCard) => connectedCard.plaidItemId === bank.plaidItemId,
      ).map((connectedCard) => connectedCard.id));
      setCards((currentCards) => currentCards.filter(
        (connectedCard) => connectedCard.plaidItemId !== bank.plaidItemId,
      ));
      setFocusedCardId((id) => disconnectedCardIds.has(id) ? '' : id);
      setCurrentCardId((id) => disconnectedCardIds.has(id) ? '' : id);
      router.refresh();
    } catch (error) {
      setDisconnectError(error instanceof Error ? error.message : 'Unable to disconnect this bank.');
    } finally {
      setDisconnectingItemId('');
    }
  }

  function openRewardEditor(card: WalletCard) {
    setRewardEditorCard(card);
    setEditableRewards(card.rewardDetails);
    setRewardSaveError('');
  }

  function openCardMatcher(card: WalletCard) {
    setCardMatcherCard(card);
    setCatalogSearch(card.name);
    setCardMatchError('');
  }

  async function saveCardMatch(catalogCard: CatalogCard) {
    if (!cardMatcherCard) return;
    setIsSavingCardMatch(true);
    setCardMatchError('');
    try {
      const response = await fetch('/api/cards/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: cardMatcherCard.id, catalogCardId: catalogCard.cardId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'Unable to save the card match.');

      setCards((currentCards) => currentCards.map((card) => card.id === cardMatcherCard.id ? {
        ...card,
        name: displayCatalogCardName(catalogCard),
        catalogCardId: catalogCard.cardId,
        rewardDetails: catalogRewardDetails(catalogCard),
        rewardsMatched: true,
      } : card));
      setCardMatcherCard(null);
      router.refresh();
    } catch (error) {
      setCardMatchError(error instanceof Error ? error.message : 'Unable to save the card match.');
    } finally {
      setIsSavingCardMatch(false);
    }
  }

  function openManualEditor(card: WalletCard) {
    setManualEditorCard(card);
    setManualName(card.name);
    setManualBalance(String(card.currentBalance));
    setManualLimit(String(card.limit));
    const month = currentMonthKey();
    const monthlyCategories = card.monthlyCategories ?? { [month]: card.categories };
    setManualCategories(Object.entries(monthlyCategories).flatMap(([spendingMonth, categories]) => categories.map((category) => ({ ...category, month: spendingMonth }))));
  }

  function updateManualCategory(index: number, field: 'label' | 'amount' | 'month', value: string) {
    setManualCategories((categories) => categories.map((category, categoryIndex) => (
      categoryIndex === index
        ? { ...category, [field]: field === 'amount' ? Number.parseFloat(value) || 0 : value }
        : category
    )));
  }

  function updateNewCategory(index: number, field: 'label' | 'amount' | 'month', value: string) {
    setNewCategories((categories) => categories.map((category, categoryIndex) => (
      categoryIndex === index
        ? { ...category, [field]: field === 'amount' ? Number.parseFloat(value) || 0 : value }
        : category
    )));
  }

  async function saveManualCard() {
    if (!manualEditorCard) return;
    const parsedBalance = Number.parseFloat(manualBalance);
    const parsedLimit = Number.parseFloat(manualLimit);
    if (!manualName.trim() || Number.isNaN(parsedBalance) || Number.isNaN(parsedLimit) || parsedLimit <= 0) {
      setManualCardError('Enter valid card details before saving.');
      return;
    }
    const monthlyCategories = groupCategoriesByMonth(manualCategories);
    if (manualCategories.some((category) => !/^\d{4}-(0[1-9]|1[0-2])$/.test(category.month))) {
      setManualCardError('Choose a valid spending month for every entry.');
      return;
    }
    setIsSavingManualCard(true);
    setManualCardError('');
    try {
      const response = await fetch('/api/cards/manual', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: manualEditorCard.id, name: manualName.trim(), lastFour: manualEditorCard.lastFour, currentBalance: parsedBalance, creditLimit: parsedLimit, monthlyCategories, catalogCardId: manualEditorCard.catalogCardId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'Unable to update this card.');
      setCards((currentCards) => currentCards.map((card) => card.id === manualEditorCard.id ? { ...card, name: manualName.trim(), currentBalance: parsedBalance, limit: parsedLimit, categories: monthlyCategories[currentMonthKey()] ?? [], monthlyCategories, hasSpendingData: (monthlyCategories[currentMonthKey()] ?? []).length > 0 } : card));
      setManualEditorCard(null);
      router.refresh();
    } catch (error) {
      setManualCardError(error instanceof Error ? error.message : 'Unable to update this card.');
    } finally {
      setIsSavingManualCard(false);
    }
  }

  async function deleteManualCard(card: WalletCard) {
    setManualCardError('');
    try {
      const response = await fetch('/api/cards/manual', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: card.id }) });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'Unable to delete this card.');
      setCards((currentCards) => currentCards.filter((currentCard) => currentCard.id !== card.id));
      setFocusedCardId((id) => id === card.id ? '' : id); setCurrentCardId((id) => id === card.id ? '' : id);
      router.refresh();
    } catch (error) {
      setManualCardError(error instanceof Error ? error.message : 'Unable to delete this card.');
    }
  }

  function updateReward(index: number, field: 'label' | 'multiplier', value: string) {
    setEditableRewards((rewards) => rewards.map((reward, rewardIndex) => (
      rewardIndex === index
        ? { ...reward, [field]: field === 'multiplier' ? Number.parseFloat(value) || 0 : value }
        : reward
    )));
  }

  async function saveRewards() {
    if (!rewardEditorCard) return;
    const rewards = editableRewards
      .map((reward) => ({ ...reward, label: reward.label.trim() }))
      .filter((reward) => reward.label && reward.multiplier > 0);

    setIsSavingRewards(true);
    setRewardSaveError('');
    try {
      const response = await fetch('/api/cards/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: rewardEditorCard.id, rewards }),
      });
      if (!response.ok) throw new Error('Unable to save your reward rules.');
      setCards((currentCards) => currentCards.map((card) => (
        card.id === rewardEditorCard.id
          ? { ...card, rewardDetails: rewards, rewardsMatched: rewards.length > 0 }
          : card
      )));
      setRewardEditorCard(null);
    } catch (error) {
      setRewardSaveError(error instanceof Error ? error.message : 'Unable to save your reward rules.');
    } finally {
      setIsSavingRewards(false);
    }
  }

  return (
    <div className="w-full min-w-0 bg-white text-[#121926]">
      {isSavingManualCard && <p className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white shadow-lg">Saving card…</p>}
      <main className="w-full min-w-0">
          <header className="flex items-start justify-between gap-4">
            <div><h1 className="text-3xl font-bold tracking-tight">Wallets</h1><p className="mt-1 text-sm text-slate-500">Track credit card usage, and monthly expenses.</p></div>
            <div className="flex items-center gap-3"><button className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-[#2865e9]" aria-label="Notifications"><Bell size={17} strokeWidth={1.8} aria-hidden="true" /></button><div className="grid h-8 w-8 place-items-center rounded-full bg-[#5278ef] text-[10px] font-bold text-white">EC</div></div>
          </header>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={refreshSpending} disabled={isRefreshingSpending} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"><RefreshCw size={16} className={isRefreshingSpending ? 'animate-spin' : ''} aria-hidden="true" />{isRefreshingSpending ? 'Refreshing…' : 'Refresh spending'}</button>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <a href="/auth/connect-bank" className="inline-flex items-center gap-2 rounded-xl bg-[#121926] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"><Landmark size={16} aria-hidden="true" />Connect bank</a>
              <button type="button" onClick={() => setIsManageCardsOpen(true)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">Manage cards</button>
              <button type="button" onClick={() => { setManualCardError(''); setIsModalOpen(true); }} className="rounded-xl bg-[#2865e9] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700">＋ &nbsp; Add credit card</button>
            </div>
          </div>

          {cards.length === 0 ? (
            <section className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <h2 className="text-lg font-semibold">{hasConnectedNonCreditAccounts ? 'No credit cards connected yet' : 'No accounts connected yet'}</h2>
              <p className="mt-2 text-sm text-slate-600">{hasConnectedNonCreditAccounts ? 'Your checking or savings account is connected. Wallets currently displays credit cards only.' : 'Connect a bank or add a card to start tracking balances and spending.'}</p>
              <a href="/auth/connect-bank" className="mt-5 inline-block rounded-xl bg-[#2865e9] px-4 py-2 text-sm font-medium text-white">Connect bank</a>
            </section>
          ) : (
          <section className="mt-3 overflow-hidden rounded-[28px] bg-[#ececec] shadow-md">
            <div className="flex h-16 items-center justify-between px-4">
              <p className="text-sm font-semibold text-slate-600">Your credit cards</p>
              <button type="button" onClick={() => setAreCardPreviewsVisible((isVisible) => !isVisible)} aria-expanded={areCardPreviewsVisible} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-white">
                {areCardPreviewsVisible ? <><ChevronUp size={15} aria-hidden="true" />Hide cards</> : <><ChevronDown size={15} aria-hidden="true" />Show cards</>}
              </button>
            </div>
            {areCardPreviewsVisible && <div className="flex gap-3 overflow-x-auto p-3 pt-2 [scrollbar-width:thin]">
              {cards.map((card) => (
                <button key={card.id} type="button" onClick={() => focusCard(card.id)} className={`h-[116px] w-[330px] shrink-0 overflow-hidden rounded-xl border p-3 text-left shadow-sm transition ${currentCardId === card.id ? 'border-[#4e91ff] bg-[#eaf3ff] ring-2 ring-[#93c5fd]' : focusedCardId === card.id ? 'border-[#b9d8ff] bg-[#f7fbff]' : 'border-transparent bg-white hover:-translate-y-0.5'}`}>
                  <div className="flex gap-3"><CreditCardVisual card={card} compact /><div className="w-[125px] shrink-0 overflow-hidden pt-1"><h2 className="truncate text-sm font-bold">{card.name}</h2><p className="mt-1 truncate text-xs">{money.format(card.currentBalance)} this month</p><div className="mt-1 flex flex-wrap gap-1">{card.rewardDetails.length > 0 ? card.rewardDetails.slice(0, 2).map((detail) => <span key={`${detail.label}-${detail.multiplier}`} className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">{detail.multiplier}x {detail.label}</span>) : <span className="text-[10px] text-slate-500">Rewards to be matched</span>}</div></div></div>
                </button>
              ))}
            </div>}
          </section>
          )}

          <section className="mt-4 space-y-3">
            {cards.map((card) => {
              const selectedSpendingMonth = selectedSpendingMonths[card.id] ?? currentMonthKey();
              const displayedCard = cardForMonth(card, selectedSpendingMonth);
              const usage = Math.min((card.currentBalance / card.limit) * 100, 100);
              const isCurrentCard = currentCardId === card.id;
              const rewardsThisMonth = monthlyRewards(displayedCard);
              const totalRewardPoints = rewardsThisMonth.reduce((sum, reward) => sum + reward.points, 0);
              return (
                <article id={`wallet-card-${card.id}`} key={card.id} className={`relative scroll-mt-6 rounded-[24px] border-2 bg-white p-4 shadow-md transition ${isCurrentCard ? 'border-[#3b82f6] shadow-[0_0_0_4px_rgba(147,197,253,0.38)]' : focusedCardId === card.id ? 'border-[#a8ccff]' : 'border-slate-100'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3"><h2 className="text-xl font-bold">{card.name}</h2>{(card.isManual || card.issuer === 'POCKIT CARD') ? <button type="button" onClick={() => openManualEditor(card)} className="inline-flex items-center gap-1 text-xs font-medium text-[#2865e9] hover:underline"><Pencil size={13} aria-hidden="true" />Edit card</button> : <button type="button" onClick={() => openCardMatcher(card)} className="inline-flex items-center gap-1 text-xs font-medium text-[#2865e9] hover:underline"><Pencil size={13} aria-hidden="true" />{card.catalogCardId ? 'Change card' : 'Match card'}</button>}</div>
                    <button type="button" onClick={() => { setCurrentCardId(card.id); setFocusedCardId(card.id); }} aria-pressed={isCurrentCard} className="shrink-0 text-center">
                      <span className={`flex h-5 w-16 overflow-hidden rounded-full ${isCurrentCard ? 'bg-[#a9c9ff]' : 'bg-[#eeeeee]'}`} aria-hidden="true">
                        <span className={`h-full w-8 rounded-full ${isCurrentCard ? 'ml-auto bg-[#2865e9]' : 'bg-[#cfcfcf]'}`} />
                      </span>
                      <span className="mt-1 block text-[11px] font-medium text-slate-600">Current card</span>
                    </button>
                  </div>
                  <div className="mt-3 grid gap-4 xl:grid-cols-[260px_minmax(360px,0.8fr)_minmax(300px,0.55fr)] xl:items-start">
                    <div><CreditCardVisual card={card} /><div className="mt-3 w-[240px]"><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#2784c6]" style={{ width: `${usage}%` }} /></div><div className="mt-1.5 flex items-center justify-between gap-2 whitespace-nowrap text-[10px]"><span>Credit usage (cycle)</span><span>{money.format(card.currentBalance)} / {money.format(card.limit)}</span></div></div></div>
                    <div className="border-y border-slate-200 py-3 xl:border-x xl:border-y-0 xl:px-5">
                      <div className="mb-3 flex flex-wrap items-center gap-1.5" aria-label={`${card.name} spending month`}>
                        {recentMonthKeys().map((month) => <button key={month} type="button" onClick={() => setSelectedSpendingMonths((months) => ({ ...months, [card.id]: month }))} aria-pressed={selectedSpendingMonth === month} className={`rounded-md px-2 py-1 text-[10px] font-semibold transition ${selectedSpendingMonth === month ? 'bg-[#2865e9] text-white' : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>{displayMonth(month)}</button>)}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[104px_1fr] sm:items-start"><div className="flex flex-col items-center"><p className="mb-2 w-[104px] text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">{displayMonth(selectedSpendingMonth)} usage</p><Donut card={displayedCard} /></div><div className="space-y-1.5">{displayedCard.hasSpendingData ? displayedCard.categories.map((category) => <div key={category.label} className="rounded-lg bg-slate-50 px-2 py-1.5 text-xs"><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />{category.label} - {money.format(category.amount)}</div>) : <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-xs"><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#2184c7]" />Transactions total - {money.format(monthlySpendingTotal(displayedCard))}</div>}</div></div>
                    </div>
                    <div className="text-left xl:pl-5"><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reward rates</p><button type="button" onClick={() => openRewardEditor(card)} className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2865e9] hover:underline"><Pencil size={12} aria-hidden="true" />Edit</button></div><div className="mt-3 space-y-2">{card.rewardDetails.length > 0 ? card.rewardDetails.slice(0, 4).map((detail) => <div key={`${detail.label}-${detail.multiplier}`} className="flex items-center justify-between rounded-lg bg-blue-50 px-2.5 py-2 text-xs"><span className="capitalize text-slate-700">{detail.label}</span><strong className="text-blue-700">{detail.multiplier}x</strong></div>) : <p className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-500">Choose reward rates for this card.</p>}</div><div className="mt-3 border-t border-slate-200 pt-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{displayMonth(selectedSpendingMonth)} rewards</p>{rewardsThisMonth.length > 0 ? <><div className="mt-2 space-y-1.5">{rewardsThisMonth.map((reward) => <div key={reward.label} className="flex items-center justify-between gap-2 text-sm"><span className="truncate font-medium text-slate-700">{reward.label}</span><strong className="shrink-0 text-[#2865e9]">{reward.points.toLocaleString()} pts</strong></div>)}</div><div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-lg font-bold"><span>Total</span><span className="text-[#2865e9]">{totalRewardPoints.toLocaleString()} pts</span></div></> : <p className="mt-2 text-[11px] text-slate-500">{card.rewardDetails.length > 0 ? 'No eligible spending for this month.' : 'Add a category rate to calculate points.'}</p>}</div></div>
                  </div>
                </article>
              );
            })}
          </section>
      </main>

      {isManageCardsOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="manage-cards-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div><p className="text-sm font-semibold text-[#2865e9]">Wallets</p><h2 id="manage-cards-title" className="mt-1 text-2xl font-bold">Manage cards</h2></div>
              <button type="button" onClick={() => setIsManageCardsOpen(false)} className="text-2xl text-slate-500" aria-label="Close manage cards">×</button>
            </div>
            <div className="mt-5 space-y-4">
              {cards.filter((card) => card.isManual || card.issuer === 'POCKIT CARD').length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Manual cards</p>
                  {cards.filter((card) => card.isManual || card.issuer === 'POCKIT CARD').map((card) => (
                    <div key={card.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                      <div className="min-w-0"><p className="truncate text-sm font-semibold">{card.name}</p><p className="text-xs text-slate-500">•••• {card.lastFour} · Manual card</p></div>
                      <button type="button" onClick={() => void deleteManualCard(card)} className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
                    </div>
                  ))}
                </div>
              )}
              {connectedBanks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Connected banks</p>
                  {connectedBanks.map((bank) => (
                    <div key={bank.plaidItemId} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                      <div className="min-w-0"><p className="truncate text-sm font-semibold">{bank.name}</p><p className="text-xs text-slate-500">{bank.accountCount} connected account{bank.accountCount === 1 ? '' : 's'}</p></div>
                      <button type="button" onClick={() => void disconnectPlaidItem(bank)} disabled={disconnectingItemId === bank.plaidItemId} className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
                        {disconnectingItemId === bank.plaidItemId ? 'Disconnecting…' : 'Disconnect'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {(disconnectError || manualCardError) && <p role="alert" className="mt-3 text-sm text-red-600">{disconnectError || manualCardError}</p>}
            <p className="mt-4 text-xs text-slate-500">Disconnecting a bank revokes its Plaid connection and removes every connected account from Wallets. Manual cards can be deleted individually.</p>
          </div>
        </div>
      )}

      {cardMatcherCard && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"><div role="dialog" aria-modal="true" aria-labelledby="card-matcher-title" className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex justify-between gap-4"><div><p className="text-sm font-semibold text-[#2865e9]">Connected card</p><h2 id="card-matcher-title" className="mt-1 text-2xl font-bold">Match your card</h2><p className="mt-1 text-sm text-slate-500">Plaid returned a generic account name. Choose the exact card to apply its reward rates.</p></div><button type="button" onClick={() => setCardMatcherCard(null)} className="text-2xl text-slate-500" aria-label="Close card matcher">×</button></div><label className="mt-5 block text-sm font-medium">Search card<input autoFocus value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder="e.g. Chase Sapphire Preferred" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" /></label><div className="mt-3 max-h-72 space-y-2 overflow-y-auto">{catalogCards.filter((catalogCard) => cardCatalogMatchesSearch(catalogCard, catalogSearch)).map((catalogCard) => <button key={catalogCard.cardId} type="button" disabled={isSavingCardMatch} onClick={() => void saveCardMatch(catalogCard)} className="w-full rounded-xl border border-slate-200 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-wait"><span className="block text-sm font-semibold">{displayCatalogCardName(catalogCard)}</span><span className="mt-0.5 block text-xs text-slate-500">{displayIssuerName(catalogCard.issuer)} · {catalogCard.network}</span></button>)}{catalogCards.length > 0 && catalogCards.filter((catalogCard) => cardCatalogMatchesSearch(catalogCard, catalogSearch)).length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No matching card found. Try a shorter name.</p>}{catalogCards.length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Loading the card catalog…</p>}</div>{cardMatchError && <p role="alert" className="mt-3 text-sm text-red-600">{cardMatchError}</p>}<button type="button" onClick={() => setCardMatcherCard(null)} className="mt-5 w-full rounded-lg border border-slate-300 py-2.5 font-medium">Cancel</button></div></div>}

      <datalist id="credit-card-catalog">
        {catalogCards.map((card) => <option key={card.cardId} value={displayCatalogCardName(card)} label={`${displayIssuerName(card.issuer)} · ${card.network}`} />)}
      </datalist>

      {isModalOpen && <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4">
        <div role="dialog" aria-modal="true" aria-labelledby="add-card-details-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-sm font-semibold text-[#2865e9]">Wallets</p><h2 id="add-card-details-title" className="mt-1 text-2xl font-bold">Add credit card</h2></div>
            <button type="button" onClick={() => setIsModalOpen(false)} className="text-2xl text-slate-500" aria-label="Close add credit card">×</button>
          </div>
          <form className="mt-6 space-y-4" onSubmit={addCard}>
            <label className="block text-sm font-medium">Card name<input required list="credit-card-catalog" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Citi Double Cash" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" /></label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm font-medium">Last 4 digits<input required inputMode="numeric" maxLength={4} value={lastFour} onChange={(event) => setLastFour(event.target.value.replace(/\D/g, ''))} placeholder="1234" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" /></label>
              <label className="block text-sm font-medium">Credit usage (cycle)<input required type="number" min="0" step="0.01" value={balance} onChange={(event) => setBalance(event.target.value)} placeholder="0.00" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" /></label>
              <label className="block text-sm font-medium">Credit limit<input required type="number" min="1" step="0.01" value={creditLimit} onChange={(event) => setCreditLimit(event.target.value)} placeholder="e.g. 5000" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" /></label>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-baseline justify-between"><p className="text-sm font-semibold">Monthly spending details</p><span className="text-xs text-slate-500">Optional</span></div>
              <p className="mt-1 text-xs text-slate-500">Enter each category&apos;s amount and the month it belongs to.</p>
              <div className="mt-3 hidden grid-cols-[minmax(0,1fr)_110px_150px_32px] gap-2 px-1 text-xs font-medium text-slate-500 sm:grid"><span>Category</span><span>Amount</span><span>Month</span></div>
              <div className="mt-2 space-y-2">
                {newCategories.map((category, index) => <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_110px_150px_32px]">
                  <select value={spendingCategoryOptions.includes(category.label) ? category.label : 'Other'} onChange={(event) => updateNewCategory(index, 'label', event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="Other">Other</option>{spendingCategoryOptions.filter((option) => option !== 'Other').map((option) => <option key={option} value={option}>{option}</option>)}</select>
                  <input type="number" min="0" step="0.01" value={category.amount || ''} onChange={(event) => updateNewCategory(index, 'amount', event.target.value)} placeholder="Amount" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <input type="month" value={category.month} onChange={(event) => updateNewCategory(index, 'month', event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" aria-label="Spending month" />
                  <button type="button" onClick={() => setNewCategories((categories) => categories.filter((_, categoryIndex) => categoryIndex !== index))} className="grid place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label="Remove spending category"><Trash2 size={16} aria-hidden="true" /></button>
                </div>)}
              </div>
              <button type="button" onClick={() => setNewCategories((categories) => [...categories, { label: 'Dining', amount: 0, color: manualCategoryColors[categories.length % manualCategoryColors.length], month: currentMonthKey() }])} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#2865e9]"><Plus size={15} aria-hidden="true" />Add spending category</button>
            </div>
            {manualCardError && <p role="alert" className="text-sm text-red-600">{manualCardError}</p>}
            <div className="flex gap-3 pt-2"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-lg border border-slate-300 py-2.5 font-medium">Cancel</button><button type="submit" disabled={isSavingManualCard} className="flex-1 rounded-lg bg-[#2865e9] py-2.5 font-medium text-white disabled:opacity-60">{isSavingManualCard ? 'Adding…' : 'Add card'}</button></div>
          </form>
        </div>
      </div>}

      {manualEditorCard && <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/45 p-4">
        <div role="dialog" aria-modal="true" aria-labelledby="edit-card-details-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-sm font-semibold text-[#2865e9]">Manual credit card</p><h2 id="edit-card-details-title" className="mt-1 text-2xl font-bold">Edit card & spending</h2></div>
            <button type="button" onClick={() => setManualEditorCard(null)} className="text-2xl text-slate-500" aria-label="Close card editor">×</button>
          </div>
          <div className="mt-6 space-y-4">
            <label className="block text-sm font-medium">Card name<input value={manualName} onChange={(event) => setManualName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium">Credit usage (cycle)<input type="number" min="0" step="0.01" value={manualBalance} onChange={(event) => setManualBalance(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" /></label>
              <label className="block text-sm font-medium">Credit limit<input type="number" min="1" step="0.01" value={manualLimit} onChange={(event) => setManualLimit(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" /></label>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-baseline justify-between"><p className="text-sm font-semibold">Monthly spending details</p><span className="text-xs text-slate-500">Optional</span></div>
              <p className="mt-1 text-xs text-slate-500">Edit the categories, amounts, and month used by the Donut.</p>
              <div className="mt-3 hidden grid-cols-[minmax(0,1fr)_110px_150px_32px] gap-2 px-1 text-xs font-medium text-slate-500 sm:grid"><span>Category</span><span>Amount</span><span>Month</span></div>
              <div className="mt-2 space-y-2">
                {manualCategories.map((category, index) => <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_110px_150px_32px]">
                  <select value={spendingCategoryOptions.includes(category.label) ? category.label : 'Other'} onChange={(event) => updateManualCategory(index, 'label', event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="Other">Other</option>{spendingCategoryOptions.filter((option) => option !== 'Other').map((option) => <option key={option} value={option}>{option}</option>)}</select>
                  <input type="number" min="0" step="0.01" value={category.amount || ''} onChange={(event) => updateManualCategory(index, 'amount', event.target.value)} placeholder="Amount" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <input type="month" value={category.month} onChange={(event) => updateManualCategory(index, 'month', event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" aria-label="Spending month" />
                  <button type="button" onClick={() => setManualCategories((categories) => categories.filter((_, categoryIndex) => categoryIndex !== index))} className="grid place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label="Remove spending category"><Trash2 size={16} aria-hidden="true" /></button>
                </div>)}
              </div>
              <button type="button" onClick={() => setManualCategories((categories) => [...categories, { label: 'Dining', amount: 0, color: manualCategoryColors[categories.length % manualCategoryColors.length], month: currentMonthKey() }])} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#2865e9]"><Plus size={15} aria-hidden="true" />Add spending category</button>
            </div>
            {manualCardError && <p role="alert" className="text-sm text-red-600">{manualCardError}</p>}
            <div className="flex gap-3 pt-2"><button type="button" onClick={() => setManualEditorCard(null)} className="flex-1 rounded-lg border border-slate-300 py-2.5 font-medium">Cancel</button><button type="button" disabled={isSavingManualCard} onClick={saveManualCard} className="flex-1 rounded-lg bg-[#2865e9] py-2.5 font-medium text-white disabled:opacity-60">{isSavingManualCard ? 'Saving…' : 'Save changes'}</button></div>
          </div>
        </div>
      </div>}

      {rewardEditorCard && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"><div role="dialog" aria-modal="true" aria-labelledby="reward-editor-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex justify-between gap-4"><div><p className="text-sm font-semibold text-[#2865e9]">{rewardEditorCard.name}</p><h2 id="reward-editor-title" className="mt-1 text-2xl font-bold">Reward bonuses</h2><p className="mt-1 text-xs text-slate-500">Choose each eligible category and reward rate.</p></div><button type="button" onClick={() => setRewardEditorCard(null)} className="text-2xl text-slate-500" aria-label="Close reward editor">×</button></div><div className="mt-5 space-y-2">{editableRewards.map((reward, index) => <div key={index} className="grid grid-cols-[1fr_92px_32px] gap-2"><select value={rewardCategoryOptions.includes(reward.label) ? reward.label : 'Other'} onChange={(event) => updateReward(index, 'label', event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500" aria-label="Reward category">{rewardCategoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}</select><select value={rewardMultiplierOptions.includes(reward.multiplier) ? reward.multiplier : 1} onChange={(event) => updateReward(index, 'multiplier', event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500" aria-label="Reward multiplier">{rewardMultiplierOptions.map((multiplier) => <option key={multiplier} value={multiplier}>{multiplier}x</option>)}</select><button type="button" onClick={() => setEditableRewards((rewards) => rewards.filter((_, rewardIndex) => rewardIndex !== index))} className="grid place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label="Remove reward"><Trash2 size={16} aria-hidden="true" /></button></div>)}</div><button type="button" onClick={() => setEditableRewards((rewards) => [...rewards, { label: 'Dining', multiplier: 1, rewardCurrency: 'POINTS' }])} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#2865e9]"><Plus size={15} aria-hidden="true" />Add reward rate</button>{rewardSaveError && <p className="mt-3 text-sm text-red-600">{rewardSaveError}</p>}<div className="mt-6 flex gap-3"><button type="button" onClick={() => setRewardEditorCard(null)} className="flex-1 rounded-lg border border-slate-300 py-2.5 font-medium">Cancel</button><button type="button" disabled={isSavingRewards} onClick={saveRewards} className="flex-1 rounded-lg bg-[#2865e9] py-2.5 font-medium text-white disabled:opacity-60">{isSavingRewards ? 'Saving…' : 'Save rewards'}</button></div></div></div>}
    </div>
  );
}
