export type KnowledgeCardKind = 'fact' | 'tradition' | 'interpretation';
export type RewardType = 'discount' | 'freebie' | 'experience';
export type RedemptionMode = 'single_use_code' | 'qr' | 'server_issued';
export type SponsorRewardStatus = 'mock' | 'active' | 'expired' | 'disabled';

export interface KnowledgeSource {
  label: string;
  url: string;
}

export interface KnowledgeCard {
  id: string;
  title: string;
  kind: KnowledgeCardKind;
  body: string;
  sourceUrls: string[];
  lastVerifiedAt: string;
}

export interface AdventureCheckpoint {
  id: string;
  title: string;
  summary: string;
  required: boolean;
  progressMeters: number;
  knowledgeCardIds: string[];
  discoveryIds: string[];
  prerequisiteCheckpointIds?: string[];
}

export interface AdventureDiscovery {
  id: string;
  title: string;
  description: string;
  xp: number;
  collectibleId?: string;
  prerequisiteDiscoveryIds?: string[];
}

export interface PhotoSpot {
  id: string;
  checkpointId: string;
  title: string;
  captionRequired: boolean;
  publicPoiOnly: boolean;
}

export interface Collectible {
  id: string;
  title: string;
  description: string;
}

export interface SponsorReward {
  sponsorId: string;
  title: string;
  description: string;
  rewardType: RewardType;
  discountValue?: number;
  terms: string;
  validFrom: string;
  validUntil: string;
  maxRedemptions: number;
  redemptionMode: RedemptionMode;
  eligibleRouteIds: string[];
  requiredCompletionFacts: string[];
  serverSignature?: string;
  status: SponsorRewardStatus;
}

export interface AdventureContentDefinition {
  routeId: string;
  contentVersion: number;
  title: string;
  availability: 'simulation_only' | 'published';
  officialRouteStatus: 'open' | 'temporarily_closed' | 'unknown';
  routeSourceUrls: string[];
  lastVerifiedAt: string;
  checkpoints: AdventureCheckpoint[];
  knowledgeCards: KnowledgeCard[];
  discoveries: AdventureDiscovery[];
  photoSpots: PhotoSpot[];
  collectibles: Collectible[];
  sponsorRewards: SponsorReward[];
}

export interface QaSimulationContext {
  qaSimulated: true;
  watermark: 'SIMULACIÓN QA';
  simulationId: string;
  mode: 'replay' | 'walk_to_advance' | 'checkpoint_jump';
  publicEffectsEnabled: false;
  commercialRedemptionEnabled: false;
  physicalQaEvidence: false;
}

export interface ProgressionSnapshot {
  qaSimulated: boolean;
  progressMeters: number;
  reachedCheckpointIds: string[];
  unlockedDiscoveryIds: string[];
  publicAchievementEligible: boolean;
  rankingEligible: boolean;
  sponsorRedemptionEligible: boolean;
}

function rewardBoundaryMillis(value: string, endOfDay: boolean): number {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`
    : value;
  return Date.parse(normalized);
}

export function validateAdventureContent(content: AdventureContentDefinition): AdventureContentDefinition {
  const unique = (values: string[], label: string) => {
    if (new Set(values).size !== values.length) throw new Error(`${label} IDs must be unique`);
  };
  if (!content.routeId || content.contentVersion < 1) throw new Error('Invalid adventure identity');
  if (content.routeSourceUrls.length === 0 || !content.lastVerifiedAt) throw new Error('Adventure content needs route sources');
  if (content.officialRouteStatus === 'temporarily_closed' && content.availability === 'published') {
    throw new Error('Temporarily closed routes cannot be published');
  }
  unique(content.checkpoints.map((item) => item.id), 'Checkpoint');
  unique(content.knowledgeCards.map((item) => item.id), 'Knowledge card');
  unique(content.discoveries.map((item) => item.id), 'Discovery');
  unique(content.photoSpots.map((item) => item.id), 'Photo spot');
  unique(content.collectibles.map((item) => item.id), 'Collectible');
  for (const card of content.knowledgeCards) {
    if (card.sourceUrls.length === 0 || !card.lastVerifiedAt) throw new Error(`Knowledge card ${card.id} needs sources`);
    if (card.kind === 'tradition' && card.body.toLowerCase().includes('hecho histórico')) {
      throw new Error(`Tradition card ${card.id} must not be presented as fact`);
    }
  }
  const checkpointIds = new Set(content.checkpoints.map((item) => item.id));
  const checkpointById = new Map(content.checkpoints.map((item) => [item.id, item] as const));
  const knowledgeCardIds = new Set(content.knowledgeCards.map((item) => item.id));
  const discoveryIds = new Set(content.discoveries.map((item) => item.id));
  for (const checkpoint of content.checkpoints) {
    if (checkpoint.progressMeters < 0) throw new Error(`Checkpoint ${checkpoint.id} has invalid progress`);
    for (const knowledgeCardId of checkpoint.knowledgeCardIds) if (!knowledgeCardIds.has(knowledgeCardId)) throw new Error(`Unknown knowledge card ${knowledgeCardId}`);
    for (const prerequisite of checkpoint.prerequisiteCheckpointIds ?? []) {
      const prerequisiteCheckpoint = checkpointById.get(prerequisite);
      if (!prerequisiteCheckpoint) throw new Error(`Unknown checkpoint prerequisite ${prerequisite}`);
      if (prerequisite === checkpoint.id) throw new Error(`Checkpoint ${checkpoint.id} cannot require itself`);
      if (prerequisiteCheckpoint.progressMeters > checkpoint.progressMeters) {
        throw new Error(`Checkpoint prerequisite ${prerequisite} must not come after ${checkpoint.id}`);
      }
    }
    for (const discoveryId of checkpoint.discoveryIds) if (!discoveryIds.has(discoveryId)) throw new Error(`Unknown discovery ${discoveryId}`);
  }
  for (const discovery of content.discoveries) {
    for (const prerequisite of discovery.prerequisiteDiscoveryIds ?? []) {
      if (!discoveryIds.has(prerequisite)) throw new Error(`Unknown discovery prerequisite ${prerequisite}`);
    }
  }
  for (const photoSpot of content.photoSpots) if (!checkpointIds.has(photoSpot.checkpointId)) throw new Error(`Unknown photo spot checkpoint ${photoSpot.checkpointId}`);
  for (const reward of content.sponsorRewards) {
    const validFrom = rewardBoundaryMillis(reward.validFrom, false);
    const validUntil = rewardBoundaryMillis(reward.validUntil, true);
    if (!Number.isFinite(validFrom) || !Number.isFinite(validUntil) || validFrom > validUntil || reward.maxRedemptions < 0) {
      throw new Error(`Sponsor reward ${reward.sponsorId} has an invalid validity window`);
    }
    if (reward.status === 'mock' && reward.maxRedemptions !== 0) throw new Error(`Mock sponsor reward ${reward.sponsorId} must not be redeemable`);
  }
  return content;
}

export function qaProgressionSnapshot(progressMeters: number, reachedCheckpointIds: string[], unlockedDiscoveryIds: string[]): ProgressionSnapshot {
  return {
    qaSimulated: true,
    progressMeters,
    reachedCheckpointIds,
    unlockedDiscoveryIds,
    publicAchievementEligible: false,
    rankingEligible: false,
    sponsorRedemptionEligible: false,
  };
}

export function isSponsorRewardActiveAt(reward: SponsorReward, at: Date | string | number = new Date()): boolean {
  const timestamp = at instanceof Date ? at.getTime() : typeof at === 'number' ? at : Date.parse(at);
  const validFrom = rewardBoundaryMillis(reward.validFrom, false);
  const validUntil = rewardBoundaryMillis(reward.validUntil, true);
  return Number.isFinite(timestamp) && Number.isFinite(validFrom) && Number.isFinite(validUntil)
    && timestamp >= validFrom
    && timestamp <= validUntil;
}

export function canRedeemSponsorReward(
  reward: SponsorReward,
  snapshot: ProgressionSnapshot,
  serverAuthorized: boolean,
  at: Date | string | number = new Date(),
): boolean {
  return !snapshot.qaSimulated
    && snapshot.sponsorRedemptionEligible
    && serverAuthorized
    && reward.status === 'active'
    && reward.maxRedemptions > 0
    && isSponsorRewardActiveAt(reward, at);
}
