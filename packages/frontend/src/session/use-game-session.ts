/**
 * Hook React sobre a sessão oficial (SPEC-003 A7: "hook sobre `GameSession`").
 * Toda a regra de partida vive em `@ttt/shared/session/local-session`
 * (`createLocalSession` → contrato `GameSession` de `@ttt/shared/contracts`);
 * aqui só adaptamos a sessão para React via `useSyncExternalStore`, com cache
 * de identidade do snapshot para evitar re-renderizações. Zero lógica de
 * negócio duplicada no cliente (guardrail: dumb components).
 */

import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import type { AiPort, GameSession, GameSnapshot, MatchMode } from '@ttt/shared/contracts';
import type { Move } from '@ttt/shared/domain';
import type { Difficulty } from '@ttt/shared/ai/difficulty';
import { createLocalSession } from '@ttt/shared/session/local-session';

export type { AiPort, GameSnapshot, MatchMode };

export interface UseGameSessionOptions {
  readonly ai: AiPort;
  readonly mode?: MatchMode;
  readonly difficulty?: Difficulty;
  readonly seed?: number;
}

export interface GameSessionApi {
  readonly snapshot: GameSnapshot;
  /** Jogada do jogador atual; ilegal não muda o snapshot (vira `error`). */
  readonly play: (move: Move) => void;
  readonly reset: () => void;
  readonly setDifficulty: (difficulty: Difficulty) => void;
  /** Erro da última jogada rejeitada (ex.: `RangeError` do domínio) — feedback de UI (R3.4). */
  readonly error: string | null;
}

/** Comparação rasa: o contrato devolve objeto novo a cada `getSnapshot()`. */
function sameSnapshot(a: GameSnapshot, b: GameSnapshot): boolean {
  return (
    a.state === b.state &&
    a.mode === b.mode &&
    a.difficulty === b.difficulty &&
    a.turn === b.turn &&
    a.aiPending === b.aiPending &&
    a.lastMove === b.lastMove
  );
}

export function useGameSession(options: UseGameSessionOptions): GameSessionApi {
  const { ai, mode, difficulty, seed } = options;
  const [session] = useState<GameSession>(() => createLocalSession({ ai, mode, difficulty, seed }));
  const [error, setError] = useState<string | null>(null);

  // Cache de identidade exigido por useSyncExternalStore (Object.is por chamada).
  const cacheRef = useRef<GameSnapshot | null>(null);
  const getSnapshot = useCallback((): GameSnapshot => {
    const next = session.getSnapshot();
    const prev = cacheRef.current;
    if (prev !== null && sameSnapshot(prev, next)) return prev;
    cacheRef.current = next;
    return next;
  }, [session]);

  const snapshot = useSyncExternalStore(session.subscribe, getSnapshot, getSnapshot);

  const play = useCallback(
    (move: Move) => {
      try {
        session.play(move);
        setError(null);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'falha ao aplicar jogada');
      }
    },
    [session],
  );

  const reset = useCallback(() => {
    // Preserva modo/dificuldade atuais (o reset do contrato volta ao modo padrão).
    session.reset({ mode: session.getSnapshot().mode });
    setError(null);
  }, [session]);

  const setDifficulty = useCallback(
    (next: Difficulty) => {
      session.setDifficulty(next);
    },
    [session],
  );

  return { snapshot, play, reset, setDifficulty, error };
}
