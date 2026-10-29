/**
 * MCTS offline para Ultimate Tic-Tac-Toe.
 *
 * Arena de nós em TypedArrays paralelos (zero objetos por nó), quatro fases
 * clássicas (Selection / Expansion / Simulation / Backpropagation) e UCT
 * negamax com constante de exploração dinâmica.
 *
 * Ver docs/specs/SPEC-002-mcts.md e docs/adr/ADR-003-arena-mcts.md.
 */

import {
  FULL_BOARD,
  applyMove,
  isBoardResolved,
  isTerminal,
  legalMoveCount,
  moveCode,
  type GameState,
  type Move,
  type Player,
} from '../domain';
import { createRng, type Rng } from './rng';
import { pickRolloutMove, type RolloutPolicy } from './policy';

export interface MctsOptions {
  /** Teto de iterações (uma expansão de nó por iteração). */
  iterations?: number;
  /** Orçamento de tempo em ms; `0` desativa o corte por relógio. */
  timeBudgetMs?: number;
  /** Constante C do UCT, ou `'dynamic'` (0.85 restrito / 1.25 livre). */
  exploration?: number | 'dynamic';
  /** Política de simulação. */
  rollout?: RolloutPolicy;
  /** Semente do PRNG: mesma semente + mesmas iterações = mesma jogada. */
  seed?: number;
  /** Temperatura Softmax sobre as visitas da raiz (0 = argmax). */
  temperature?: number;
  /** Relógio injetável; padrão `Date.now`. */
  now?: () => number;
}

export interface RootMoveStat {
  readonly move: Move;
  readonly visits: number;
  /** Valor médio na perspectiva do jogador da raiz (-1..1). */
  readonly value: number;
}

export interface MctsResult {
  readonly move: Move | null;
  readonly stats: readonly RootMoveStat[];
  readonly iterations: number;
  readonly nodes: number;
  readonly elapsedMs: number;
}

const DEFAULTS = {
  iterations: 2_000,
  timeBudgetMs: 0,
  exploration: 'dynamic' as const,
  rollout: 'heuristic' as RolloutPolicy,
  seed: 42,
  temperature: 0,
};

const MAX_PLIES = 82;
const MAX_MOVES = 82;

/** Resultado da partida na perspectiva de um jogador. */
function outcomeFor(state: GameState, player: Player): number {
  const winner = state.winner;
  if (winner === null) return 0;
  return winner === player ? 1 : -1;
}

/** Simula até o fim; retorna 1 (jogador da raiz vence), -1 ou 0. */
function simulate(
  state: GameState,
  rollout: RolloutPolicy,
  rng: Rng,
  rootPlayer: Player,
): number {
  let current = state;
  let plies = 0;
  while (!isTerminal(current) && plies < MAX_MOVES) {
    const move = pickRolloutMove(current, rollout, rng);
    if (move === null) break;
    current = applyMove(current, move);
    plies++;
  }
  return outcomeFor(current, rootPlayer);
}

/** Tempo restante esgotado. */
function timeUp(start: number, budget: number, now: () => number, every: number, iteration: number): boolean {
  return budget > 0 && iteration > 0 && iteration % every === 0 && now() - start >= budget;
}

export function search(state: GameState, options: MctsOptions = {}): MctsResult {
  const iterations = Math.max(1, options.iterations ?? DEFAULTS.iterations);
  const timeBudgetMs = options.timeBudgetMs ?? DEFAULTS.timeBudgetMs;
  const exploration = options.exploration ?? DEFAULTS.exploration;
  const rollout = options.rollout ?? DEFAULTS.rollout;
  const temperature = options.temperature ?? DEFAULTS.temperature;
  const now = options.now ?? Date.now;
  const rng = createRng(options.seed ?? DEFAULTS.seed);

  const stats: RootMoveStat[] = [];
  if (isTerminal(state) || legalMoveCount(state) === 0) {
    return { move: null, stats, iterations: 0, nodes: 0, elapsedMs: 0 };
  }

  const start = now();

  // ---------- Arena ----------
  const capacity = iterations + 1;
  const visits = new Int32Array(capacity);
  const rewards = new Float64Array(capacity);
  const parent = new Int32Array(capacity).fill(-1);
  const firstChild = new Int32Array(capacity).fill(-1);
  const nextSibling = new Int32Array(capacity).fill(-1);
  const nodeMove = new Int32Array(capacity).fill(-1);
  const nodeState: GameState[] = new Array(capacity);
  nodeState[0] = state;

  const path = new Int32Array(MAX_PLIES);
  const usedCodes = new Uint8Array(MAX_MOVES);
  let nodesUsed = 1;
  let completed = 0;

  const rootPlayer = state.player;

  for (let iteration = 0; iteration < iterations; iteration++) {
    if (timeUp(start, timeBudgetMs, now, 16, iteration)) break;

    // ---------- Selection ----------
    let node = 0;
    let depth = 0;
    while (true) {
      const current = nodeState[node];
      path[depth++] = node;
      if (isTerminal(current)) break;

      const total = legalMoveCount(current);
      const expanded = countChildren(node, firstChild, nextSibling);

      if (expanded < total) {
        // ---------- Expansion ----------
        const move = pickUnexpanded(current, node, firstChild, nextSibling, nodeMove, usedCodes);
        if (move === null) break; // defensivo: contagem inconsistente

        const child = nodesUsed++;
        nodeState[child] = applyMove(current, move);
        parent[child] = node;
        nodeMove[child] = moveCode(move);
        nextSibling[child] = firstChild[node];
        firstChild[node] = child;
        path[depth++] = child;
        node = child;
        break;
      }

      if (total === 0) break;
      node = bestChild(node, current, visits, rewards, firstChild, nextSibling, exploration);
    }

    // ---------- Simulation ----------
    const leaf = nodeState[node];
    const value = isTerminal(leaf)
      ? outcomeFor(leaf, rootPlayer)
      : simulate(leaf, rollout, rng, rootPlayer);

    // ---------- Backpropagation ----------
    for (let i = depth - 1; i >= 0; i--) {
      const n = path[i];
      visits[n]++;
      // `value` está na perspectiva do jogador da raiz.
      rewards[n] += nodeState[n].player === rootPlayer ? value : -value;
    }
    completed++;
  }

  // ---------- Escolha final ----------
  for (let child = firstChild[0]; child !== -1; child = nextSibling[child]) {
    const n = visits[child];
    stats.push({
      move: legalMoveFromCode(nodeMove[child]),
      visits: n,
      value: n === 0 ? 0 : -rewards[child] / n,
    });
  }
  stats.sort((a, b) => b.visits - a.visits);

  const move = selectFinalMove(stats, temperature, rng);
  return {
    move,
    stats,
    iterations: completed,
    nodes: nodesUsed,
    elapsedMs: now() - start,
  };
}

function countChildren(
  node: number,
  firstChild: Int32Array,
  nextSibling: Int32Array,
): number {
  let count = 0;
  for (let child = firstChild[node]; child !== -1; child = nextSibling[child]) count++;
  return count;
}

function legalMoveFromCode(code: number): Move {
  return { board: Math.floor(code / 9), cell: code % 9 };
}

/** Primeira jogada legal ainda não expandida como filho do nó. */
function pickUnexpanded(
  state: GameState,
  node: number,
  firstChild: Int32Array,
  nextSibling: Int32Array,
  nodeMove: Int32Array,
  usedCodes: Uint8Array,
): Move | null {
  usedCodes.fill(0);
  for (let child = firstChild[node]; child !== -1; child = nextSibling[child]) {
    usedCodes[nodeMove[child]] = 1;
  }

  const active = state.activeBoard;
  const firstBoard = active === null ? 0 : active;
  const lastBoard = active === null ? 8 : active;

  for (let board = firstBoard; board <= lastBoard; board++) {
    if (isBoardResolved(state, board)) continue;
    const occupied = (state.x[board] | state.o[board]) & FULL_BOARD;
    for (let cell = 0; cell < 9; cell++) {
      if (((occupied >> cell) & 1) !== 0) continue;
      if (usedCodes[board * 9 + cell] === 0) return { board, cell };
    }
  }

  return null;
}

/** Filho com maior UCT negamax. */
function bestChild(
  node: number,
  state: GameState,
  visits: Int32Array,
  rewards: Float64Array,
  firstChild: Int32Array,
  nextSibling: Int32Array,
  exploration: number | 'dynamic',
): number {
  const c =
    exploration === 'dynamic' ? (state.activeBoard === null ? 1.25 : 0.85) : exploration;
  const logParent = Math.log(Math.max(1, visits[node]));

  let best = -1;
  let bestScore = -Infinity;
  for (let child = firstChild[node]; child !== -1; child = nextSibling[child]) {
    const n = visits[child];
    if (n === 0) return child;
    const exploit = -rewards[child] / n;
    const explore = c * Math.sqrt(logParent / n);
    const score = exploit + explore;
    if (score > bestScore) {
      bestScore = score;
      best = child;
    }
  }
  return best;
}

/** Softmax sobre visitas com temperatura T; T→0 é argmax. */
function selectFinalMove(
  stats: readonly RootMoveStat[],
  temperature: number,
  rng: Rng,
): Move | null {
  if (stats.length === 0) return null;
  if (stats.length === 1) return stats[0].move;
  if (temperature <= 0.01) return stats[0].move;

  const weights = stats.map((s) => Math.pow(Math.max(1, s.visits), 1 / temperature));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = rng.next() * total;
  for (let i = 0; i < stats.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return stats[i].move;
  }
  return stats[stats.length - 1].move;
}
