import { NextRequest, NextResponse } from "next/server";
import { getPlaidEnvironment, type PlaidEnvironment } from "@/lib/plaid";
import { syncCompletedMonthlySpendingSummaries } from "@/lib/monthly-spending-summaries";
import { createAdminClient } from "@/lib/supabase/admin";

function environments(metadata: Record<string, unknown>) {
  const value = metadata.plaid_item_environments;
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, PlaidEnvironment> : {};
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: accounts, error } = await admin
    .from("financial_accounts")
    .select("id, user_id, plaid_item_id, plaid_account_id, type")
    .eq("type", "credit");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const activeEnvironment = getPlaidEnvironment();
  const byUser = Map.groupBy(accounts ?? [], (account) => account.user_id);
  let syncedUsers = 0;
  for (const [userId, userAccounts] of byUser) {
    const { data: userResult } = await admin.auth.admin.getUserById(userId);
    const itemEnvironments = environments((userResult.user?.user_metadata ?? {}) as Record<string, unknown>);
    const eligible = userAccounts
      .filter((account) => itemEnvironments[account.plaid_item_id] === activeEnvironment)
      .map((account) => ({ id: account.id, plaidItemId: account.plaid_item_id, plaidAccountId: account.plaid_account_id }));
    try {
      await syncCompletedMonthlySpendingSummaries(userId, eligible);
      syncedUsers += 1;
    } catch {
      // A single institution or user should not prevent the scheduled job.
    }
  }
  return NextResponse.json({ syncedUsers });
}
