import { describe, expect, it } from 'vitest';
import {
  applyMove,
  createInitialState,
  isLegalMove,
  isTerminal,
  legalMoves,
  stateFromBoards,
} from '../../src/domain';
import { search } from '../../src/ai/mcts';
import { createRng } from '../../src/ai/rng';
import { optionsFor, DIFFICULTY_PRESETS } from '../../src/ai/difficulty';

const line = (cells: number[]): number => cells.reduce((m, c) => m | (1 << c), 0);

describe('MCTS: contrato', () => {
  it('devolve jogada legal na posição inicial', () => {
    const state = createInitialState();
    const result = search(state, { iterations: 500, seed: 11 });
    expect(result.move).not.toBeNull();
    expect(isLegalMove(state, result.move!)).toBe(true);
    expect(result.stats.length).toBeGreaterThan(0);
    expect(result.nodes).toBeLessThanOrEqual(501);
  });

  it('é determinístico para a mesma semente e orçamento', () => {
    const state = createInitialState();
    const a = search(state, { iterations: 400, seed: 99 });
    const b = search(state, { iterations: 400, seed: 99 });
    expect(b.move).toEqual(a.move);
    expect(b.stats.map((s) => s.visits)).toEqual(a.stats.map((s) => s.visits));
  });

  it('encontra vitória imediata no macro-tabuleiro', () => {
    // Só a célula 2 de board2 fecha a linha macro 0-1-2; qualquer outra
    // jogada entrega a vez e o deadlock favorece O (4 quadrantes contra 2).
    const win = line([0, 1, 2]);
    const state = stateFromBoards({
      x: [win, win, line([0, 1])],
      o: [0, 0, line([3, 4, 7, 8]), win, 0, win, win, 0, win],
      activeBoard: 2,
      player: 1,
    });
    expect(state.status).toBe('in_progress');

    const result = search(state, { iterations: 2_000, seed: 5, timeBudgetMs: 0 });
    expect(result.move).toEqual({ board: 2, cell: 2 });
    expect(result.stats[0]?.move).toEqual({ board: 2, cell: 2 });
    expect(result.stats[0]?.value).toBeCloseTo(1, 5);
  });

  it('nunca devolve jogada ilegal em posições intermediárias', () => {
    const rng = createRng(2026);
    for (let sample = 0; sample < 8; sample++) {
      let state = createInitialState();
      for (let ply = 0; ply < 20 + sample && !isTerminal(state); ply++) {
        const moves = legalMoves(state);
        state = applyMove(state, moves[rng.nextInt(moves.length)]);
      }
      if (isTerminal(state)) continue;
      const result = search(state, { iterations: 300, seed: sample });
      expect(result.move).not.toBeNull();
      expect(isLegalMove(state, result.move!)).toBe(true);
    }
  });

  it('devolve null em posição terminal', () => {
    const state = stateFromBoards({
      x: [line([0, 1, 2]), line([0, 1, 2]), line([0, 1, 2])],
      o: [],
    });
    expect(isTerminal(state)).toBe(true);
    expect(search(state).move).toBeNull();
  });

  it('respeita o orçamento de tempo (relógio injetado)', () => {
    let clock = 0;
    const now = (): number => {
      clock += 10;
      return clock;
    };
    const result = search(createInitialState(), {
      iterations: 5_000,
      timeBudgetMs: 45,
      seed: 3,
      now,
    });
    expect(result.iterations).toBeLessThan(5_000);
    expect(result.elapsedMs).toBeGreaterThanOrEqual(45);
  });

  it('presets de dificuldade são monotônicos e dentro do orçamento de 50ms', () => {
    const levels = ['iniciante', 'casual', 'competitivo', 'mestre'] as const;
    for (let i = 1; i < levels.length; i++) {
      expect(DIFFICULTY_PRESETS[levels[i]].iterations).toBeGreaterThan(
        DIFFICULTY_PRESETS[levels[i - 1]].iterations,
      );
      expect(DIFFICULTY_PRESETS[levels[i]].timeBudgetMs).toBeLessThanOrEqual(50);
    }
    const opts = optionsFor('competitivo', 123);
    expect(opts.seed).toBe(123);
    expect(opts.timeBudgetMs).toBe(45);
  });
});
