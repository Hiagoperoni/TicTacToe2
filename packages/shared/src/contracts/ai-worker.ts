/**
 * Contrato cliente ↔ IA (SPEC-003 §1.1, Task 0). Tipos movidos de
 * `packages/frontend/src/worker/ai.worker.ts` com assinaturas inalteradas;
 * o worker passa a importar daqui. Ficam **read-only** após o dispatch.
 */

import type { GameState } from '../domain';
import type { Difficulty } from '../ai/difficulty';

export interface AiRequest {
  readonly id: number;
  readonly state: GameState;
  readonly difficulty: Difficulty;
  readonly seed: number;
}

export interface AiResponse {
  readonly id: number;
  readonly move: { readonly board: number; readonly cell: number } | null;
  readonly iterations: number;
  readonly elapsedMs: number;
}

/** Fronteira única sessão ↔ IA: worker real em produção, fake em teste/demo. */
export interface AiPort {
  readonly request: (request: AiRequest) => Promise<AiResponse>;
}
