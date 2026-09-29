import type { GameEffectCommand, GameEvent } from './game-events';

function animation(
  preset: Extract<GameEffectCommand, { kind: 'animation' }>['preset'],
  options: { title?: string | undefined; amount?: number | undefined } = {},
): GameEffectCommand {
  return {
    kind: 'animation',
    preset,
    ...(options.title !== undefined ? { title: options.title } : {}),
    ...(options.amount !== undefined ? { amount: options.amount } : {}),
  };
}

function toast(
  title: string,
  tone: Extract<GameEffectCommand, { kind: 'hud.toast' }>['tone'],
  subtitle?: string | undefined,
): GameEffectCommand {
  return {
    kind: 'hud.toast',
    title,
    tone,
    ...(subtitle !== undefined ? { subtitle } : {}),
  };
}

export function effectsForGameEvent(event: GameEvent): GameEffectCommand[] {
  switch (event.type) {
    case 'checkpoint.reached':
      return [
        { kind: 'haptic', intensity: 'medium' },
        { kind: 'sound', cue: 'checkpoint' },
        { kind: 'map.pulse', targetId: event.checkpointId, tone: 'checkpoint' },
        animation('checkpoint-reveal', { title: event.title, amount: event.xp }),
        toast('Checkpoint alcanzado', 'checkpoint', event.title),
        ...(event.xp !== undefined
          ? [animation('xp-burst', { amount: event.xp })]
          : []),
      ];

    case 'discovery.unlocked':
      return [
        { kind: 'haptic', intensity: 'success' },
        { kind: 'sound', cue: 'discovery' },
        { kind: 'map.pulse', targetId: event.discoveryId, tone: 'discovery' },
        animation('discovery-reveal', { title: event.title, amount: event.xp }),
        toast('Descubrimiento desbloqueado', 'discovery', event.title),
      ];

    case 'xp.earned':
      return [
        { kind: 'haptic', intensity: 'light' },
        { kind: 'sound', cue: 'xp' },
        animation('xp-burst', { amount: event.amount }),
        toast(`+${event.amount} XP`, 'reward', event.reason),
      ];

    case 'badge.unlocked':
      return [
        { kind: 'haptic', intensity: 'success' },
        { kind: 'sound', cue: 'badge' },
        animation('badge-unlock', { title: event.title }),
        toast('Nueva insignia', 'achievement', event.title),
      ];

    case 'level.up':
      return [
        { kind: 'haptic', intensity: 'heavy' },
        { kind: 'sound', cue: 'level-up' },
        animation('level-up', { title: event.title ?? `Nivel ${event.level}` }),
        toast(`Nivel ${event.level}`, 'achievement', event.title),
      ];

    case 'route.completed':
      return [
        { kind: 'haptic', intensity: 'success' },
        { kind: 'sound', cue: 'route-complete' },
        animation('route-complete', { title: event.title, amount: event.xp }),
        toast('¡Aventura completada!', 'achievement', event.title),
      ];
  }
}
