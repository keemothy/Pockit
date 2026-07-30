import rewardRulesData from '@/data/reward-rules.json';

export type RewardCategory =
  | 'dining'
  | 'travel'
  | 'groceries'
  | 'gas'
  | 'transit'
  | 'online-shopping'
  | 'other';

export type RewardRule = {
  cardId: string;
  category: RewardCategory;
  multiplier: number;
  rewardCurrency: string;
  sourceName: string;
  sourceUrl: string;
  verifiedAt: string;
  notes?: string;
};

export const rewardRuleMetadata = {
  schemaVersion: rewardRulesData.schemaVersion,
  lastReviewedAt: rewardRulesData.lastReviewedAt,
  disclaimer: rewardRulesData.disclaimer,
};

export const rewardRules = rewardRulesData.rules as RewardRule[];

export function getRewardRulesForCard(cardId: string | undefined): RewardRule[] {
  if (!cardId) return [];
  return rewardRules.filter((rule) => rule.cardId === cardId);
}
