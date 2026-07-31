import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrivacySettings from "./privacy-settings";

export default async function PrivacySettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: accounts } = await supabase
    .from("financial_accounts")
    .select("id, plaid_item_id, name, official_name, type, subtype, mask")
    .eq("user_id", user.id)
    .order("name");

  const connections = Object.values(
    (accounts ?? []).reduce<Record<string, { id: string; name: string; accounts: string[] }>>(
      (items, account) => {
        const connection = items[account.plaid_item_id] ?? {
          id: account.plaid_item_id,
          name: account.official_name ?? account.name,
          accounts: [],
        };
        connection.accounts.push(`${account.name}${account.mask ? ` ••${account.mask}` : ""}`);
        items[account.plaid_item_id] = connection;
        return items;
      },
      {},
    ),
  );

  return (
    <section className="mx-auto w-full max-w-6xl pb-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-slate-600">Manage your account, preferences, and privacy.</p>
      </div>
      <PrivacySettings connections={connections} />
    </section>
  );
}
