/**
 * API pública do domínio. Nenhuma dependência externa.
 * Funções puras: `(state, move) => newState`.
 */

export {
  CELL_BITS,
  BOARD_COUNT,
  TOTAL_CELLS,
  FULL_BOARD,
  WIN_MASKS,
  BOARD_CENTER_CELL,
} from './constants';
export type { GameState, GameStatus, MicroStatus, Move, Player, BoardIndex, CellIndex } from './types';
export {
  WIN_TABLE,
  bitCount,
  cellMask,
  hasLine,
  isFull,
  winningCell,
  hasImmediateWin,
  blockingCell,
} from './bitboard';
export {
  createInitialState,
  microStatus,
  isBoardResolved,
  occupiedMask,
  legalMoveCount,
  legalMoveAt,
  legalMoves,
  isLegalMove,
  moveCode,
  decodeMove,
  deadlockWinner,
  applyMove,
  applyMoves,
  stateFromBoards,
  winnerOf,
  isTerminal,
  emptyCells,
  stateKey,
  LINES,
} from './rules';
export type { StateInput } from './rules';
