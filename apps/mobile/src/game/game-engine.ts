import { effectsForGameEvent } from './game-effects';
import type { GameEvent, GameEventResult } from './game-events';

export type GameEventListener = (result: GameEventResult) => void;

export class AdventureGameEngine {
  private readonly listeners = new Set<GameEventListener>();

  emit(event: GameEvent): GameEventResult {
    const result: GameEventResult = {
      event,
      effects: effectsForGameEvent(event),
    };

    for (const listener of this.listeners) {
      listener(result);
    }

    return result;
  }

  subscribe(listener: GameEventListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const adventureGameEngine = new AdventureGameEngine();
