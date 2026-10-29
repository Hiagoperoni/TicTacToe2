/**
 * Contratos client ↔ rede (SPEC-004 §1). Frontend e backend conversam
 * EXCLUSIVAMENTE por aqui: `@ttt/shared/contracts`.
 * Schemas Zod: validação na fronteira; tipos derivados, nunca duplicados.
 */

export {
  GameStatePayloadSchema,
  encodeGameState,
  decodeGameState,
} from './game-state';
export type { GameStatePayload } from './game-state';
export {
  MovePayloadSchema,
  RoomStatusSchema,
  ClientEventSchema,
  ServerEventSchema,
} from './server-protocol';
export type {
  MovePayload,
  ClientEvent,
  ServerEvent,
  RoomStatus,
} from './server-protocol';
export type { OnlineSnapshot, OnlineSession } from './online-session';
