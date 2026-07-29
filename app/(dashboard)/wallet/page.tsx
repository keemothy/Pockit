import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import WalletDashboard, { type WalletCard } from './wallet-dashboard';

const categoryColors = ['#2184c7', '#ff9a57', '#9747ba', '#aac437'];

export default async function WalletPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: accounts } = await supabase
    .from('financial_accounts')
    .select('id, name, type, subtype, mask, current_balance, available_balance, credit_limit, iso_currency_code')
    .eq('user_id', user.id)
    .order('name');

  const creditCardAccounts = (accounts ?? []).filter(
    (account) => account.type?.toLowerCase() === 'credit',
  );

  const cards: WalletCard[] = creditCardAccounts.map((account, index) => {
    const balance = Math.max(Number(account.current_balance) || 0, 0);
    const available = Math.max(Number(account.available_balance) || 0, 0);
    const reportedLimit = Math.max(Number(account.credit_limit) || 0, 0);
    const limit = reportedLimit || balance + available || Math.max(balance, 1);

    return {
      id: account.id,
      name: account.name,
      issuer: (account.subtype ?? account.type ?? 'CONNECTED ACCOUNT').toUpperCase(),
      lastFour: account.mask ?? '••••',
      currentBalance: balance,
      limit,
      color: index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'rainbow' : 'black',
      reward: 'Credit card',
      categories: [
        {
          label: 'Current balance',
          amount: balance || 1,
          color: categoryColors[index % categoryColors.length],
        },
      ],
    };
  });

  return <WalletDashboard initialCards={cards} />;
}
