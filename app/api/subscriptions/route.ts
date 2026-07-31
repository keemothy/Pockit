import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CADENCES = ["weekly", "monthly", "annual", "custom"] as const;
type Cadence = typeof CADENCES[number];

function parseSubscription(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const validDate = (date: unknown) => date === null || date === undefined || (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date));
  if (typeof data.displayName !== "string" || !data.displayName.trim() || data.displayName.length > 100
    || typeof data.merchantName !== "string" || !data.merchantName.trim() || data.merchantName.length > 100
    || typeof data.amount !== "number" || !Number.isFinite(data.amount) || data.amount < 0
    || !CADENCES.includes(data.cadence as Cadence) || !validDate(data.lastChargedOn) || !validDate(data.nextRenewalDate)) return null;
  return {
    display_name: data.displayName.trim(), merchant_name: data.merchantName.trim(), amount: data.amount,
    cadence: data.cadence as Cadence, last_charged_on: data.lastChargedOn || null, next_renewal_date: data.nextRenewalDate || null,
    detailed_category: typeof data.detailedCategory === "string" ? data.detailedCategory.slice(0, 100) : null,
    confidence: typeof data.confidence === "number" && data.confidence >= 0 && data.confidence <= 100 ? Math.round(data.confidence) : null,
    source: data.source === "plaid" ? "plaid" : "manual",
  };
}

async function userClient() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); return { supabase, user }; }

export async function POST(request: Request) {
  const { supabase, user } = await userClient();
  if (!user) return NextResponse.json({ error: "Sign in to save a subscription." }, { status: 401 });
  const subscription = parseSubscription(await request.json().catch(() => null));
  if (!subscription) return NextResponse.json({ error: "Enter valid subscription details." }, { status: 400 });
  const { data, error } = await supabase.from("subscriptions").insert({ ...subscription, user_id: user.id }).select().single();
  if (error || !data) return NextResponse.json({ error: "Unable to save this subscription." }, { status: 500 });
  return NextResponse.json({ subscription: data });
}

export async function PATCH(request: Request) {
  const { supabase, user } = await userClient();
  if (!user) return NextResponse.json({ error: "Sign in to update a subscription." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const subscription = parseSubscription(body);
  if (!body || typeof body.id !== "string" || !subscription) return NextResponse.json({ error: "Enter valid subscription details." }, { status: 400 });
  const { data, error } = await supabase.from("subscriptions").update(subscription).eq("id", body.id).eq("user_id", user.id).select().single();
  if (error || !data) return NextResponse.json({ error: "Unable to update this subscription." }, { status: 500 });
  return NextResponse.json({ subscription: data });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await userClient();
  if (!user) return NextResponse.json({ error: "Sign in to remove a subscription." }, { status: 401 });
  const body = await request.json().catch(() => null) as { id?: unknown } | null;
  if (!body || typeof body.id !== "string") return NextResponse.json({ error: "A subscription is required." }, { status: 400 });
  const { error } = await supabase.from("subscriptions").delete().eq("id", body.id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Unable to remove this subscription." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
