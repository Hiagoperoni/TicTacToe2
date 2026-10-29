/** PRNG determinístico (mulberry32). Sem dependência de `Math.random`. */

export interface Rng {
  /** Próximo float em [0, 1). */
  next(): number;
  /** Inteiro em [0, bound). */
  nextInt(bound: number): number;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    nextInt(bound: number): number {
      if (bound <= 0) return 0;
      return Math.floor(next() * bound) % bound;
    },
  };
}
