import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function money(amount: number | null, currency: string | null) {
  if (amount === null) return "Unavailable";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency ?? "USD" }).format(amount);
}

export default async function WalletPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: accounts } = await supabase
    .from("financial_accounts")
    .select("id, name, type, subtype, mask, current_balance, available_balance, credit_limit, iso_currency_code")
    .eq("user_id", user.id)
    .order("name");

  return (
    <section>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Wallet</h1>
          <p className="mt-1 text-slate-600">Your connected accounts and balances.</p>
        </div>
        <a href="/auth/connect-bank" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Connect bank</a>
      </div>

      {accounts?.length ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <li key={account.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="font-medium text-slate-900">{account.name} {account.mask ? `••${account.mask}` : ""}</p>
              <p className="mt-1 text-sm capitalize text-slate-500">{account.subtype ?? account.type}</p>
              <p className="mt-4 text-2xl font-semibold text-slate-900">{money(account.current_balance, account.iso_currency_code)}</p>
              <p className="text-xs text-slate-500">Current balance</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="font-semibold text-slate-900">No accounts connected yet</h2>
          <p className="mt-2 text-sm text-slate-600">Connect a bank or card to see your balances here.</p>
        </div>
      )}
    </section>
  );
}
