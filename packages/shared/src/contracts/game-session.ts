/**
 * Contrato da sessão local (SPEC-003 §1.2, Task 0). Estado apenas em
 * memória: nenhum Storage, nenhum dado pessoal (Zero-PII). Ficam
 * **read-only** após o dispatch.
 */

import type { GameState, Move, Player } from '../domain';
import type { Difficulty } from '../ai/difficulty';

export type MatchMode = 'vs-ai' | 'local-2p';

export interface GameSnapshot {
  readonly state: GameState;
  readonly mode: MatchMode;
  readonly difficulty: Difficulty;
  readonly turn: Player;
  /** true enquanto a IA calcula: a UI bloqueia toques do oponente. */
  readonly aiPending: boolean;
  readonly lastMove: Move | null;
}

export interface ResetOptions {
  readonly seed?: number;
  readonly difficulty?: Difficulty;
  readonly mode?: MatchMode;
}

export interface GameSession {
  readonly subscribe: (listener: () => void) => () => void;
  readonly getSnapshot: () => GameSnapshot;
  /** Jogada do jogador atual. Ilegal lança RangeError e não muda o snapshot. */
  readonly play: (move: Move) => void;
  readonly reset: (options?: ResetOptions) => void;
  readonly setDifficulty: (difficulty: Difficulty) => void;
}
