import { describe, expect, it } from 'vitest';
import type { GameStatePayload } from '@ttt/shared/contracts';
import { ClientEventSchema, MovePayloadSchema, ServerEventSchema } from '@ttt/shared/contracts';

const ROOM_ID = 'c0b00000-0000-4000-8000-000000000001';

const SNAPSHOT = (state: Partial<GameStatePayload> = {}) => ({
  type: 'ROOM_STATE_SNAPSHOT',
  roomId: ROOM_ID,
  state: { x: [], o: [], activeBoard: null, player: 1, moveCount: 0, ...state },
  turn: 1 as 1 | 2,
  clocks: { p1: 60000, p2: 60000 },
  sequence: 0,
  status: 'IN_PROGRESS' as const,
});

describe('MovePayloadSchema (SPEC-004 §1.1)', () => {
  it('aceita lance válido e aplica default de pieSwap', () => {
    const move = MovePayloadSchema.parse({ cellIndex: 40, macroIndex: 4, microIndex: 4, dan: 'B.b' });
    expect(move.pieSwap).toBe(false);
  });

  it('cellIndex fora de 0..80 rejeita', () => {
    expect(() => MovePayloadSchema.parse({ cellIndex: 81, macroIndex: 8, microIndex: 8, dan: 'C.c' })).toThrow();
  });

  it('dan fora do formato rejeita', () => {
    expect(() => MovePayloadSchema.parse({ cellIndex: 0, macroIndex: 0, microIndex: 0, dan: 'D.a' })).toThrow();
  });

  it('campos extras rejeita (strict)', () => {
    expect(() => MovePayloadSchema.parse({ cellIndex: 0, macroIndex: 0, microIndex: 0, dan: 'A.a', extra: 1 })).toThrow();
  });
});

describe('ClientEventSchema (SPEC-004 §1.1)', () => {
  it('eventos válidos passam', () => {
    expect(ClientEventSchema.parse({ type: 'JOIN_ROOM', roomId: ROOM_ID, token: 't' }).type).toBe('JOIN_ROOM');
    expect(ClientEventSchema.parse({ type: 'READY' }).type).toBe('READY');
    expect(
      ClientEventSchema.parse({ type: 'SUBMIT_MOVE', sequence: 1, payload: { cellIndex: 0, macroIndex: 0, microIndex: 0, dan: 'A.a' }, clientTime: 1 }).type,
    ).toBe('SUBMIT_MOVE');
    expect(ClientEventSchema.parse({ type: 'PING_SYNC', clientTime: 1 }).type).toBe('PING_SYNC');
    expect(ClientEventSchema.parse({ type: 'SURRENDER' }).type).toBe('SURRENDER');
  });

  it('evento desconhecido rejeita (discriminated union)', () => {
    expect(() => ClientEventSchema.parse({ type: 'NUKE_ROOM' })).toThrow();
  });

  it('token ausente no JOIN_ROOM rejeita', () => {
    expect(() => ClientEventSchema.parse({ type: 'JOIN_ROOM', roomId: ROOM_ID })).toThrow();
  });
});

describe('ServerEventSchema (SPEC-004 §1.1)', () => {
  it('snapshot válido passa com turn 1 ou 2 apenas', () => {
    expect(ServerEventSchema.parse(SNAPSHOT()).type).toBe('ROOM_STATE_SNAPSHOT');
    const bad = SNAPSHOT() as Record<string, unknown>;
    bad.turn = 3;
    expect(() => ServerEventSchema.parse(bad)).toThrow();
  });

  it('sequence negativa no snapshot rejeita', () => {
    const bad = { ...SNAPSHOT(), sequence: -1 };
    expect(() => ServerEventSchema.parse(bad)).toThrow();
  });

  it('reason de GAME_OVER restrito', () => {
    expect(() => ServerEventSchema.parse({ type: 'GAME_OVER', winner: 1, reason: 'CHEAT' })).toThrow();
    const over = ServerEventSchema.parse({ type: 'GAME_OVER', winner: null, reason: 'WO' });
    expect(over.type === 'GAME_OVER' ? over.winner : -1).toBeNull();
  });

  it('MOVE_ACCEPTED exige state', () => {
    expect(() => ServerEventSchema.parse({ type: 'MOVE_ACCEPTED', move: { cellIndex: 0, macroIndex: 0, microIndex: 0, dan: 'A.a' } })).toThrow();
  });
});

describe('fronteira de validação cross-field (SPEC-004 §5.1)', () => {
  it('schema aceita cellIndex divergente de macro*9+micro — consistência é do servidor (B6 room.ts), não do schema', () => {
    // cellIndex 5 ≠ macroIndex 4 * 9 + microIndex 4 = 40:
    // o payload é SINTATICAMENTE válido no schema (campos independentes);
    // a validação cross-field que rejeita com MOVE_REJECTED é do room.ts (task B6),
    // porque zod discriminated union não cruza campos entre si (mesma decisão da SPEC).
    const incoherent = {
      cellIndex: 5,
      macroIndex: 4,
      microIndex: 4,
      dan: 'B.b',
      pieSwap: false,
    };
    expect(() => MovePayloadSchema.parse(incoherent)).not.toThrow();
  });
});
