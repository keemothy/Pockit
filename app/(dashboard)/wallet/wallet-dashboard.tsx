'use client';

import { FormEvent, useState } from 'react';

export type WalletCard = {
  id: string;
  name: string;
  issuer: string;
  lastFour: string;
  currentBalance: number;
  limit: number;
  color: 'blue' | 'rainbow' | 'black';
  reward: string;
  categories: { label: string; amount: number; color: string }[];
};

export const demoCards: WalletCard[] = [
  {
    id: '1',
    name: 'Chase Sapphire Preferred',
    issuer: 'Chase Sapphire Preferred',
    lastFour: '2847',
    currentBalance: 518.7,
    limit: 4000,
    color: 'blue',
    reward: '5x Dining  •  3x Travel',
    categories: [
      { label: 'Travel', amount: 20.39, color: '#aac437' },
      { label: 'Gas', amount: 57.14, color: '#2184c7' },
      { label: 'Shopping', amount: 99.15, color: '#efc93c' },
      { label: 'Dining & Food', amount: 109.48, color: '#ff9a57' },
      { label: 'Uber', amount: 102.89, color: '#ff626a' },
      { label: 'Grocery', amount: 129.65, color: '#9747ba' },
    ],
  },
  {
    id: '2',
    name: 'Apple Card',
    issuer: 'APPLE',
    lastFour: '5114',
    currentBalance: 420.6,
    limit: 5000,
    color: 'rainbow',
    reward: '2% Apple Pay',
    categories: [
      { label: 'Shopping', amount: 133.21, color: '#efc93c' },
      { label: 'Travel', amount: 287.39, color: '#aac437' },
    ],
  },
  {
    id: '3',
    name: 'American Express Platinum',
    issuer: 'AMERICAN EXPRESS',
    lastFour: '7597',
    currentBalance: 374.45,
    limit: 10000,
    color: 'black',
    reward: '4x Restaurants  •  4x Groceries',
    categories: [
      { label: 'Travel', amount: 220, color: '#2184c7' },
      { label: 'Dining', amount: 154.45, color: '#ff9a57' },
    ],
  },
  {
    id: '4',
    name: 'Marriott Bonvoy Boundless',
    issuer: 'MARRIOTT BONVOY',
    lastFour: '6021',
    currentBalance: 176.12,
    limit: 3500,
    color: 'black',
    reward: '6x Marriott Hotels  •  2x Travel',
    categories: [
      { label: 'Travel', amount: 176.12, color: '#ff626a' },
    ],
  },
];

const cardBackground: Record<WalletCard['color'], string> = {
  blue: 'linear-gradient(140deg, #030c31 0%, #05255c 38%, #0a9ee6 76%, #03194d 100%)',
  rainbow: 'linear-gradient(135deg, #fff6e6 0%, #f7b9cc 30%, #a581fa 52%, #ffb74d 77%, #ffe45f 100%)',
  black: 'linear-gradient(140deg, #191b22, #44464b 52%, #121317)',
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function CreditCardVisual({ card, compact = false }: { card: WalletCard; compact?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl text-white shadow-inner ${compact ? 'h-[86px] w-[136px]' : 'h-[180px] w-[286px]'}`}
      style={{ background: cardBackground[card.color] }}
    >
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(124deg, transparent 31%, rgba(255,255,255,.55) 32%, transparent 33%, transparent 52%, rgba(91,228,255,.8) 53%, transparent 54%)' }} />
      <div className={`relative flex h-full flex-col justify-between ${compact ? 'p-2.5' : 'p-4'}`}>
        <div className="flex items-start justify-between">
          <span className={`${compact ? 'text-[7px]' : 'text-xs'} font-semibold tracking-wide`}>{card.issuer}</span>
          {!compact && <span className="text-xl font-bold italic">{card.color === 'blue' ? 'VISA' : card.color === 'rainbow' ? '◯ ◯' : 'AMEX'}</span>}
        </div>
        {!compact && <div className="h-7 w-9 rounded-md bg-gradient-to-br from-stone-300 via-yellow-100 to-stone-400 opacity-90" />}
        {!compact && <p className="font-mono text-sm tracking-[0.2em]">****  ****  ****  {card.lastFour}</p>}
        {!compact && <div className="flex justify-between text-[8px] text-white/75"><span>Card holder<br /><strong className="text-sm text-white">First Last</strong></span><span>Expire date<br /><strong className="text-sm text-white">06/29</strong></span></div>}
      </div>
    </div>
  );
}

function Donut({ card }: { card: WalletCard }) {
  const total = Math.max(
    card.categories.reduce((sum, category) => sum + category.amount, 0),
    1,
  );
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

  return (
    <div className="relative mx-auto grid h-40 w-40 place-items-center rounded-full shadow-sm" style={{ background: `conic-gradient(${stops.parts.join(', ')})` }}>
      <div className="grid h-[106px] w-[106px] place-items-center rounded-full bg-white text-center shadow-inner">
        <strong className="text-lg">{money.format(card.currentBalance)}</strong>
      </div>
    </div>
  );
}

export default function WalletDashboard({ initialCards }: { initialCards: WalletCard[] }) {
  const [cards, setCards] = useState(initialCards);
  const [focusedCardId, setFocusedCardId] = useState(initialCards[0]?.id ?? '');
  const [currentCardId, setCurrentCardId] = useState(initialCards[0]?.id ?? '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [balance, setBalance] = useState('');

  function focusCard(cardId: string) {
    setFocusedCardId(cardId);
    document.getElementById(`wallet-card-${cardId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }

  function addCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedLastFour = lastFour.replace(/\D/g, '').slice(-4);
    const parsedBalance = Number.parseFloat(balance);
    if (!name.trim() || normalizedLastFour.length !== 4 || Number.isNaN(parsedBalance)) return;

    const card: WalletCard = {
      id: crypto.randomUUID(), name: name.trim(), issuer: 'POCKIT CARD', lastFour: normalizedLastFour,
      currentBalance: parsedBalance, limit: 3000, color: 'blue', reward: 'New rewards coming soon',
      categories: [{ label: 'Uncategorized', amount: parsedBalance || 1, color: '#2184c7' }],
    };
    setCards((currentCards) => [...currentCards, card]);
    setFocusedCardId(card.id);
    setCurrentCardId(card.id);
    setName(''); setLastFour(''); setBalance(''); setIsModalOpen(false);
  }

  return (
    <div className="w-full min-w-0 bg-white text-[#121926]">
      <main className="w-full min-w-0">
          <header className="flex items-start justify-between gap-4">
            <div><h1 className="text-3xl font-bold tracking-tight">Wallets</h1><p className="mt-1 text-sm text-slate-500">Track credit card usage, and monthly expenses.</p></div>
            <div className="flex items-center gap-3"><button className="rounded-full border border-slate-200 p-2 text-sm" aria-label="Notifications">♧</button><div className="grid h-8 w-8 place-items-center rounded-full bg-[#5278ef] text-[10px] font-bold text-white">EC</div></div>
          </header>

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-slate-50">⚙ &nbsp; Customize layout</button>
            <a href="/auth/connect-bank" className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-[#2865e9] shadow-sm transition hover:bg-blue-50">Connect bank</a>
            <button type="button" onClick={() => setIsModalOpen(true)} className="rounded-xl bg-[#2865e9] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700">＋ &nbsp; Add credit card</button>
          </div>

          {cards.length === 0 ? (
            <section className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <h2 className="text-lg font-semibold">No accounts connected yet</h2>
              <p className="mt-2 text-sm text-slate-600">Connect a bank or add a card to start tracking balances and spending.</p>
              <a href="/auth/connect-bank" className="mt-5 inline-block rounded-xl bg-[#2865e9] px-4 py-2 text-sm font-medium text-white">Connect bank</a>
            </section>
          ) : (
          <section className="mt-3 rounded-[28px] bg-[#ececec] p-3 shadow-md">
            <div className="grid auto-rows-[116px] gap-3 md:grid-cols-2 xl:grid-cols-4">
              {cards.map((card) => (
                <button key={card.id} type="button" onClick={() => focusCard(card.id)} className={`h-full w-full min-w-0 overflow-hidden rounded-xl bg-white p-3 text-left shadow-sm transition ${focusedCardId === card.id ? 'ring-2 ring-[#6cb1ff]' : 'hover:-translate-y-0.5'}`}>
                  <div className="flex gap-3"><CreditCardVisual card={card} compact /><div className="w-[125px] shrink-0 overflow-hidden pt-1"><span className={`float-right ${currentCardId === card.id ? 'text-[#2865e9]' : 'text-slate-300'}`}>★</span><h2 className="truncate text-sm font-bold">{card.name}</h2><p className="mt-1 truncate text-xs">{money.format(card.currentBalance)} this month</p><p className="truncate text-xs text-slate-600">{card.reward}</p></div></div>
                </button>
              ))}
            </div>
          </section>
          )}

          <section className="mt-4 space-y-4">
            {cards.map((card) => {
              const usage = Math.min((card.currentBalance / card.limit) * 100, 100);
              const isCurrentCard = currentCardId === card.id;
              return (
                <article id={`wallet-card-${card.id}`} key={card.id} className={`relative scroll-mt-6 rounded-[28px] border bg-white p-5 shadow-md transition ${focusedCardId === card.id ? 'border-[#a8ccff] ring-1 ring-[#e1efff]' : 'border-slate-100'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2"><h2 className="text-2xl font-bold">{card.name}</h2>{isCurrentCard && <span className="text-xl text-[#2865e9]">★</span>}</div>
                    <button type="button" onClick={() => { setCurrentCardId(card.id); setFocusedCardId(card.id); }} aria-pressed={isCurrentCard} className="shrink-0 text-center">
                      <span className={`flex h-5 w-16 overflow-hidden rounded-full ${isCurrentCard ? 'bg-[#a9c9ff]' : 'bg-[#eeeeee]'}`} aria-hidden="true">
                        <span className={`h-full w-8 rounded-full ${isCurrentCard ? 'ml-auto bg-[#2865e9]' : 'bg-[#cfcfcf]'}`} />
                      </span>
                      <span className="mt-1 block text-[11px] font-medium text-slate-600">Current card</span>
                    </button>
                  </div>
                  <div className="mt-4 grid gap-6 xl:grid-cols-[330px_minmax(260px,1fr)_190px] xl:items-center">
                    <CreditCardVisual card={card} />
                    <div className="border-y border-slate-200 py-5 xl:border-x xl:border-y-0 xl:px-8">
                      <div className="grid gap-4 sm:grid-cols-[170px_1fr] sm:items-center"><Donut card={card} /><div className="space-y-2">{card.categories.slice(0, 6).map((category) => <div key={category.label} className="rounded-lg bg-slate-50 px-2 py-1.5 text-xs"><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />{category.label} - {money.format(category.amount)}</div>)}</div></div>
                      <div className="mt-5"><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#2784c6]" style={{ width: `${usage}%` }} /></div><div className="mt-2 flex justify-between text-sm"><span>Weekly payment limit</span><span>{money.format(card.currentBalance)} / {money.format(card.limit)}</span></div></div>
                    </div>
                    <div className="text-right"><p className="text-sm text-[#1875b7]">$ <strong className="text-4xl">{card.limit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></p><p className="text-xs text-slate-400">Current balance</p><div className="mt-10 space-y-4 text-xs"><p>{card.reward.split('•')[0]} <span className="float-right">{Math.round(card.limit * 13.7).toLocaleString()}px</span></p><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#2585c5]" style={{ width: `${Math.max(usage, 8)}%` }} /></div><p>{card.reward.split('•')[1] ?? 'Available credit'} <span className="float-right">6,117px</span></p><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#2585c5]" style={{ width: '10%' }} /></div></div></div>
                  </div>
                </article>
              );
            })}
          </section>
      </main>

      {isModalOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"><div role="dialog" aria-modal="true" aria-labelledby="add-card-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex justify-between"><div><p className="text-sm font-semibold text-[#2865e9]">Wallets</p><h2 id="add-card-title" className="mt-1 text-2xl font-bold">Add credit card</h2></div><button type="button" onClick={() => setIsModalOpen(false)} className="text-2xl text-slate-500">×</button></div><form className="mt-6 space-y-4" onSubmit={addCard}><label className="block text-sm font-medium">Card name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Citi Double Cash" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" /></label><div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">Last 4 digits<input required inputMode="numeric" maxLength={4} value={lastFour} onChange={(event) => setLastFour(event.target.value.replace(/\D/g, ''))} placeholder="1234" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" /></label><label className="block text-sm font-medium">Monthly spend<input required type="number" min="0" step="0.01" value={balance} onChange={(event) => setBalance(event.target.value)} placeholder="0.00" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" /></label></div><div className="flex gap-3 pt-2"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-lg border border-slate-300 py-2.5 font-medium">Cancel</button><button type="submit" className="flex-1 rounded-lg bg-[#2865e9] py-2.5 font-medium text-white">Add card</button></div></form></div></div>}
    </div>
  );
}
