/**
 * Web Worker do motor de IA: recebe o estado + dificuldade e devolve a jogada.
 * Toda a lógica pesada fica em packages/shared/src/ai (puro); o worker só transporta.
 * Contratos (AiRequest/AiResponse) são do `@ttt/shared/contracts` (SPEC-003 §1.1, Task 0 / B1).
 */

import type { AiRequest, AiResponse } from '@ttt/shared/contracts';
import { search } from '@ttt/shared/ai/mcts';
import { optionsFor } from '@ttt/shared/ai/difficulty';

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
