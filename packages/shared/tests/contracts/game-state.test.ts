import { describe, expect, it } from 'vitest';
import type { GameStatePayload } from '@ttt/shared/contracts';
import { GameStatePayloadSchema, decodeGameState, encodeGameState } from '@ttt/shared/contracts';
import { createInitialState, stateFromBoards, type GameState } from '@ttt/shared/domain';

function payloadOf(state: GameState): GameStatePayload {
  return JSON.parse(JSON.stringify(encodeGameState(state))) as GameStatePayload;
}

describe('GameStatePayloadSchema (SPEC-004 §1.2)', () => {
  it('estado inicial serializa e revalida', () => {
    const state = createInitialState();
    const payload = GameStatePayloadSchema.parse(payloadOf(state));
    expect(payload.moveCount).toBe(0);
    expect(payload.activeBoard).toBeNull();
    expect(payload.player).toBe(1);
  });

  it('round-trip de posição com histórico preserva o domínio', () => {
    const source = stateFromBoards({
      x: [0b1, 0b0, 0b101000000, 0o0, 0b100, 0b110, 0, 0, 0],
      o: [0b1010, 0b1000, 0b10, 0, 0b1, 0, 0, 0, 0],
      activeBoard: 6,
      player: 2,
      moveCount: 11,
    });
    const decoded = decodeGameState(payloadOf(source));
    expect(decoded.status).toBe(source.status);
    expect(Array.from(decoded.x)).toEqual(Array.from(source.x));
    expect(Array.from(decoded.o)).toEqual(Array.from(source.o));
    expect(decoded.activeBoard).toBe(source.activeBoard);
    expect(decoded.player).toBe(source.player);
    expect(decoded.moveCount).toBe(source.moveCount);
  });

  it('mais de 9 máscaras rejeita', () => {
    const bad = { ...payloadOf(createInitialState()), x: Array.from({ length: 10 }, () => 0) };
    expect(() => GameStatePayloadSchema.parse(bad)).toThrow();
  });

  it('máscara fora de 9 bits rejeita (511 é o teto)', () => {
    const bad = { ...payloadOf(createInitialState()), x: [512, 0, 0, 0, 0, 0, 0, 0, 0] };
    expect(() => GameStatePayloadSchema.parse(bad)).toThrow();
  });

  it('campos extras rejeita (strict)', () => {
    const base = payloadOf(createInitialState()) as Record<string, unknown>;
    expect(() => GameStatePayloadSchema.parse({ ...base, extra: 1 })).toThrow();
  });

  it('activeBoard apontando para board resolvido rejeita ao decodificar', () => {
    // board 0 resolvido por X; activeBoard 0 é ilegal
    const bad = { x: [0b111100111, 0, 0, 0, 0, 0, 0, 0, 0], o: [0, 0, 0, 0, 0, 0, 0, 0, 0], activeBoard: 0, player: 1, moveCount: 6 } satisfies GameStatePayload;
    expect(() => decodeGameState(bad)).toThrow(RangeError);
  });
});
