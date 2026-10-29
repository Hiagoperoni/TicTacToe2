/**
 * Game feel (SPEC-003 A5, base05 §2.1): física de molas amortecidas
 * m·d²x/dt² + d·dx/dt + k·x = 0 e screen shake em erro (R3.4).
 */

export const SHAKE_DISTANCE_PX = 6;
export const SHAKE_DURATION_MS = 120;

export interface ShakeOffset {
  readonly x: number;
  readonly y: number;
}

export function randomShakeOffset(): ShakeOffset {
  const axis = () => (Math.random() * 2 - 1) * SHAKE_DISTANCE_PX;
  return { x: axis(), y: axis() };
}

export interface SpringState {
  readonly position: number;
  readonly velocity: number;
}

export interface SpringConfig {
  readonly stiffness: number;
  readonly damping: number;
  readonly mass: number;
}

/** Passo semi-implícito do integrador de molas (60 FPS). */
export function stepSpring(config: SpringConfig, state: SpringState, dtMs: number): SpringState {
  const dt = dtMs / 1000;
  const acceleration = (-config.damping * state.velocity - config.stiffness * state.position) / config.mass;
  const velocity = state.velocity + acceleration * dt;
  const position = state.position + velocity * dt;
  return { position, velocity };
}
