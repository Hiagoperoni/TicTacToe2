/**
 * Regras puras do Ultimate Tic-Tac-Toe.
 * Nenhum import externo, nenhum timer, nenhuma mutação de estado recebido.
 * Ver docs/specs/SPEC-001-regras-e-bitboards.md.
 */

import { BOARD_COUNT, CELL_BITS, FULL_BOARD, TOTAL_CELLS, WIN_MASKS } from './constants';
import { bitCount, cellMask, hasLine, isFull, WIN_TABLE } from './bitboard';
import { BOARD_BIT, isLegalMove, microStatus, occupiedMask, statusFromMasks } from './moves';
import type { GameState, Move, Player } from './types';

export { decodeMove, isBoardResolved, isLegalMove, legalMoveAt, legalMoves, legalMoveCount, microStatus, moveCode, occupiedMask } from './moves';

/** Estado inicial: tabuleiro vazio, jogador 1 (X), jogada livre. */
export function createInitialState(startingPlayer: Player = 1): GameState {
  return {
    x: new Uint16Array(BOARD_COUNT),
    o: new Uint16Array(BOARD_COUNT),
    macroX: 0,
    macroO: 0,
    macroTied: 0,
    activeBoard: null,
    player: startingPlayer,
    moveCount: 0,
    status: 'in_progress',
    winner: null,
  };
}

/**
 * Desempate de deadlock (SPEC §3.3):
 * quadrantes → células → vitória de O.
 */
export function deadlockWinner(state: GameState): Player {
  const quadrantsX = bitCount(state.macroX);
  const quadrantsO = bitCount(state.macroO);
  if (quadrantsX !== quadrantsO) return quadrantsX > quadrantsO ? 1 : 2;

  let cellsX = 0;
  let cellsO = 0;
  for (let board = 0; board < BOARD_COUNT; board++) {
    cellsX += bitCount(state.x[board]);
    cellsO += bitCount(state.o[board]);
  }
  if (cellsX !== cellsO) return cellsX > cellsO ? 1 : 2;
  return 2; // Armageddon: vantagem de pretas (Jogador 2)
}

/** Micro-tabuleiros ainda abertos. */
function openBoards(state: GameState): number {
  return (
    BOARD_COUNT -
    (bitCount(state.macroX) + bitCount(state.macroO) + bitCount(state.macroTied))
  );
}

/**
 * Aplica uma jogada e devolve um novo estado.
 * Lança `RangeError` se a jogada for ilegal (inclui sub-grid encerrado).
 */
export function applyMove(state: GameState, move: Move): GameState {
  if (!isLegalMove(state, move)) {
    throw new RangeError(
      `jogada ilegal: board=${move.board} cell=${move.cell} ` +
        `(activeBoard=${state.activeBoard ?? 'free'}, player=${state.player})`,
    );
  }

  const { board, cell } = move;
  const x = state.x.slice();
  const o = state.o.slice();

  if (state.player === 1) x[board] |= cellMask(cell);
  else o[board] |= cellMask(cell);

  let macroX = state.macroX;
  let macroO = state.macroO;
  let macroTied = state.macroTied;
  const boardBit = BOARD_BIT[board];

  if ((macroX & boardBit) === 0 && (macroO & boardBit) === 0) {
    if (hasLine(x[board])) macroX |= boardBit;
    else if (hasLine(o[board])) macroO |= boardBit;
    else if (isFull(x[board] | o[board])) macroTied |= boardBit;
  }

  const macroWonX = WIN_TABLE[macroX] === 1;
  const macroWonO = WIN_TABLE[macroO] === 1;

  let status: GameState['status'] = 'in_progress';
  let winner: Player | null = null;

  if (macroWonX) {
    status = 'wonX';
    winner = 1;
  } else if (macroWonO) {
    status = 'wonO';
    winner = 2;
  }

  // Redirecionamento: a célula jogada define o próximo micro-tabuleiro;
  // se ele já estiver encerrado, o oponente recebe jogada livre (null).
  const activeBoard =
    status === 'in_progress' && statusFromMasks(macroX, macroO, macroTied, cell) === 'active'
      ? cell
      : null;

  const nextState: GameState = {
    x,
    o,
    macroX,
    macroO,
    macroTied,
    activeBoard,
    player: state.player === 1 ? 2 : 1,
    moveCount: state.moveCount + 1,
    status,
    winner,
  };

  if (status === 'in_progress' && openBoards(nextState) === 0) {
    const deadlock = deadlockWinner(nextState);
    return {
      ...nextState,
      activeBoard: null,
      status: deadlock === 1 ? 'wonX' : 'wonO',
      winner: deadlock,
    };
  }

  return nextState;
}

/** Entrada para reconstruir uma posição a partir de máscaras por micro-tabuleiro. */
export interface StateInput {
  readonly x: readonly number[];
  readonly o: readonly number[];
  readonly activeBoard?: number | null;
  readonly player?: Player;
  readonly moveCount?: number;
}

/**
 * Reconstrói um estado completo a partir das máscaras dos micro-tabuleiros,
 * derivando macro-tabuleiro, status e desempate de deadlock.
 * Útil para fixtures de teste, puzzles e carregamento de posições salvas.
 */
export function stateFromBoards(input: StateInput): GameState {
  if (input.x.length > BOARD_COUNT || input.o.length > BOARD_COUNT) {
    throw new RangeError('stateFromBoards aceita no máximo 9 máscaras por jogador');
  }
  const x = new Uint16Array(BOARD_COUNT);
  const o = new Uint16Array(BOARD_COUNT);
  let macroX = 0;
  let macroO = 0;
  let macroTied = 0;
  let moveCount = 0;

  for (let board = 0; board < BOARD_COUNT; board++) {
    const xMask = (input.x[board] ?? 0) & FULL_BOARD;
    const oMask = (input.o[board] ?? 0) & FULL_BOARD;
    if ((xMask & oMask) !== 0) {
      throw new RangeError(`stateFromBoards: sobreposição no micro-tabuleiro ${board}`);
    }
    x[board] = xMask;
    o[board] = oMask;
    moveCount += bitCount(xMask) + bitCount(oMask);
    const bit = BOARD_BIT[board];
    if (hasLine(xMask)) macroX |= bit;
    else if (hasLine(oMask)) macroO |= bit;
    else if (isFull(xMask | oMask)) macroTied |= bit;
  }

  // Validacao de activeBoard: deve ser null ou 0..8, e nao pode apontar para sub-grid resolvido
  const activeBoard = input.activeBoard;
  if (activeBoard === undefined || activeBoard === null) {
    // validado como null acima
  } else if (Number.isInteger(activeBoard) && activeBoard >= 0 && activeBoard <= 8) {
    const board = activeBoard;
    const micro = statusFromMasks(macroX, macroO, macroTied, board);
    if (micro !== 'active') {
      throw new RangeError(`stateFromBoards: activeBoard ${board} ja esta resolvido (${micro}), nao pode ser activeBoard`);
    }
  } else {
    throw new RangeError(`stateFromBoards: activeBoard invalido ${activeBoard}, deve ser null ou 0..8`);
  }

  let status: GameState['status'] = 'in_progress';
  let winner: Player | null = null;
  if (WIN_TABLE[macroX] === 1) {
    status = 'wonX';
    winner = 1;
  } else if (WIN_TABLE[macroO] === 1) {
    status = 'wonO';
    winner = 2;
  }

  const state: GameState = {
    x,
    o,
    macroX,
    macroO,
    macroTied,
    activeBoard: input.activeBoard ?? null,
    player: input.player ?? 1,
    moveCount: input.moveCount ?? moveCount,
    status,
    winner,
  };

  if (status === 'in_progress' && openBoards(state) === 0) {
    const deadlock = deadlockWinner(state);
    return {
      ...state,
      activeBoard: null,
      status: deadlock === 1 ? 'wonX' : 'wonO',
      winner: deadlock,
    };
  }

  return state;
}

/** Vencedor do estado, ou `null` se a partida continua ou empatou. */
export function winnerOf(state: GameState): Player | null {
  return state.winner;
}

/** `true` se a partida terminou. */
export function isTerminal(state: GameState): boolean {
  return state.status !== 'in_progress';
}

/** Total de células ainda livres. */
export function emptyCells(state: GameState): number {
  let occupied = 0;
  for (let board = 0; board < BOARD_COUNT; board++) occupied += bitCount(occupiedMask(state, board));
  return TOTAL_CELLS - occupied;
}

/** Representação compacta para depuração/testes. */
export function stateKey(state: GameState): string {
  const parts: string[] = [];
  for (let board = 0; board < BOARD_COUNT; board++) {
    let row = '';
    for (let cell = 0; cell < CELL_BITS; cell++) {
      const bit = 1 << cell;
      row += (state.x[board] & bit) !== 0 ? 'x' : (state.o[board] & bit) !== 0 ? 'o' : '.';
    }
    const tag = microStatus(state, board);
    parts.push(`${tag === 'active' ? '' : tag}:${row}`);
  }
  return `${parts.join('|')} ${state.activeBoard ?? '*'} ${state.player}`;
}

/**
 * Constrói um estado a partir de uma sequência de jogadas, para testes e
 * puzzles. Aplica cada jogada validando as regras.
 */
export function applyMoves(state: GameState, moves: readonly Move[]): GameState {
  return moves.reduce((current, move) => applyMove(current, move), state);
}

/** Todas as máscaras vencedoras (reexportado para testes/documentação). */
export const LINES = WIN_MASKS;
