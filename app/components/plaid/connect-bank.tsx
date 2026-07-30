"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";

type BankAccount = {
  id: string;
  name: string;
  type: string;
  subtype: string | null;
  mask: string | null;
  currentBalance: number | null;
  isoCurrencyCode: string | null;
};

function formatMoney(amount: number | null, currency: string | null) {
  if (amount === null) return "Unavailable";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "USD",
  }).format(amount);
}

export default function ConnectBank() {
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const createLinkToken = useCallback(async () => {
    setError(null);
    setIsConnecting(true);
    try {
      const response = await fetch("/api/plaid/link-token", { method: "POST" });
      const data = (await response.json()) as { linkToken?: string; error?: string };
      if (!response.ok || !data.linkToken) {
        setError(data.error ?? "Unable to prepare the secure bank connection.");
        return;
      }
      setLinkToken(data.linkToken);
    } catch {
      setError("Unable to prepare the secure bank connection.");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const onSuccess = useCallback(async (publicToken: string | null) => {
    if (!publicToken) return;
    setIsConnecting(true);
    setError(null);
    try {
      const response = await fetch("/api/plaid/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicToken }),
      });
      const data = (await response.json()) as { accounts?: BankAccount[]; error?: string };
      if (!response.ok || !data.accounts) {
        throw new Error(data.error ?? "Unable to retrieve your accounts.");
      }
      setAccounts(data.accounts);
      setLinkToken(null);
      // The exchange route persists the accounts before this response returns.
      // Navigate to Wallet so its server-side query reads the newly connected cards.
      router.replace("/wallet");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to retrieve your accounts.");
      void createLinkToken();
    } finally {
      setIsConnecting(false);
    }
  }, [createLinkToken, router]);

  const { open, ready } = usePlaidLink({ token: linkToken, onSuccess });

  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">Secure connection</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Connect your bank or card</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Pockit uses Plaid Link so you sign in directly with your financial institution. We never see your bank password.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (linkToken && ready) open();
            else if (!linkToken) void createLinkToken();
          }}
          disabled={isConnecting || Boolean(linkToken && !ready)}
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isConnecting
            ? "Preparing secure connection…"
            : linkToken && ready
              ? "Connect account"
              : linkToken
                ? "Loading secure connection…"
                : "Prepare secure connection"}
        </button>
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {accounts.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-5">
          <h2 className="text-lg font-semibold text-slate-900">Connected accounts</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {accounts.map((account) => (
              <li key={account.id} className="rounded-xl border border-slate-200 p-4">
                <p className="font-medium text-slate-900">{account.name} {account.mask ? `••${account.mask}` : ""}</p>
                <p className="mt-1 text-sm capitalize text-slate-500">{account.subtype ?? account.type}</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{formatMoney(account.currentBalance, account.isoCurrencyCode)}</p>
                <p className="text-xs text-slate-500">Current balance</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
