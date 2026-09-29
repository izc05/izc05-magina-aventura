import { describe, expect, it, vi } from 'vitest';

import { AdventureGameEngine } from './game-engine';

describe('AdventureGameEngine', () => {
  it('translates a checkpoint event into reusable game effects', () => {
    const engine = new AdventureGameEngine();

    const result = engine.emit({
      type: 'checkpoint.reached',
      checkpointId: 'cp-1',
      title: 'Mirador de Sierra Mágina',
      xp: 50,
    });

    expect(result.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'map.pulse', targetId: 'cp-1' }),
        expect.objectContaining({ kind: 'animation', preset: 'checkpoint-reveal' }),
        expect.objectContaining({ kind: 'animation', preset: 'xp-burst', amount: 50 }),
      ]),
    );
  });

  it('can notify and unsubscribe runtime adapters', () => {
    const engine = new AdventureGameEngine();
    const listener = vi.fn();
    const unsubscribe = engine.subscribe(listener);

    engine.emit({
      type: 'discovery.unlocked',
      discoveryId: 'poi-1',
      title: 'Olivo centenario',
      xp: 75,
    });

    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();

    engine.emit({
      type: 'xp.earned',
      amount: 25,
      reason: 'Fotografía válida',
    });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('creates a route completion celebration without depending on a UI runtime', () => {
    const engine = new AdventureGameEngine();

    const result = engine.emit({
      type: 'route.completed',
      routeId: 'route-1',
      title: 'Ruta del Mirador',
      xp: 375,
    });

    expect(result.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'sound', cue: 'route-complete' }),
        expect.objectContaining({ kind: 'animation', preset: 'route-complete' }),
      ]),
    );
  });
});
