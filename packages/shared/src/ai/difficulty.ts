/**
 * Presets de dificuldade (SPEC-002 §3).
 * `iterations` é teto; `timeBudgetMs` é o corte por relógio do turno.
 */

import type { MctsOptions } from './mcts';

export type Difficulty = 'iniciante' | 'casual' | 'competitivo' | 'mestre';

export interface DifficultyPreset extends Required<Pick<MctsOptions, 'iterations'>> {
  readonly timeBudgetMs: number;
  readonly exploration: number | 'dynamic';
  readonly rollout: 'light' | 'heuristic';
  readonly temperature: number;
}

export const DIFFICULTY_PRESETS: Readonly<Record<Difficulty, DifficultyPreset>> = Object.freeze({
  iniciante: {
    iterations: 300,
    timeBudgetMs: 20,
    exploration: 2.0,
    rollout: 'light',
    temperature: 2.0,
  },
  casual: {
    iterations: 3_000,
    timeBudgetMs: 35,
    exploration: 1.414,
    rollout: 'light',
    temperature: 1.0,
  },
  competitivo: {
    iterations: 30_000,
    timeBudgetMs: 45,
    exploration: 1.0,
    rollout: 'heuristic',
    temperature: 0.3,
  },
  mestre: {
    iterations: 120_000,
    timeBudgetMs: 45,
    exploration: 'dynamic',
    rollout: 'heuristic',
    temperature: 0.05,
  },
});

/** Converte um preset em opções de `search`, preservando a semente. */
export function optionsFor(difficulty: Difficulty, seed: number): MctsOptions {
  const preset = DIFFICULTY_PRESETS[difficulty];
  return {
    iterations: preset.iterations,
    timeBudgetMs: preset.timeBudgetMs,
    exploration: preset.exploration,
    rollout: preset.rollout,
    temperature: preset.temperature,
    seed,
  };
}
