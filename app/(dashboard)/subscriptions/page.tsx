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
  const hasConnectedBank = activeAccounts.length > 0;

  const subscriptions = await getSubscriptionCandidates(
    user.id,
    activeAccounts.map((a) => ({ plaidAccountId: a.plaid_account_id, plaidItemId: a.plaid_item_id })),
  ).catch(() => []);

  const { data: savedSubscriptions } = await supabase
    .from("subscriptions")
    .select("id, display_name, merchant_name, amount, cadence, last_charged_on, next_renewal_date, detailed_category, confidence, source, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("next_renewal_date", { ascending: true, nullsFirst: false });
  const confirmed = savedSubscriptions ?? [];
  const confirmedMerchants = new Set(confirmed.map((subscription) => subscription.merchant_name.trim().toLowerCase()));
  const { data: dismissedCandidates } = await supabase
    .from("subscription_candidate_dismissals")
    .select("merchant_key")
    .eq("user_id", user.id);
  const dismissedCandidateKeys = (dismissedCandidates ?? []).map((candidate) => candidate.merchant_key);
  const candidates = subscriptions.filter((subscription) =>
    !confirmedMerchants.has(subscription.name.trim().toLowerCase())
    && !dismissedCandidateKeys.includes(subscription.name.trim().toLowerCase()),
  );

  return (
    <SubscriptionsContent
      candidates={candidates}
      dismissedCandidateKeys={dismissedCandidateKeys}
      confirmedSubscriptions={confirmed.map((subscription) => ({
        id: subscription.id,
        displayName: subscription.display_name,
        merchantName: subscription.merchant_name,
        amount: Number(subscription.amount),
        cadence: subscription.cadence as "weekly" | "monthly" | "annual" | "custom",
        lastChargedOn: subscription.last_charged_on,
        nextRenewalDate: subscription.next_renewal_date,
        detailedCategory: subscription.detailed_category,
        confidence: subscription.confidence,
        source: subscription.source as "plaid" | "manual",
      }))}
      hasConnectedBank={hasConnectedBank}
    />
  );
}
