"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Connection = { id: string; name: string; accounts: string[] };

const tabs = [
  { href: "/settings/profile", label: "Profile & account" },
  { href: "/settings/security", label: "Security" },
  { href: "/settings/notifications", label: "Notifications" },
  { href: "/settings/appearance", label: "Appearance" },
  { href: "/settings/privacy", label: "Privacy & data" },
];

export default function PrivacySettings({ connections: initialConnections }: { connections: Connection[] }) {
  const router = useRouter();
  const [connections, setConnections] = useState(initialConnections);
  const [showConnections, setShowConnections] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function downloadData() {
    setStatus(null);
    setIsExporting(true);
    const response = await fetch("/api/privacy/export");
    setIsExporting(false);
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus(data?.error ?? "Unable to prepare your data export.");
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pockit-data-export.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setStatus("Your Pockit data export has downloaded.");
  }

  async function disconnect(connection: Connection) {
    if (!window.confirm(`Disconnect ${connection.name}? This removes its linked accounts and stored data from Pockit.`)) return;

    setStatus(null);
    setIsDisconnecting(connection.id);
    const response = await fetch("/api/plaid/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plaidItemId: connection.id }),
    });
    setIsDisconnecting(null);
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus(data?.error ?? "Unable to disconnect this institution.");
      return;
    }

    setConnections((current) => current.filter((item) => item.id !== connection.id));
    setStatus(`${connection.name} has been disconnected.`);
    router.refresh();
  }

  async function deleteAccount() {
    if (confirmation !== "confirm") return;

    setIsDeleting(true);
    setStatus(null);
    const response = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation }),
    });
    setIsDeleting(false);
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus(data?.error ?? "Unable to delete your account.");
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/auth/login");
    router.refresh();
  }

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Privacy &amp; data</h2>
      <p className="mt-1 text-sm text-slate-600">Control exports, connected financial data, and account deletion.</p>

      <nav aria-label="Settings sections" className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => {
          const active = tab.href === "/settings/privacy";
          return <Link key={tab.href} href={tab.href} aria-current={active ? "page" : undefined} className={`shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${active ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"}`}>{tab.label}</Link>;
        })}
      </nav>

      <section className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Your data</p>
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <SettingRow title="Download your data" description="Download your saved spending summaries, subscriptions, and cards as a JSON file." action={<button type="button" disabled={isExporting} onClick={() => void downloadData()} className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">{isExporting ? "Preparing…" : "Download data"}</button>} />
          <div className="border-t border-slate-200">
            <SettingRow title="Connected financial data" description="Manage cards, accounts, and banks linked through Plaid." action={<button type="button" onClick={() => setShowConnections((value) => !value)} className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{showConnections ? "Done" : "Manage access"}</button>} />
            {showConnections && <div className="border-t border-slate-200 bg-slate-50 p-5">
              {connections.length === 0 ? <p className="text-sm text-slate-500">No Plaid accounts are currently connected.</p> : <ul className="space-y-3">{connections.map((connection) => <li key={connection.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">{connection.name}</p><p className="mt-1 text-sm text-slate-500">{connection.accounts.join(", ")}</p></div><button type="button" disabled={isDisconnecting === connection.id} onClick={() => void disconnect(connection)} className="cursor-pointer rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">{isDisconnecting === connection.id ? "Disconnecting…" : "Disconnect"}</button></li>)}</ul>}
            </div>}
          </div>
        </div>
      </section>

      <section className="mt-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Danger zone</p>
        <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50/40 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="font-semibold text-slate-900">Delete Pockit account</h3><p className="mt-1 text-sm text-slate-500">Permanently remove your account and all associated data.</p></div>
          <button type="button" onClick={() => { setShowDeleteDialog(true); setConfirmation(""); setStatus(null); }} className="cursor-pointer rounded-xl border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50">Delete account</button>
        </div>
      </section>

      <p role="status" aria-live="polite" className="mt-5 text-sm text-slate-500">{status}</p>

      {showDeleteDialog && <div role="dialog" aria-modal="true" aria-labelledby="delete-account-title" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><h3 id="delete-account-title" className="text-xl font-semibold text-slate-900">Delete your account?</h3><p className="mt-2 text-sm leading-6 text-slate-600">This permanently revokes Plaid connections, removes your Pockit data and profile image, and deletes your account. This cannot be undone.</p><label className="mt-5 block text-sm font-medium text-slate-700">Type <span className="font-semibold">confirm</span> to continue<input autoFocus value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100" /></label><div className="mt-6 flex justify-end gap-3"><button type="button" disabled={isDeleting} onClick={() => setShowDeleteDialog(false)} className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="button" disabled={confirmation !== "confirm" || isDeleting} onClick={() => void deleteAccount()} className="cursor-pointer rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300">{isDeleting ? "Deleting…" : "Delete account"}</button></div></div></div>}
    </div>
  );
}

function SettingRow({ title, description, action }: { title: string; description: string; action: React.ReactNode }) {
  return <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold text-slate-900">{title}</h3><p className="mt-1 text-sm text-slate-500">{description}</p></div>{action}</div>;
}
