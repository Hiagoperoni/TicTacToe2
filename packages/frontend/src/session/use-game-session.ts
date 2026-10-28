/**
 * Hook de sessão de jogo do frontend (SPEC-003 A7): encapsula o `GameSnapshot` e a
 * máquina humana ↔ IA sobre o estado imutável do domínio.
 *
 * Contrato interno alinhado a `GameSession` (Task 0 / SPEC-003 §1.2): turno humano →
 * `aiPending` → jogada da IA → notificação. Em `vs-ai` o humano é o Jogador 1 (X).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  applyMove,
  createInitialState,
  isLegalMove,
  type GameState,
  type Move,
  type Player,
} from '@ttt/shared/domain';
import type { AiPort } from './ai-port';
import type { Difficulty } from '@ttt/shared/ai/difficulty';

export type MatchMode = 'vs-ai' | 'local-2p';

/** Snapshot consumido pela UI (espelho de `GameSnapshot` do contrato Task 0). */
export interface GameSnapshot {
  readonly state: GameState;
  readonly mode: MatchMode;
  readonly difficulty: Difficulty;
  readonly turn: Player;
  readonly aiPending: boolean;
  readonly lastMove: Move | null;
}

export interface UseGameSessionOptions {
  readonly ai: AiPort;
  readonly mode?: MatchMode;
  readonly difficulty?: Difficulty;
  readonly seed?: number;
}

export interface GameSessionApi {
  readonly snapshot: GameSnapshot;
  /** Jogada do jogador atual; ilegal não muda o snapshot (rollback + erro). */
  readonly play: (move: Move) => void;
  readonly reset: () => void;
  readonly setDifficulty: (difficulty: Difficulty) => void;
  readonly setMode: (mode: MatchMode) => void;
  /** Último erro de jogada (ex.: ilegal) — alimenta feedback de UI (screen shake, R3.4). */
  readonly error: string | null;
}

/** Em `vs-ai` o bot responde pelo Jogador 2; o humano controla o Jogador 1. */
const AI_PLAYER: Player = 2;

export function useGameSession(options: UseGameSessionOptions): GameSessionApi {
  const { ai, mode = 'vs-ai', difficulty: initialDifficulty, seed = 42 } = options;

  const [state, setState] = useState<GameState>(() => createInitialState(1));
  const [modeState, setModeState] = useState<MatchMode>(mode);
  const [difficulty, setDifficultyState] = useState<Difficulty>(initialDifficulty ?? 'casual');
  const [aiPending, setAiPending] = useState(false);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef(0);
  const requestSeqRef = useRef(0);
  const aiPendingRef = useRef(false);

  const snapshot: GameSnapshot = useMemo(
    () => ({
      state,
      mode: modeState,
      difficulty,
      turn: state.player,
      aiPending,
      lastMove,
    }),
    [state, modeState, difficulty, aiPending, lastMove],
  );

  const reset = useCallback(() => {
    sessionIdRef.current += 1;
    aiPendingRef.current = false;
    setState(createInitialState(1));
    setAiPending(false);
    setLastMove(null);
    setError(null);
  }, []);

  const play = useCallback(
    (move: Move) => {
      if (state.status !== 'in_progress') {
        setError('partida encerrada');
        return;
      }
      if (!isLegalMove(state, move)) {
        setError(`jogada ilegal: board=${move.board} cell=${move.cell}`);
        return;
      }
      try {
        const next = applyMove(state, move);
        setState(next);
        setLastMove(move);
        setError(null);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'falha ao aplicar jogada');
      }
    },
    [state],
  );

  const setDifficulty = useCallback((next: Difficulty) => {
    setDifficultyState(next);
  }, []);

  const setMode = useCallback((nextMode: MatchMode) => {
    setModeState(nextMode);
    if (nextMode !== 'vs-ai') setAiPending(false);
  }, []);

  useEffect(() => {
    if (modeState !== 'vs-ai') {
      aiPendingRef.current = false;
      setAiPending(false);
      return;
    }
    if (state.status !== 'in_progress') {
      aiPendingRef.current = false;
      setAiPending(false);
      return;
    }
    if (state.player !== AI_PLAYER) return;
    if (aiPendingRef.current) return;

    aiPendingRef.current = true;
    setAiPending(true);
    const sessionId = sessionIdRef.current;
    const difficultyNow = difficulty;
    const seedNow = seed;

    void (async () => {
      const response = await ai.request({
        id: ++requestSeqRef.current,
        state,
        difficulty: difficultyNow,
        seed: seedNow,
      });
      if (sessionId !== sessionIdRef.current) {
        aiPendingRef.current = false;
        return;
      }
      const move = response.move;
      aiPendingRef.current = false;
      setAiPending(false);
      if (move) {
        try {
          setState((prev) => (prev.status === 'in_progress' ? applyMove(prev, move) : prev));
          setLastMove(move);
        } catch {
          aiPendingRef.current = false;
        }
      }
    })();
  }, [state, modeState, ai, difficulty, seed]);

  return { snapshot, play, reset, setDifficulty, setMode, error };
}
