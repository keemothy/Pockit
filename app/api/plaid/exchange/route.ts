import { NextRequest, NextResponse } from "next/server";
import { hasPlaidCredentials, plaidClient } from "@/lib/plaid";
import { encryptAccessToken } from "@/lib/plaid-crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!hasPlaidCredentials()) {
    return NextResponse.json(
      { error: "Plaid has not been configured. Add PLAID_CLIENT_ID and PLAID_SECRET to .env.local." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as { publicToken?: unknown } | null;
  if (!body || typeof body.publicToken !== "string" || !body.publicToken) {
    return NextResponse.json({ error: "A valid Plaid public token is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to connect a bank account." }, { status: 401 });
  }

  try {
    const exchange = await plaidClient.itemPublicTokenExchange({ public_token: body.publicToken });
    const accounts = await plaidClient.accountsGet({ access_token: exchange.data.access_token });
    const creditCardAccounts = accounts.data.accounts.filter(
      (account) => account.type === "credit" && account.subtype === "credit card",
    );
    if (creditCardAccounts.length === 0) {
      await plaidClient.itemRemove({ access_token: exchange.data.access_token });
      return NextResponse.json(
        { error: "No credit card account was selected. Connect a bank with a credit card to continue." },
        { status: 422 },
      );
    }
    const encryptedToken = encryptAccessToken(exchange.data.access_token);
    const admin = createAdminClient();

    const { data: plaidItem, error: itemError } = await admin
      .from("plaid_items")
      .upsert({
        user_id: user.id,
        plaid_item_id: exchange.data.item_id,
        access_token_ciphertext: encryptedToken.ciphertext,
        access_token_iv: encryptedToken.iv,
        access_token_auth_tag: encryptedToken.authTag,
      }, { onConflict: "plaid_item_id" })
      .select("id")
      .single();

    if (itemError || !plaidItem) throw itemError ?? new Error("Unable to save the connected bank.");

    // Link filters prevent non-credit accounts from being authorized for new
    // Items. Keep the same rule here as a server-side safeguard before any
    // account summary is persisted in Supabase.
    const accountRows = creditCardAccounts.map((account) => ({
      user_id: user.id,
      plaid_item_id: plaidItem.id,
      plaid_account_id: account.account_id,
      name: account.name,
      official_name: account.official_name,
      type: account.type,
      subtype: account.subtype,
      mask: account.mask,
      current_balance: account.balances.current,
      available_balance: account.balances.available,
      credit_limit: account.balances.limit,
      iso_currency_code: account.balances.iso_currency_code,
    }));
    const { error: accountsError } = await admin.from("financial_accounts").upsert(accountRows, { onConflict: "plaid_account_id" });
    if (accountsError) throw accountsError;

    return NextResponse.json({
      itemId: exchange.data.item_id,
      accounts: creditCardAccounts.map((account) => ({
        id: account.account_id,
        name: account.name,
        officialName: account.official_name,
        type: account.type,
        subtype: account.subtype,
        mask: account.mask,
        currentBalance: account.balances.current,
        availableBalance: account.balances.available,
        creditLimit: account.balances.limit,
        isoCurrencyCode: account.balances.iso_currency_code,
      })),
    });
  } catch (error) {
    console.error("Unable to exchange Plaid public token", error);
    return NextResponse.json(
      { error: "We could not retrieve your account information. Please reconnect your bank." },
      { status: 502 },
    );
  }
}
