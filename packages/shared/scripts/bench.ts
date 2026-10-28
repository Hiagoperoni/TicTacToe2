import { applyMove, createInitialState, legalMoves } from '../src/domain';
import { search } from '../src/ai/mcts';
import { optionsFor, DIFFICULTY_PRESETS } from '../src/ai/difficulty';
import { createRng } from '../src/ai/rng';

const rng = createRng(1);
let state = createInitialState();
for (let i = 0; i < 12; i++) {
  const moves = legalMoves(state);
  state = applyMove(state, moves[rng.nextInt(moves.length)]);
}

for (const level of ['iniciante', 'casual', 'competitivo', 'mestre'] as const) {
  const runs: number[] = [];
  let iterations = 0;
  for (let i = 0; i < 5; i++) {
    const r = search(state, { ...optionsFor(level, 42 + i) });
    runs.push(r.elapsedMs);
    iterations = r.iterations;
  }
  const max = Math.max(...runs).toFixed(1);
  const avg = (runs.reduce((a, b) => a + b, 0) / runs.length).toFixed(1);
  console.log(
    `${level.padEnd(12)} budget=${DIFFICULTY_PRESETS[level].timeBudgetMs}ms avg=${avg}ms max=${max}ms iters=${iterations}`,
  );
}
