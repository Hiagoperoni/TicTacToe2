/**
 * App raiz do cliente Ultimate Tic-Tac-Toe (SPEC-003): composição da UI sobre a
 * sessão. Modo atual: `vs-ai` com `FakeAi` (demo/tests) — worker real entra por
 * `WorkerAi` (A7). Estética "Papel & Grafite" (styles/).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Board } from './ui/board';
import { createSynth } from './audio/synth';
import { useGameSession } from './session/use-game-session';
import { FakeAi } from './mocks/fake-ai';
import { randomShakeOffset, SHAKE_DURATION_MS } from './ui/motion';

const RESULT_LABEL: Readonly<Record<string, string>> = {
  wonX: 'X venceu a partida',
  wonO: 'O venceu a partida',
  draw: 'empate no tabuleiro',
};

export function App() {
  const { snapshot, play, error, reset } = useGameSession({
    ai: new FakeAi(),
    mode: 'vs-ai',
    difficulty: 'casual',
    seed: 42,
  });

  const synth = useMemo(() => createSynth(), []);
  const [shake, setShake] = useState<{ readonly x: number; readonly y: number } | null>(null);

  useEffect(() => {
    if (error === null) return;
    setShake(randomShakeOffset());
    const timer = setTimeout(() => setShake(null), SHAKE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (snapshot.state.status === 'wonX') synth.play('gameOverWin');
    else if (snapshot.state.status === 'wonO') synth.play('gameOverLose');
  }, [snapshot.state.status, synth]);

  const handlePlay = useCallback(
    (move: { readonly board: number; readonly cell: number }) => {
      play({ board: move.board, cell: move.cell });
      synth.play('impact');
    },
    [play, synth],
  );

  const handleInvalidMove = useCallback(
    (_move: { readonly board: number; readonly cell: number }) => {
      setShake(randomShakeOffset());
      synth.play('impact');
    },
    [synth],
  );

  const handleZoom = useCallback(() => {
    // Auto-zoom controlado interno do Board (interaction/auto-zoom).
  }, []);

  const turnLabel = snapshot.state.player === 1 ? 'X' : 'O';
  const resultLabel = RESULT_LABEL[snapshot.state.status] ?? null;

  return (
    <div className="app" data-testid="app">
      <header className="app__header" data-testid="app-header">
        <h1 className="app__title">Ultimate Tic-Tac-Toe</h1>
        <div className="app__status">
          <span className={`app__chip app__chip--turn-${turnLabel.toLowerCase()}`}>
            <span className="app__chip-dot" aria-hidden="true" />
            <span data-testid="turn">
              turno: <strong>{turnLabel}</strong>
            </span>
          </span>
          <span className={`app__chip${snapshot.aiPending ? ' app__chip--thinking' : ''}`}>
            <span className="app__chip-dot" aria-hidden="true" />
            <span data-testid="ai-pending">{snapshot.aiPending ? 'IA pensando…' : 'sua vez'}</span>
          </span>
          <button type="button" className="app__reset" data-testid="app__reset" onClick={reset}>
            reset
          </button>
        </div>
      </header>
      <main className={`app__board${shake !== null ? ' app__board--shake' : ''}`}>
        <Board
          state={snapshot.state}
          onPlay={handlePlay}
          onZoom={handleZoom}
          onInvalidMove={handleInvalidMove}
          lastMove={snapshot.lastMove}
        />
        {resultLabel !== null ? (
          <div className="app__result" data-testid="game-result">
            {resultLabel}
          </div>
        ) : null}
        {shake !== null ? (
          <div className="app__shake" data-testid="screen-shake" style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }} />
        ) : null}
      </main>
      <footer className="app__footer" data-testid="app-footer">
        modo: {snapshot.mode} · dificuldade: {snapshot.difficulty} · 2 toques: 1º prévia, 2º confirma
      </footer>
    </div>
  );
}
