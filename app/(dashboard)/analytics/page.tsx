import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSpendingByCategory } from "@/lib/plaid-analytics";
import { getPlaidEnvironment } from "@/lib/plaid";
import AnalyticsContent from "./analytics-content";

function readPlaidItemEnvironments(metadata: Record<string, unknown>) {
  const value = metadata.plaid_item_environments;
  if (!value || typeof value !== "object" || Array.isArray(value)) return {} as Record<string, string>;
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) =>
      v === "sandbox" || v === "development" || v === "production",
    ),
  );
}

function isoMonthStart() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export default async function AnalyticsPage() {
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

  const startDate = isoMonthStart();
  const endDate = new Date().toISOString().slice(0, 10);

  const periodLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "America/Los_Angeles",
  }).format(new Date());

  const categories = await getSpendingByCategory(
    user.id,
    creditAccounts.map((a) => ({ plaidAccountId: a.plaid_account_id, plaidItemId: a.plaid_item_id })),
    startDate,
    endDate,
  ).catch(() => []);

  return (
    <AnalyticsContent
      categories={categories}
      hasConnectedBank={hasConnectedBank}
      cardCount={creditAccounts.length}
      periodLabel={periodLabel}
    />
  );
}
