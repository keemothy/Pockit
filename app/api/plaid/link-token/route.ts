import { NextResponse } from "next/server";
import { CountryCode, CreditAccountSubtype, Products } from "plaid";
import { hasPlaidCredentials, plaidClient } from "@/lib/plaid";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  if (!hasPlaidCredentials()) {
    return NextResponse.json(
      { error: "Plaid has not been configured. Add PLAID_CLIENT_ID and PLAID_SECRET to .env.local." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to connect a bank account." }, { status: 401 });
  }

  try {
    const response = await plaidClient.linkTokenCreate({
      client_name: "Pockit",
      country_codes: [CountryCode.Us],
      language: "en",
      products: [Products.Transactions],
      // Wallets tracks credit cards only. Restrict Link before authorization so
      // checking, savings, and other account types are never added to the Item.
      account_filters: {
        credit: { account_subtypes: [CreditAccountSubtype.CreditCard] },
      },
      user: { client_user_id: user.id },
    });

    return NextResponse.json({ linkToken: response.data.link_token });
  } catch (error) {
    console.error("Unable to create Plaid Link token", error);
    return NextResponse.json(
      { error: "Unable to start the secure bank connection. Please try again." },
      { status: 502 },
    );
  }
}
