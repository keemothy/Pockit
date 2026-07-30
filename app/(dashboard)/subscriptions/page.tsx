import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionCandidates } from "@/lib/plaid-analytics";
import { getPlaidEnvironment } from "@/lib/plaid";
import SubscriptionsContent from "./subscriptions-content";

function readPlaidItemEnvironments(metadata: Record<string, unknown>) {
  const value = metadata.plaid_item_environments;
  if (!value || typeof value !== "object" || Array.isArray(value)) return {} as Record<string, string>;
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) =>
      v === "sandbox" || v === "development" || v === "production",
    ),
  );
}

export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const userMetadata = user.user_metadata as Record<string, unknown>;
  const plaidItemEnvironments = readPlaidItemEnvironments(userMetadata);
  const activePlaidEnvironment = getPlaidEnvironment();

  const { data: accounts } = await supabase
    .from("financial_accounts")
    .select("id, plaid_item_id, plaid_account_id, type")
    .eq("user_id", user.id);

  const activeAccounts = (accounts ?? []).filter(
    (a) => plaidItemEnvironments[a.plaid_item_id] === activePlaidEnvironment,
  );
  const creditAccounts = activeAccounts.filter((a) => a.type?.toLowerCase() === "credit");
  const hasConnectedBank = activeAccounts.length > 0;

  const subscriptions = await getSubscriptionCandidates(
    user.id,
    creditAccounts.map((a) => ({ plaidAccountId: a.plaid_account_id, plaidItemId: a.plaid_item_id })),
  ).catch(() => []);

  const monthlyTotal = subscriptions.reduce((s, sub) => s + sub.amount, 0);

  return (
    <SubscriptionsContent
      subscriptions={subscriptions}
      hasConnectedBank={hasConnectedBank}
      monthlyTotal={monthlyTotal}
    />
  );
}
