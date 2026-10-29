/**
 * Fake determinístico do `AiPort` (SPEC-003 A7): usado em testes/demo.
 * Escolhe a primeira jogada legal em ordem canônica — determinística por estado,
 * sem depender de Math.random.
 */

import { legalMoves, type Move } from '@ttt/shared/domain';
import type { AiPort, AiRequest, AiResponse } from '@ttt/shared/contracts';

export class FakeAi implements AiPort {
  readonly request: AiPort['request'] = async (request: AiRequest): Promise<AiResponse> => {
    const moves: readonly Move[] = legalMoves(request.state);
    const move = moves.length > 0 ? moves[0] : null;
    return {
      id: request.id,
      move,
      iterations: 1,
      elapsedMs: 0,
    };
  };
}
