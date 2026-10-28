/**
 * Fronteira única cliente ↔ IA (SPEC-003 §1.1, Task 0): `AiPort`.
 * O worker real vive em `src/worker/ai.worker.ts`; o fake fica em `src/mocks/fake-ai.ts`.
 * O `AiPort` é a porta por onde a UI consome a IA — nenhum mock em produção.
 */

import type { AiRequest, AiResponse } from '../worker/ai.worker';

export interface AiPort {
  /** Envia estado + dificuldade e recebe a jogada escolhida. */
  readonly request: (request: AiRequest) => Promise<AiResponse>;
}
