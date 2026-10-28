/**
 * Consultas de jogadas e micro-tabuleiros: contagem, seleção canônica k-ésima,
 * validação e status. Nenhum import externo, nenhum timer, nenhuma mutação de
 * estado recebido. Ver docs/specs/SPEC-001-regras-e-bitboards.md.
 */

import { BOARD_COUNT, CELL_BITS, FULL_BOARD } from './constants';
import { bitCount } from './bitboard';
import type { GameState, MicroStatus, Move } from './types';

/** Tabela de bits: `1 << board`. */
export const BOARD_BIT: readonly number[] = Object.freeze(
  Array.from({ length: BOARD_COUNT }, (_, i) => 1 << i),
);

/** Situação de um micro-tabuleiro a partir das máscaras macro. */
export function statusFromMasks(
  macroX: number,
  macroO: number,
  macroTied: number,
  board: number,
): MicroStatus {
  const bit = BOARD_BIT[board];
  if ((macroX & bit) !== 0) return 'wonX';
  if ((macroO & bit) !== 0) return 'wonO';
  if ((macroTied & bit) !== 0) return 'tied';
  return 'active';
}

/** Situação de um micro-tabuleiro. */
export function microStatus(state: GameState, board: number): MicroStatus {
  return statusFromMasks(state.macroX, state.macroO, state.macroTied, board);
}

/** `true` se o micro-tabuleiro está encerrado (vencido ou empatado). */
export function isBoardResolved(state: GameState, board: number): boolean {
  return microStatus(state, board) !== 'active';
}

/** Máscara de ocupação de um micro-tabuleiro (ambos os jogadores). */
export function occupiedMask(state: GameState, board: number): number {
  return (state.x[board] | state.o[board]) & FULL_BOARD;
}

/** Número de jogadas legais no estado atual. */
export function legalMoveCount(state: GameState): number {
  if (state.status !== 'in_progress') return 0;
  if (state.activeBoard !== null) {
    const board = state.activeBoard;
    return CELL_BITS - bitCount(occupiedMask(state, board));
  }
  let total = 0;
  for (let board = 0; board < BOARD_COUNT; board++) {
    if (isBoardResolved(state, board)) continue;
    total += CELL_BITS - bitCount(occupiedMask(state, board));
  }
  return total;
}

/**
 * k-ésima jogada legal, na ordem canônica (board crescente, célula crescente).
 * Sem alocação de arrays; usado pelo motor de busca.
 */
export function legalMoveAt(state: GameState, k: number): Move {
  let remaining = k;
  if (state.activeBoard !== null) {
    const board = state.activeBoard;
    const occupied = occupiedMask(state, board);
    for (let cell = 0; cell < CELL_BITS; cell++) {
      if (((occupied >> cell) & 1) === 0) {
        if (remaining === 0) return { board, cell };
        remaining--;
      }
    }
    throw new RangeError(`índice de jogada fora do intervalo: ${k}`);
  }
  for (let board = 0; board < BOARD_COUNT; board++) {
    if (isBoardResolved(state, board)) continue;
    const occupied = occupiedMask(state, board);
    for (let cell = 0; cell < CELL_BITS; cell++) {
      if (((occupied >> cell) & 1) === 0) {
        if (remaining === 0) return { board, cell };
        remaining--;
      }
    }
  }
  throw new RangeError(`índice de jogada fora do intervalo: ${k}`);
}

/** Todas as jogadas legais (aloca array; não usar no rollout). */
export function legalMoves(state: GameState): Move[] {
  const count = legalMoveCount(state);
  const moves: Move[] = new Array(count);
  for (let k = 0; k < count; k++) moves[k] = legalMoveAt(state, k);
  return moves;
}

/** `true` se a jogada respeita redirecionamento, ocupação e sub-grid encerrado. */
export function isLegalMove(state: GameState, move: Move): boolean {
  if (state.status !== 'in_progress') return false;
  const { board, cell } = move;
  if (!Number.isInteger(board) || board < 0 || board >= BOARD_COUNT) return false;
  if (!Number.isInteger(cell) || cell < 0 || cell >= CELL_BITS) return false;
  if (isBoardResolved(state, board)) return false;
  if (state.activeBoard !== null && board !== state.activeBoard) return false;
  return ((occupiedMask(state, board) >> cell) & 1) === 0;
}

/** Código compacto 0..80 (board * 9 + cell). */
export function moveCode(move: Move): number {
  return move.board * CELL_BITS + move.cell;
}

/** Decodifica um código de jogada. */
export function decodeMove(code: number): Move {
  return { board: Math.floor(code / CELL_BITS), cell: code % CELL_BITS };
}
