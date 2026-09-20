export interface AdventureTargetDefinition {
  id: string;
  kind: 'checkpoint' | 'discovery';
  sequence: number;
  required: boolean;
  prerequisiteTargetKeys: string[];
  latitude: number;
  longitude: number;
  triggerRadiusMeters: number;
}

export interface AdventureDefinition {
  slug: string;
  version: number;
  gpx: {
    uri: string;
    sha256: string;
  };
  offlineMap: {
    manifestUri: string;
    styleTemplateUri: string;
    contentHash: string;
  };
  explorationPolicy: {
    maxAccuracyMeters: number;
    requiredConsecutiveSamples: number;
    maxEvidenceGapSeconds: number;
  };
  checkpoints: AdventureTargetDefinition[];
  discoveries: AdventureTargetDefinition[];
  missions: Array<{
    id: string;
    requiredTargetKeys: string[];
  }>;
  assets: Array<{
    id: string;
    uri: string;
    sha256: string;
  }>;
  scenes3d: Array<{
    id: string;
    assetIds: string[];
    sceneUri: string;
  }>;
  progression: {
    xpRulesetVersion: number;
    rewards: Array<{
      id: string;
      kind: string;
      amount: number;
    }>;
  };
}
