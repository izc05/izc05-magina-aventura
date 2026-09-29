export type KnowledgeKind = 'fact' | 'tradition' | 'interpretation';

export interface KnowledgeSource {
  url: string;
  title: string;
  publisher?: string;
  lastVerifiedAt: string;
}

export interface KnowledgeCardDefinition {
  id: string;
  kind: KnowledgeKind;
  title: string;
  summary: string;
  body?: string;
  sourceUrls: string[];
}

export interface PhotoSpotDefinition {
  id: string;
  checkpointId: string;
  title: string;
  prompt?: string;
  communityEligible: boolean;
}

export interface CollectibleDefinition {
  id: string;
  title: string;
  category:
    | 'flora'
    | 'fauna'
    | 'heritage'
    | 'olive'
    | 'tradition'
    | 'landscape';
  rarityCode: string;
  discoveryId?: string;
}

export interface SponsorRewardDefinition {
  id: string;
  sponsorId: string;
  title: string;
  description: string;
  rewardType: 'percentage_discount' | 'fixed_discount' | 'perk';
  discountValue?: number;
  terms: string;
  validFrom: string;
  validUntil: string;
  maxRedemptions?: number;
  redemptionMode: 'single_use_code' | 'qr' | 'staff_validation';
  eligibleRouteIds: string[];
  requiredCompletionFacts: string[];
  active: boolean;
}

export interface AdventureContentDefinition {
  routeId: string;
  contentVersion: number;
  title: string;
  subtitle?: string;
  knowledgeCards: KnowledgeCardDefinition[];
  photoSpots: PhotoSpotDefinition[];
  collectibles: CollectibleDefinition[];
  sponsorRewards: SponsorRewardDefinition[];
  sources: KnowledgeSource[];
}

export interface AdventureSessionTrust {
  qaSimulated: boolean;
  physicalGpsValidated: boolean;
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} must be non-empty`);
  }
}

function assertIsoDate(value: string, field: string): void {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`${field} must be a valid ISO date/time`);
  }
}

export function validateAdventureContent(
  content: AdventureContentDefinition,
): AdventureContentDefinition {
  assertNonEmpty(content.routeId, 'routeId');
  if (!Number.isInteger(content.contentVersion) || content.contentVersion < 1) {
    throw new Error('contentVersion must be a positive integer');
  }
  assertNonEmpty(content.title, 'title');

  const ids = new Set<string>();
  const register = (id: string, field: string) => {
    assertNonEmpty(id, field);
    if (ids.has(id)) throw new Error(`Duplicate adventure content id: ${id}`);
    ids.add(id);
  };

  const sourceUrls = new Set<string>();
  for (const [index, source] of content.sources.entries()) {
    assertNonEmpty(source.url, `sources[${index}].url`);
    assertNonEmpty(source.title, `sources[${index}].title`);
    assertIsoDate(source.lastVerifiedAt, `sources[${index}].lastVerifiedAt`);
    sourceUrls.add(source.url);
  }

  for (const [index, card] of content.knowledgeCards.entries()) {
    register(card.id, `knowledgeCards[${index}].id`);
    assertNonEmpty(card.title, `knowledgeCards[${index}].title`);
    assertNonEmpty(card.summary, `knowledgeCards[${index}].summary`);
    if (card.kind === 'fact' && card.sourceUrls.length === 0) {
      throw new Error(`knowledgeCards[${index}] fact requires at least one source`);
    }
    for (const url of card.sourceUrls) {
      if (!sourceUrls.has(url)) {
        throw new Error(`Unknown knowledge source URL: ${url}`);
      }
    }
  }

  for (const [index, spot] of content.photoSpots.entries()) {
    register(spot.id, `photoSpots[${index}].id`);
    assertNonEmpty(spot.checkpointId, `photoSpots[${index}].checkpointId`);
    assertNonEmpty(spot.title, `photoSpots[${index}].title`);
  }

  for (const [index, collectible] of content.collectibles.entries()) {
    register(collectible.id, `collectibles[${index}].id`);
    assertNonEmpty(collectible.title, `collectibles[${index}].title`);
    assertNonEmpty(collectible.rarityCode, `collectibles[${index}].rarityCode`);
  }

  for (const [index, reward] of content.sponsorRewards.entries()) {
    register(reward.id, `sponsorRewards[${index}].id`);
    assertNonEmpty(reward.sponsorId, `sponsorRewards[${index}].sponsorId`);
    assertNonEmpty(reward.title, `sponsorRewards[${index}].title`);
    assertNonEmpty(reward.terms, `sponsorRewards[${index}].terms`);
    assertIsoDate(reward.validFrom, `sponsorRewards[${index}].validFrom`);
    assertIsoDate(reward.validUntil, `sponsorRewards[${index}].validUntil`);

    if (Date.parse(reward.validUntil) <= Date.parse(reward.validFrom)) {
      throw new Error(`sponsorRewards[${index}] validUntil must be after validFrom`);
    }
    if (
      reward.rewardType !== 'perk' &&
      (reward.discountValue === undefined ||
        !Number.isFinite(reward.discountValue) ||
        reward.discountValue <= 0)
    ) {
      throw new Error(
        `sponsorRewards[${index}] discountValue must be positive for discounts`,
      );
    }
    if (reward.eligibleRouteIds.length === 0) {
      throw new Error(`sponsorRewards[${index}] requires at least one eligible route`);
    }
    if (reward.requiredCompletionFacts.length === 0) {
      throw new Error(
        `sponsorRewards[${index}] requires at least one completion fact`,
      );
    }
  }

  return {
    ...content,
    knowledgeCards: content.knowledgeCards.map((card) => ({
      ...card,
      sourceUrls: [...card.sourceUrls],
    })),
    photoSpots: content.photoSpots.map((spot) => ({ ...spot })),
    collectibles: content.collectibles.map((item) => ({ ...item })),
    sponsorRewards: content.sponsorRewards.map((reward) => ({
      ...reward,
      eligibleRouteIds: [...reward.eligibleRouteIds],
      requiredCompletionFacts: [...reward.requiredCompletionFacts],
    })),
    sources: content.sources.map((source) => ({ ...source })),
  };
}
