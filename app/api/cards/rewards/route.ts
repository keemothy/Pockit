import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RewardInput = {
  label: string;
  multiplier: number;
  rewardCurrency?: string;
};

function isRewardInput(value: unknown): value is RewardInput {
  if (!value || typeof value !== 'object') return false;
  const reward = value as Record<string, unknown>;
  return typeof reward.label === 'string'
    && reward.label.trim().length > 0
    && reward.label.trim().length <= 60
    && typeof reward.multiplier === 'number'
    && Number.isFinite(reward.multiplier)
    && reward.multiplier > 0
    && reward.multiplier <= 100;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to save reward rates.' }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid reward request.' }, { status: 400 });
  const { cardId, rewards } = body as Record<string, unknown>;
  if (typeof cardId !== 'string' || !Array.isArray(rewards) || rewards.length > 8 || !rewards.every(isRewardInput)) {
    return NextResponse.json({ error: 'Provide up to eight valid reward rates.' }, { status: 400 });
  }

  const currentMetadata = user.user_metadata as Record<string, unknown>;
  const currentOverrides = currentMetadata.card_reward_overrides;
  const overrides = currentOverrides && typeof currentOverrides === 'object' && !Array.isArray(currentOverrides)
    ? { ...currentOverrides as Record<string, unknown> }
    : {};
  overrides[cardId] = rewards.map((reward) => ({
    label: reward.label.trim(),
    multiplier: reward.multiplier,
    rewardCurrency: reward.rewardCurrency ?? 'POINTS',
  }));

  const { error } = await supabase.auth.updateUser({ data: { card_reward_overrides: overrides } });
  if (error) return NextResponse.json({ error: 'Unable to save reward rates.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
