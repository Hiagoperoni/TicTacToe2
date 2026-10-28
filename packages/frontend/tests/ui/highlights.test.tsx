import { describe, expect, it } from 'vitest';
import { applyMove, createInitialState, stateFromBoards } from '@ttt/shared/domain';
import { ghostBoardOf, isActiveQuadrant, isFinalizedBoard } from '../../src/ui/highlights';

describe('Highlights (SPEC-003 A4)', () => {
  it('sem seleção não há ghost do destino', () => {
    expect(ghostBoardOf(null)).toBeNull();
  });

  it('pré-seleção marca o quadrante que será focado (ghost)', () => {
    expect(ghostBoardOf({ board: 6, cell: 2 })).toBe(2);
  });

  it('quadrante finalizado detectado via isFinalizedBoard', () => {
    const wonState = stateFromBoards({
      x: [7, 0, 0, 0, 0, 0, 0, 0, 0],
      o: new Array<number>(9).fill(0),
      activeBoard: null,
      player: 1,
      moveCount: 0,
    });
    expect(isFinalizedBoard(wonState, 0)).toBe(true);
    expect(isFinalizedBoard(wonState, 1)).toBe(false);
  });

  it('isActiveQuadrant reflete o sub-tabuleiro ativo do turno', () => {
    const state = applyMove(createInitialState(), { board: 4, cell: 6 });
    expect(isActiveQuadrant(state, 6)).toBe(true);
    expect(isActiveQuadrant(state, 4)).toBe(false);
  });
});
