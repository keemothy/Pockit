import { NextRequest, NextResponse } from 'next/server';
import { decryptAccessToken } from '@/lib/plaid-crypto';
import { hasPlaidCredentials, plaidClient } from '@/lib/plaid';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!hasPlaidCredentials()) {
    return NextResponse.json({ error: 'Plaid has not been configured.' }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { plaidItemId?: unknown } | null;
  if (!body || typeof body.plaidItemId !== 'string' || !body.plaidItemId) {
    return NextResponse.json({ error: 'A valid connected bank is required.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in to disconnect a bank.' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: item, error: itemError } = await admin
    .from('plaid_items')
    .select('id, access_token_ciphertext, access_token_iv, access_token_auth_tag')
    .eq('id', body.plaidItemId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (itemError) {
    console.error('Unable to find Plaid item for disconnect', itemError);
    return NextResponse.json({ error: 'Unable to find this connected bank.' }, { status: 500 });
  }
  if (!item) {
    return NextResponse.json({ error: 'This connected bank was not found.' }, { status: 404 });
  }

  try {
    const accessToken = decryptAccessToken({
      ciphertext: item.access_token_ciphertext,
      iv: item.access_token_iv,
      authTag: item.access_token_auth_tag,
    });
    await plaidClient.itemRemove({ access_token: accessToken });

    const { error: deleteError } = await admin
      .from('plaid_items')
      .delete()
      .eq('id', item.id)
      .eq('user_id', user.id);
    if (deleteError) throw deleteError;

    return NextResponse.json({ disconnected: true });
  } catch (error) {
    console.error('Unable to disconnect Plaid item', error);
    return NextResponse.json(
      { error: 'Unable to disconnect this bank. Please try again.' },
      { status: 502 },
    );
  }
}
