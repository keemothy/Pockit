import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type CategoryInput = { label: string; amount: number };
type MonthlyCategoriesInput = Record<string, CategoryInput[]>;

function validCategories(value: unknown): value is CategoryInput[] {
  return Array.isArray(value) && value.length <= 12 && value.every((category) => {
    if (!category || typeof category !== "object") return false;
    const candidate = category as Record<string, unknown>;
    return typeof candidate.label === "string"
      && candidate.label.trim().length <= 60
      && typeof candidate.amount === "number"
      && Number.isFinite(candidate.amount)
      && candidate.amount >= 0;
  });
}

function validMonthlyCategories(value: unknown): value is MonthlyCategoriesInput {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    && Object.entries(value as Record<string, unknown>).every(([month, categories]) => (
      /^\d{4}-(0[1-9]|1[0-2])$/.test(month) && validCategories(categories)
    ));
}

function parseCard(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const value = body as Record<string, unknown>;
  const { name, lastFour, currentBalance, creditLimit, categories, spendingMonth, monthlyCategories, catalogCardId } = value;
  const normalizedMonthlyCategories = validMonthlyCategories(monthlyCategories)
    ? Object.fromEntries(Object.entries(monthlyCategories).map(([month, entries]) => [month, entries
      .filter((category) => category.amount > 0)
      .map((category) => ({ label: category.label.trim(), amount: category.amount }))]))
    : validCategories(categories) && typeof spendingMonth === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(spendingMonth)
      ? { [spendingMonth]: categories.filter((category) => category.amount > 0).map((category) => ({ label: category.label.trim(), amount: category.amount })) }
      : null;
  if (
    typeof name !== "string" || !name.trim() || name.trim().length > 100
    || typeof lastFour !== "string" || !/^\d{4}$/.test(lastFour)
    || typeof currentBalance !== "number" || !Number.isFinite(currentBalance) || currentBalance < 0
    || typeof creditLimit !== "number" || !Number.isFinite(creditLimit) || creditLimit <= 0
    || !normalizedMonthlyCategories
    || (catalogCardId !== undefined && catalogCardId !== null && typeof catalogCardId !== "string")
  ) return null;

  return {
    name: name.trim(),
    last_four: lastFour,
    current_balance: currentBalance,
    credit_limit: creditLimit,
    monthly_categories: normalizedMonthlyCategories,
    catalog_card_id: typeof catalogCardId === "string" && catalogCardId.trim() ? catalogCardId : null,
  };
}

async function signedInUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function POST(request: Request) {
  const { supabase, user } = await signedInUser();
  if (!user) return NextResponse.json({ error: "Sign in to save a card." }, { status: 401 });
  const card = parseCard(await request.json().catch(() => null));
  if (!card) return NextResponse.json({ error: "Enter valid card details." }, { status: 400 });

  const { monthly_categories, ...cardValues } = card;
  const { data, error } = await supabase.from("manual_cards").insert({ ...cardValues, user_id: user.id, spending_categories: monthly_categories }).select().single();
  if (error || !data) return NextResponse.json({ error: "Unable to save this card." }, { status: 500 });
  return NextResponse.json({ card: data });
}

export async function PATCH(request: Request) {
  const { supabase, user } = await signedInUser();
  if (!user) return NextResponse.json({ error: "Sign in to update a card." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const card = parseCard(body);
  if (!body || typeof body.id !== "string" || !card) return NextResponse.json({ error: "Enter valid card details." }, { status: 400 });

  const { data: existing } = await supabase.from("manual_cards").select("id").eq("id", body.id).eq("user_id", user.id).single();
  if (!existing) return NextResponse.json({ error: "Card not found." }, { status: 404 });
  const { monthly_categories, ...cardValues } = card;
  const { data, error } = await supabase.from("manual_cards").update({ ...cardValues, spending_categories: monthly_categories }).eq("id", body.id).eq("user_id", user.id).select().single();
  if (error || !data) return NextResponse.json({ error: "Unable to update this card." }, { status: 500 });
  return NextResponse.json({ card: data });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await signedInUser();
  if (!user) return NextResponse.json({ error: "Sign in to delete a card." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.id !== "string") return NextResponse.json({ error: "A card is required." }, { status: 400 });

  const { error } = await supabase.from("manual_cards").delete().eq("id", body.id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Unable to delete this card." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
