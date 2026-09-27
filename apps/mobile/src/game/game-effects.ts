import type { GameEffectCommand, GameEvent } from './game-events';

export function effectsForGameEvent(event: GameEvent): GameEffectCommand[] {
  switch (event.type) {
    case 'checkpoint.reached':
      return [
        { kind: 'haptic', intensity: 'medium' },
        { kind: 'sound', cue: 'checkpoint' },
        { kind: 'map.pulse', targetId: event.checkpointId, tone: 'checkpoint' },
        {
          kind: 'animation',
          preset: 'checkpoint-reveal',
          title: event.title,
          amount: event.xp,
        },
        {
          kind: 'hud.toast',
          title: 'Checkpoint alcanzado',
          subtitle: event.title,
          tone: 'checkpoint',
        },
        ...(event.xp
          ? [
              {
                kind: 'animation',
                preset: 'xp-burst',
                amount: event.xp,
              } satisfies GameEffectCommand,
            ]
          : []),
      ];

    case 'discovery.unlocked':
      return [
        { kind: 'haptic', intensity: 'success' },
        { kind: 'sound', cue: 'discovery' },
        { kind: 'map.pulse', targetId: event.discoveryId, tone: 'discovery' },
        {
          kind: 'animation',
          preset: 'discovery-reveal',
          title: event.title,
          amount: event.xp,
        },
        {
          kind: 'hud.toast',
          title: 'Descubrimiento desbloqueado',
          subtitle: event.title,
          tone: 'discovery',
        },
      ];

    case 'xp.earned':
      return [
        { kind: 'haptic', intensity: 'light' },
        { kind: 'sound', cue: 'xp' },
        { kind: 'animation', preset: 'xp-burst', amount: event.amount },
        {
          kind: 'hud.toast',
          title: `+${event.amount} XP`,
          subtitle: event.reason,
          tone: 'reward',
        },
      ];

    case 'badge.unlocked':
      return [
        { kind: 'haptic', intensity: 'success' },
        { kind: 'sound', cue: 'badge' },
        { kind: 'animation', preset: 'badge-unlock', title: event.title },
        {
          kind: 'hud.toast',
          title: 'Nueva insignia',
          subtitle: event.title,
          tone: 'achievement',
        },
      ];

    case 'level.up':
      return [
        { kind: 'haptic', intensity: 'heavy' },
        { kind: 'sound', cue: 'level-up' },
        {
          kind: 'animation',
          preset: 'level-up',
          title: event.title ?? `Nivel ${event.level}`,
        },
        {
          kind: 'hud.toast',
          title: `Nivel ${event.level}`,
          subtitle: event.title,
          tone: 'achievement',
        },
      ];

    case 'route.completed':
      return [
        { kind: 'haptic', intensity: 'success' },
        { kind: 'sound', cue: 'route-complete' },
        {
          kind: 'animation',
          preset: 'route-complete',
          title: event.title,
          amount: event.xp,
        },
        {
          kind: 'hud.toast',
          title: '¡Aventura completada!',
          subtitle: event.title,
          tone: 'achievement',
        },
      ];
  }
}
