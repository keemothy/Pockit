import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to export your data." }, { status: 401 });

  const [accounts, manualCards, spendingSummaries, subscriptions] = await Promise.all([
    supabase.from("financial_accounts").select("name, official_name, type, subtype, mask, current_balance, available_balance, credit_limit, iso_currency_code, created_at").eq("user_id", user.id).order("name"),
    supabase.from("manual_cards").select("name, last_four, current_balance, credit_limit, spending_categories, catalog_card_id, created_at").eq("user_id", user.id).order("created_at"),
    supabase.from("monthly_spending_summaries").select("month, category, amount, created_at").eq("user_id", user.id).order("month"),
    supabase.from("subscriptions").select("display_name, merchant_name, amount, cadence, last_charged_on, next_renewal_date, detailed_category, source, status, created_at").eq("user_id", user.id).order("created_at"),
  ]);
  const failedQuery = [
    { label: "connected accounts", result: accounts },
    { label: "manually added cards", result: manualCards },
    { label: "monthly spending summaries", result: spendingSummaries },
    { label: "subscriptions", result: subscriptions },
  ].find(({ result }) => result.error);
  if (failedQuery?.result.error) {
    console.error("Unable to prepare data export", failedQuery.label, failedQuery.result.error);
    return NextResponse.json(
      { error: `Unable to export ${failedQuery.label}: ${failedQuery.result.error.message}` },
      { status: 500 },
    );
  }

  const exportData = {
    exported_at: new Date().toISOString(),
    format_version: 1,
    note: "Pockit retains monthly spending category summaries, not individual transaction records.",
    connected_accounts: accounts.data ?? [],
    manually_added_cards: manualCards.data ?? [],
    monthly_spending_summaries: spendingSummaries.data ?? [],
    subscriptions: subscriptions.data ?? [],
  };
  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="pockit-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
