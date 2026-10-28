

import type { GameState, Move, Player } from '../domain';
import type { RoomStatus } from './server-protocol';

export interface OnlineSnapshot {
  readonly state: GameState;
  readonly status: RoomStatus;
  readonly myPlayer: Player;
  readonly turn: Player;
  readonly clocks: { readonly p1: number; readonly p2: number }; // ms autoritativos
  readonly opponentConnected: boolean;
  readonly pending: 'idle' | 'awaiting-server'; // optimistic UI
}

export interface OnlineSession {
  readonly subscribe: (listener: () => void) => () => void;
  readonly getSnapshot: () => OnlineSnapshot;
  readonly submit: (move: Move) => void; // otimista; MOVE_REJECTED ⇒ rollback
  readonly surrender: () => void;
}
