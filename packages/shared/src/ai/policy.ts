/**
 * Políticas de simulação (rollout) do MCTS.
 * A política `heuristic` aplica as três regras da SPEC-002 §2:
 * fechar micro-tabuleiro vencedor, bloquear vitória iminente e evitar
 * conceder Free Move ao oponente.
 */

import {
  FULL_BOARD,
  WIN_TABLE,
  cellMask,
  hasImmediateWin,
  hasLine,
  isBoardResolved,
  isFull,
  legalMoveAt,
  legalMoveCount,
  winningCell,
} from '../domain';
import type { GameState, Move } from '../domain';
import type { Rng } from './rng';

export type RolloutPolicy = 'light' | 'heuristic';

const BOARD_BIT: readonly number[] = Object.freeze(
  Array.from({ length: 9 }, (_, i) => 1 << i),
);

interface CandidateScore {
  /** Fecha o micro-tabuleiro com trinca. */
  winsBoard: boolean;
  /** Conclui uma trinca no macro-tabuleiro. */
  winsGame: boolean;
  /** Bloqueia trinca iminente do oponente no micro-tabuleiro jogado. */
  blocks: boolean;
  /** Entrega jogada livre ao oponente. */
  grantsFreeMove: boolean;
  /** Envia o oponente a um micro-tabuleiro onde ele fecha trinca. */
  feedsOpponentWin: boolean;
}

/** Analisa o efeito tático de uma jogada candidata. */
export function analyzeCandidate(state: GameState, board: number, cell: number): CandidateScore {
  const player = state.player;
  const ownMask = player === 1 ? state.x[board] : state.o[board];
  const oppMask = player === 1 ? state.o[board] : state.x[board];
  const occupied = (ownMask | oppMask) & FULL_BOARD;
  const bit = cellMask(cell);
  const nextOwn = ownMask | bit;
  const nextOccupied = occupied | bit;

  const winsBoard = hasLine(nextOwn);
  const boardClosed = winsBoard || isFull(nextOccupied);
  const macroOwn = player === 1 ? state.macroX : state.macroO;
  const winsGame = winsBoard && WIN_TABLE[(macroOwn | BOARD_BIT[board]) & FULL_BOARD] === 1;
  const blocks = winningCell(oppMask, occupied) === cell;

  const target = cell;
  let grantsFreeMove = isBoardResolved(state, target);
  let feedsOpponentWin = false;

  if (target === board) {
    grantsFreeMove = grantsFreeMove || boardClosed;
    if (!grantsFreeMove) {
      const oppThere = player === 1 ? state.o[target] : state.x[target];
      feedsOpponentWin = hasImmediateWin(oppThere, nextOccupied);
    }
  } else if (!grantsFreeMove) {
    const oppThere = player === 1 ? state.o[target] : state.x[target];
    const ownThere = player === 1 ? state.x[target] : state.o[target];
    feedsOpponentWin = hasImmediateWin(oppThere, (oppThere | ownThere) & FULL_BOARD);
  }

  return { winsBoard, winsGame, blocks, grantsFreeMove, feedsOpponentWin };
}

/** Pontuação heurística de um lance; usada no rollout guiado. */
export function scoreCandidate(state: GameState, board: number, cell: number, rng: Rng): number {
  const a = analyzeCandidate(state, board, cell);
  let score = 0;
  if (a.winsGame) score += 100_000;
  else if (a.winsBoard) score += 1_000;
  if (a.blocks) score += 300;
  if (a.grantsFreeMove) score -= 90;
  if (a.feedsOpponentWin) score -= 260;
  if (cell === 4) score += 4;
  return score + rng.next() * 0.5;
}

/**
 * Escolhe um lance de rollout. Retorna `null` se não houver jogadas legais.
 * `light` = uniforme; `heuristic` = argmax da pontuação tática.
 * A varredura é feita direto sobre as máscaras (sem alocar a lista de jogadas).
 */
export function pickRolloutMove(
  state: GameState,
  policy: RolloutPolicy,
  rng: Rng,
): Move | null {
  const count = legalMoveCount(state);
  if (count === 0) return null;
  if (policy === 'light') return legalMoveAt(state, rng.nextInt(count));

  const active = state.activeBoard;
  const firstBoard = active === null ? 0 : active;
  const lastBoard = active === null ? 8 : active;

  let best: Move | null = null;
  let bestScore = -Infinity;
  for (let board = firstBoard; board <= lastBoard; board++) {
    if (isBoardResolved(state, board)) continue;
    const occupied = (state.x[board] | state.o[board]) & FULL_BOARD;
    for (let cell = 0; cell < 9; cell++) {
      if (((occupied >> cell) & 1) !== 0) continue;
      const score = scoreCandidate(state, board, cell, rng);
      if (score > bestScore) {
        bestScore = score;
        best = { board, cell };
      }
    }
  }
  return best;
}
