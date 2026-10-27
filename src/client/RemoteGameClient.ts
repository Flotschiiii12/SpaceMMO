import { GameClient } from './GameClient';
import { GameCommand, SimEvent, WorldState } from '../sim/types';

/**
 * RemoteGameClient Stub for Future Server-Authoritative Multiplayer
 *
 * Architecture plan for backend integration:
 * 1. Connects to authoritative WebSocket / WebTransport server endpoint.
 * 2. Transmits client-side player commands (MOVE_TO, TOGGLE_ATTACK, etc.) with client timestamp and sequence IDs.
 * 3. Receives compressed binary delta snapshots from the server at 30Hz or 20Hz.
 * 4. Implements client-side prediction for the local ship and lag compensation / entity interpolation (jitter buffer) for remote ships.
 * 5. Uses onEvent() to receive server-validated event packets (damage numbers, kills, loot drops).
 */
export class RemoteGameClient implements GameClient {
  private eventListeners: ((event: SimEvent) => void)[] = [];
  private serverUrl: string;
  private isConnected = false;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  sendCommand(cmd: GameCommand): void {
    if (!this.isConnected) {
      console.warn('[RemoteGameClient] Not connected to server. Dropping command:', cmd);
      return;
    }
    // Future: this.socket.send(serializeCommand(cmd));
  }

  getInterpolatedState(_alpha: number): WorldState {
    throw new Error('[RemoteGameClient] Remote server connection not yet configured. Use LocalGameClient.');
  }

  getRawState(): WorldState {
    throw new Error('[RemoteGameClient] Remote server connection not yet configured. Use LocalGameClient.');
  }

  onEvent(listener: (event: SimEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter((l) => l !== listener);
    };
  }

  update(_rawDt: number): void {
    // Future: poll socket, handle incoming packet queue, advance client clock
  }

  destroy(): void {
    this.isConnected = false;
    this.eventListeners = [];
  }
}
