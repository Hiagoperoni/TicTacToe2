/**
 * Regras puras do Ultimate Tic-Tac-Toe.
 * Nenhum import externo, nenhum timer, nenhuma mutação de estado recebido.
 * Ver docs/specs/SPEC-001-regras-e-bitboards.md.
 */

import { BOARD_COUNT, FULL_BOARD, TOTAL_CELLS, WIN_MASKS, CELL_BITS } from './constants';
import { bitCount, cellMask, hasLine, isFull, WIN_TABLE } from './bitboard';
import type { GameState, MicroStatus, Move, Player } from './types';

/** Tabela de bits: `1 << board`. */
const BOARD_BIT: readonly number[] = Object.freeze(
  Array.from({ length: BOARD_COUNT }, (_, i) => 1 << i),
);

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

/** Situação de um micro-tabuleiro a partir das máscaras macro. */
function statusFromMasks(
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
      status: deadlock === 1 ? 'wonX' : 'wonO',
      winner: deadlock,
      activeBoard: null,
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
