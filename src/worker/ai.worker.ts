/**
 * Web Worker do motor de IA: recebe o estado + dificuldade e devolve a jogada.
 * Toda a lógica pesada fica em src/ai (puro); o worker apenas transporta.
 */

import type { GameState } from '../domain';
import { search } from '../ai/mcts';
import { optionsFor, type Difficulty } from '../ai/difficulty';

export interface AiRequest {
  readonly id: number;
  readonly state: GameState;
  readonly difficulty: Difficulty;
  readonly seed: number;
}

export interface AiResponse {
  readonly id: number;
  readonly move: { board: number; cell: number } | null;
  readonly iterations: number;
  readonly elapsedMs: number;
}

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<AiRequest>) => void) | null;
  postMessage: (message: AiResponse) => void;
};

scope.onmessage = (event: MessageEvent<AiRequest>) => {
  const { id, state, difficulty, seed } = event.data;
  const result = search(state, optionsFor(difficulty, seed));
  scope.postMessage({
    id,
    move: result.move,
    iterations: result.iterations,
    elapsedMs: result.elapsedMs,
  });
};
