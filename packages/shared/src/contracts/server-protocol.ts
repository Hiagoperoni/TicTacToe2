
import { z } from 'zod';
import { GameStatePayloadSchema } from './game-state';

/** MovePayloadSchema — SPEC-004 §1.1, literal. */
export const MovePayloadSchema = z.object({
  cellIndex: z.number().int().min(0).max(80),
  macroIndex: z.number().int().min(0).max(8),
  microIndex: z.number().int().min(0).max(8),
  dan: z.string().regex(/^[A-C]\.[a-c]$/),
  pieSwap: z.boolean().default(false),
}).strict();

export type MovePayload = z.infer<typeof MovePayloadSchema>;

export const RoomStatusSchema = z.enum([
  'WAITING_PLAYERS', 'READY_CHECK', 'IN_PROGRESS',
  'DISCONNECTED_GRACE_PERIOD', 'FINISHED',
]);

export const ClientEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('JOIN_ROOM'), roomId: z.string().uuid(), token: z.string() }),
  z.object({ type: z.literal('READY') }),
  z.object({ type: z.literal('SUBMIT_MOVE'), sequence: z.number().int().positive(), payload: MovePayloadSchema, clientTime: z.number() }),
  z.object({ type: z.literal('PING_SYNC'), clientTime: z.number() }),
  z.object({ type: z.literal('SURRENDER') }),
]);

export const ServerEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ROOM_STATE_SNAPSHOT'), roomId: z.string().uuid(), state: GameStatePayloadSchema, turn: z.union([z.literal(1), z.literal(2)]), clocks: z.object({ p1: z.number(), p2: z.number() }), sequence: z.number().int().nonnegative(), status: RoomStatusSchema }),
  z.object({ type: z.literal('MOVE_ACCEPTED'), move: MovePayloadSchema, state: GameStatePayloadSchema, turn: z.union([z.literal(1), z.literal(2)]), clocks: z.object({ p1: z.number(), p2: z.number() }), sequence: z.number().int().positive() }),
  z.object({ type: z.literal('MOVE_REJECTED'), reason: z.string(), state: GameStatePayloadSchema }),
  z.object({ type: z.literal('CLOCK_UPDATE'), p1: z.number(), p2: z.number(), active: z.union([z.literal(1), z.literal(2)]) }),
  z.object({ type: z.literal('GAME_OVER'), winner: z.union([z.literal(1), z.literal(2)]).nullable(), reason: z.enum(['WIN', 'TIMEOUT', 'RESIGNATION', 'WO']) }),
  z.object({ type: z.literal('OPPONENT_STATUS'), status: z.enum(['DISCONNECTED', 'RECONNECTED']), graceMs: z.number().nonnegative() }),
  z.object({ type: z.literal('PONG_SYNC'), serverTime: z.number() }),
  z.object({ type: z.literal('ERROR'), code: z.string() }),
]);

export type ClientEvent = z.infer<typeof ClientEventSchema>;
export type ServerEvent = z.infer<typeof ServerEventSchema>;
export type RoomStatus = z.infer<typeof RoomStatusSchema>;