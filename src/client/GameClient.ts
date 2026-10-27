import { GameCommand, SimEvent, WorldState } from '../sim/types';

export interface GameClient {
  /** Pushes an input command to the client buffer */
  sendCommand(cmd: GameCommand): void;

  /** Returns world state interpolated between last two simulation ticks */
  getInterpolatedState(alpha: number): WorldState;

  /** Returns authoritative current tick state */
  getRawState(): WorldState;

  /** Registers a callback for simulation events (hits, kills, loot, levelups) */
  onEvent(listener: (event: SimEvent) => void): () => void;

  /** Advances client accumulator and simulation loop */
  update(rawDt: number): void;

  /** Cleanup resources */
  destroy(): void;
}
