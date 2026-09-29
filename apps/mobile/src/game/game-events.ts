export type GameEvent =
  | {
      type: 'checkpoint.reached';
      checkpointId: string;
      title: string;
      xp?: number;
    }
  | {
      type: 'discovery.unlocked';
      discoveryId: string;
      title: string;
      category?: string;
      xp?: number;
    }
  | {
      type: 'xp.earned';
      amount: number;
      reason: string;
    }
  | {
      type: 'badge.unlocked';
      badgeId: string;
      title: string;
    }
  | {
      type: 'level.up';
      level: number;
      title?: string;
    }
  | {
      type: 'route.completed';
      routeId: string;
      title: string;
      xp?: number;
    };

export type GameEffectCommand =
  | {
      kind: 'haptic';
      intensity: 'light' | 'medium' | 'heavy' | 'success';
    }
  | {
      kind: 'sound';
      cue:
        | 'checkpoint'
        | 'discovery'
        | 'xp'
        | 'badge'
        | 'level-up'
        | 'route-complete';
    }
  | {
      kind: 'animation';
      preset:
        | 'checkpoint-reveal'
        | 'discovery-reveal'
        | 'xp-burst'
        | 'badge-unlock'
        | 'level-up'
        | 'route-complete';
      title?: string;
      amount?: number;
    }
  | {
      kind: 'map.pulse';
      targetId: string;
      tone: 'checkpoint' | 'discovery';
    }
  | {
      kind: 'hud.toast';
      title: string;
      subtitle?: string;
      tone: 'checkpoint' | 'discovery' | 'reward' | 'achievement';
    };

export interface GameEventResult {
  event: GameEvent;
  effects: GameEffectCommand[];
}
