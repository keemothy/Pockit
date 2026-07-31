import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function merchantKey(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized && normalized.length <= 100 ? normalized : null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to dismiss a subscription candidate." }, { status: 401 });

  const key = merchantKey((await request.json().catch(() => null) as { merchantKey?: unknown } | null)?.merchantKey);
  if (!key) return NextResponse.json({ error: "A subscription merchant is required." }, { status: 400 });

  const { error } = await supabase
    .from("subscription_candidate_dismissals")
    .upsert({ user_id: user.id, merchant_key: key }, { onConflict: "user_id,merchant_key" });
  if (error) return NextResponse.json({ error: "Unable to dismiss this candidate." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
