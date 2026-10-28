import type { GameState } from '../domain';
import { z } from 'zod';
import { stateFromBoards } from '../domain';

/** Serialização do domínio para a rede (o `GameState` tem `Uint16Array`, não serializável em JSON). */
export const GameStatePayloadSchema = z.object({
  x: z.array(z.number().int().min(0).max(511)).max(9), // máscara de 9 bits (ADR-001)
  o: z.array(z.number().int().min(0).max(511)).max(9),
  activeBoard: z.number().int().min(0).max(8).nullable(),
  player: z.union([z.literal(1), z.literal(2)]),
  moveCount: z.number().int().min(0),
}).strict();

export type GameStatePayload = z.infer<typeof GameStatePayloadSchema>;

/** Converte GameState (domínio) => GameStatePayload (rede). */
export function encodeGameState(state: GameState): GameStatePayload {
  return {
    x: Array.from(state.x),
    o: Array.from(state.o),
    activeBoard: state.activeBoard,
    player: state.player,
    moveCount: state.moveCount,
  };
}

/** Converte GameStatePayload (rede) => GameState (domínio). */
export function decodeGameState(payload: GameStatePayload): GameState {
  // Usa stateFromBoards com validação de activeBoard
  return stateFromBoards({
    x: payload.x,
    o: payload.o,
    activeBoard: payload.activeBoard,
    player: payload.player,
    moveCount: payload.moveCount,
  });
}