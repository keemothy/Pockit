import { NextResponse } from 'next/server';
import { getCardCatalog } from '@/lib/rewards/card-catalog';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to match a card.' }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid card match request.' }, { status: 400 });
  }
  const { cardId, catalogCardId } = body as Record<string, unknown>;
  if (typeof cardId !== 'string' || typeof catalogCardId !== 'string') {
    return NextResponse.json({ error: 'Choose a card from the catalog.' }, { status: 400 });
  }

  const catalog = await getCardCatalog().catch(() => []);
  if (!catalog.some((card) => card.cardId === catalogCardId)) {
    return NextResponse.json({ error: 'The selected card is not available in the catalog.' }, { status: 400 });
  }

  const metadata = user.user_metadata as Record<string, unknown>;
  const currentOverrides = metadata.card_identity_overrides;
  const overrides = currentOverrides && typeof currentOverrides === 'object' && !Array.isArray(currentOverrides)
    ? { ...currentOverrides as Record<string, unknown> }
    : {};
  overrides[cardId] = { cardId: catalogCardId };

  const { error } = await supabase.auth.updateUser({
    data: { card_identity_overrides: overrides },
  });
  if (error) return NextResponse.json({ error: 'Unable to save the card match.' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
