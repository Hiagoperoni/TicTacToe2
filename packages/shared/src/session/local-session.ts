/**
 * Sessão local pura (SPEC-003 B2): `createLocalSession(deps)` → `GameSession`.
 * Turno humano → `aiPending` → jogada da IA aplicada → turno volta ao humano
 * (modo `vs-ai`); em `local-2p` os dois turnos são humanos e a IA não roda.
 * Nenhum timer/rede/storage embutido: a sessão consulta a IA via `AiPort` e é
 * notificada de volta pelo callback. Determinismo: mesma `seed` + dificuldade
 * ⇒ mesma jogada (SPEC-002). Estado apenas em memória (Zero-PII).
 */

import type {
  AiPort,
  GameSession,
  GameSnapshot,
  MatchMode,
  ResetOptions,
} from '@ttt/shared/contracts';
import type { Difficulty } from '@ttt/shared/ai/difficulty';
import {
  applyMove,
  createInitialState,
  isLegalMove,
  type GameState,
  type Move,
} from '@ttt/shared/domain';

interface LocalSessionDeps {
  readonly ai: AiPort;
  readonly mode?: MatchMode;
  readonly difficulty?: Difficulty;
  readonly seed?: number;
}

interface SessionState {
  readonly state: GameState;
  readonly mode: MatchMode;
  readonly difficulty: Difficulty;
  readonly seed: number;
  readonly aiPending: boolean;
  readonly lastMove: Move | null;
  /** Token por mutação de estado: respuesta a IA antiga é descartada. */
  readonly revision: number;
  readonly requestId: number;
}

const DEFAULT_MODE: MatchMode = 'vs-ai';
const DEFAULT_DIFFICULTY: Difficulty = 'casual';
const DEFAULT_SEED = 1;

export function createLocalSession(deps: LocalSessionDeps): GameSession {
  const listeners = new Set<() => void>();

  let next: SessionState = {
    state: createInitialState(),
    mode: deps.mode ?? DEFAULT_MODE,
    difficulty: deps.difficulty ?? DEFAULT_DIFFICULTY,
    seed: deps.seed ?? DEFAULT_SEED,
    aiPending: false,
    lastMove: null,
    revision: 0,
    requestId: 0,
  };

  function notify(): void {
    for (const listener of [...listeners]) listener();
  }

  function snapshot(): GameSnapshot {
    return {
      state: next.state,
      mode: next.mode,
      difficulty: next.difficulty,
      turn: next.state.player,
      aiPending: next.aiPending,
      lastMove: next.lastMove,
    };
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function setDifficulty(difficulty: Difficulty): void {
    next = { ...next, difficulty };
    notify();
  }

  function reset(options?: ResetOptions): void {
    next = {
      state: createInitialState(),
      mode: options?.mode ?? DEFAULT_MODE,
      difficulty: options?.difficulty ?? next.difficulty,
      seed: options?.seed ?? next.seed,
      aiPending: false,
      lastMove: null,
      revision: next.revision + 1,
      requestId: next.requestId,
    };
    notify();
  }

  async function runAi(revision: number): Promise<void> {
    if (next.state.status !== 'in_progress') return;
    const request = {
      id: next.requestId + 1,
      state: next.state,
      difficulty: next.difficulty,
      seed: next.seed,
    };
    next = { ...next, requestId: request.id, aiPending: true };
    notify();
    const response = await deps.ai.request(request);
    // Reset/mudança de estado entre pedido e resposta ⇒ descarta.
    if (revision !== next.revision || request.id !== next.requestId) return;
    if (response.move === null || next.state.status !== 'in_progress') return;
    const played = applyMove(next.state, response.move);
    next = { ...next, state: played, lastMove: response.move, aiPending: false };
    notify(); // em vs-ai o turno volta ao humano (played.player === 1)
  }

  function play(move: Move): void {
    // Autoridade no domínio: jogada ilegal lança e o snapshot permanece idêntico.
    if (!isLegalMove(next.state, move)) {
      throw new RangeError(`jogada ilegal: board=${move.board} cell=${move.cell}`);
    }
    if (next.aiPending) return;
    const vsAiTurn = next.mode === 'vs-ai' && next.state.player === 1;
    const revision = next.revision;
    const played = applyMove(next.state, move);
    next = { ...next, state: played, lastMove: move };
    notify();
    if (vsAiTurn && played.status === 'in_progress') void runAi(revision);
  }

  return { subscribe, getSnapshot: snapshot, play, reset, setDifficulty };
}
