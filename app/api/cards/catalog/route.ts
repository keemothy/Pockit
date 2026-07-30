import { NextResponse } from 'next/server';
import { CARD_CATALOG_SOURCE, getCardCatalog } from '@/lib/rewards/card-catalog';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const cards = await getCardCatalog();

    return NextResponse.json({
      cards,
      source: CARD_CATALOG_SOURCE,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Unable to load credit card catalog', error);
    return NextResponse.json(
      { error: 'Unable to load the credit card catalog.' },
      { status: 502 },
    );
  }
}
