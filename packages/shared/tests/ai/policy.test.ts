import { describe, expect, it } from 'vitest';
import {
  applyMove,
  createInitialState,
  isTerminal,
  legalMoveCount,
  legalMoves,
  stateFromBoards,
  type GameState,
} from '../../src/domain';
import { analyzeCandidate, pickRolloutMove, scoreCandidate } from '../../src/ai/policy';
import { createRng } from '../../src/ai/rng';

const line = (cells: number[]): number => cells.reduce((m, c) => m | (1 << c), 0);

/** X no centro do board 0; board 3 vencido por O. */
function freeMoveTrap(): GameState {
  return stateFromBoards({
    x: [line([4])],
    o: [line([0]), 0, 0, line([0, 1, 2])],
    activeBoard: 0,
    player: 1,
  });
}

describe('política de rollout: heurística anti-suicídio', () => {
  it('prefere fechar um micro-tabuleiro', () => {
    const state = stateFromBoards({
      x: [line([4, 5])],
      o: [line([0])],
      activeBoard: 0,
      player: 1,
    });
    const move = pickRolloutMove(state, 'heuristic', createRng(1));
    expect(move).toEqual({ board: 0, cell: 3 });
  });

  it('bloqueia trinca iminente do oponente', () => {
    const state = stateFromBoards({
      x: [line([4])],
      o: [line([0, 1])],
      activeBoard: 0,
      player: 1,
    });
    const move = pickRolloutMove(state, 'heuristic', createRng(2));
    expect(move).toEqual({ board: 0, cell: 2 });
    expect(analyzeCandidate(state, 0, 2).blocks).toBe(true);
  });

  it('evita entregar jogada livre ao oponente', () => {
    const state = freeMoveTrap();
    expect(analyzeCandidate(state, 0, 3).grantsFreeMove).toBe(true);
    expect(analyzeCandidate(state, 0, 1).grantsFreeMove).toBe(false);

    const rng = createRng(3);
    expect(scoreCandidate(state, 0, 1, rng)).toBeGreaterThan(
      scoreCandidate(state, 0, 3, createRng(3)),
    );

    const move = pickRolloutMove(state, 'heuristic', createRng(4));
    expect(move?.cell).not.toBe(3);
  });

  it('política leve devolve apenas jogadas legais e varia', () => {
    const state = createInitialState();
    const rng = createRng(5);
    const seen = new Set<number>();
    for (let i = 0; i < 60; i++) {
      const move = pickRolloutMove(state, 'light', rng);
      expect(move).not.toBeNull();
      if (!move) throw new Error('sem jogada');
      const legal = legalMoves(state).some((m) => m.board === move.board && m.cell === move.cell);
      expect(legal).toBe(true);
      seen.add(move.board * 9 + move.cell);
    }
    expect(seen.size).toBeGreaterThan(3);
  });

  it('retorna null quando a partida terminou', () => {
    let state = createInitialState();
    while (!isTerminal(state)) {
      state = applyMove(state, legalMoves(state)[0]);
    }
    expect(legalMoveCount(state)).toBe(0);
    expect(pickRolloutMove(state, 'heuristic', createRng(1))).toBeNull();
  });
});
