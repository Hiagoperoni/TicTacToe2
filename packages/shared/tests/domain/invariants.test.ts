import { describe, expect, it } from 'vitest';
import {
  BOARD_COUNT,
  FULL_BOARD,
  applyMove,
  bitCount,
  createInitialState,
  hasLine,
  isBoardResolved,
  isFull,
  isLegalMove,
  isTerminal,
  legalMoveCount,
  legalMoves,
  microStatus,
  occupiedMask,
  type GameState,
} from '../../src/domain';
import { createRng } from '../../src/ai/rng';

function assertInvariants(state: GameState): void {
  let derivedX = 0;
  let derivedO = 0;
  let derivedTied = 0;

  for (let board = 0; board < BOARD_COUNT; board++) {
    // Ocupação disjunta.
    expect(state.x[board] & state.o[board]).toBe(0);
    expect(state.x[board] & ~FULL_BOARD).toBe(0);
    expect(state.o[board] & ~FULL_BOARD).toBe(0);

    const bit = 1 << board;
    if (hasLine(state.x[board])) derivedX |= bit;
    else if (hasLine(state.o[board])) derivedO |= bit;
    else if (isFull(state.x[board] | state.o[board])) derivedTied |= bit;
  }

  // Máscaras macro coincidem com os micro-tabuleiros.
  expect(state.macroX).toBe(derivedX);
  expect(state.macroO).toBe(derivedO);
  expect(state.macroTied).toBe(derivedTied);

  // Jogada livre ou micro-tabuleiro ativo.
  if (state.activeBoard !== null) {
    expect(state.activeBoard).toBeGreaterThanOrEqual(0);
    expect(state.activeBoard).toBeLessThan(BOARD_COUNT);
    expect(isBoardResolved(state, state.activeBoard)).toBe(false);
  }

  if (!isTerminal(state)) {
    // Um estado não terminal sempre tem jogada legal.
    expect(legalMoveCount(state)).toBeGreaterThan(0);

    for (const move of legalMoves(state)) {
      expect(isLegalMove(state, move)).toBe(true);
      if (state.activeBoard !== null) expect(move.board).toBe(state.activeBoard);
      // Sub-grid encerrado nunca recebe jogada.
      expect(microStatus(state, move.board)).toBe('active');
      expect((occupiedMask(state, move.board) >> move.cell) & 1).toBe(0);
    }
  } else {
    expect(state.winner).not.toBeNull();
    expect(legalMoveCount(state)).toBe(0);
  }
}

describe('invariantes de regra (passeio aleatório determinístico)', () => {
  it('mantém todas as invariantes em 200 partidas completas', () => {
    for (let game = 0; game < 200; game++) {
      const rng = createRng(0xbeef + game);
      let state = createInitialState();
      assertInvariants(state);

      let plies = 0;
      while (!isTerminal(state) && plies < 81) {
        const count = legalMoveCount(state);
        const move = legalMoves(state)[rng.nextInt(count)];
        const before = state.moveCount;
        state = applyMove(state, move);
        assertInvariants(state);
        expect(state.moveCount).toBe(before + 1);
        plies++;
      }

      expect(isTerminal(state)).toBe(true);
      expect(plies).toBeLessThanOrEqual(81);
      // Terminou por alinhamento, deadlock (sempre com vencedor) — nunca "draw".
      expect(['wonX', 'wonO']).toContain(state.status);
    }
  });

  it('a soma de marcas nunca excede 81', () => {
    const state = createInitialState();
    expect(bitCount(occupiedMask(state, 0))).toBe(0);

    const rng = createRng(7);
    let current = state;
    let plies = 0;
    while (!isTerminal(current)) {
      current = applyMove(current, legalMoves(current)[rng.nextInt(legalMoveCount(current))]);
      plies++;
    }
    expect(current.moveCount).toBe(plies);
    expect(plies).toBeLessThanOrEqual(81);
  });
});
