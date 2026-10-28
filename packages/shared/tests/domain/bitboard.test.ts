import { describe, expect, it } from 'vitest';
import {
  FULL_BOARD,
  WIN_MASKS,
  bitCount,
  hasLine,
  isFull,
  winningCell,
} from '../../src/domain';

describe('bitboard: máscaras e tabelas', () => {
  it('expõe exatamente as 8 máscaras vencedoras da spec', () => {
    expect([...WIN_MASKS]).toEqual([
      0b000000111,
      0b000111000,
      0b111000000,
      0b001001001,
      0b010010010,
      0b100100100,
      0b100010001,
      0b001010100,
    ]);
    expect([...WIN_MASKS]).toEqual([7, 56, 448, 73, 146, 292, 273, 84]);
  });

  it('WIN_TABLE reconhece cada trinca e rejeita máscaras incompletas', () => {
    for (const line of WIN_MASKS) expect(hasLine(line)).toBe(true);
    expect(hasLine(0)).toBe(false);
    expect(hasLine(0b000000011)).toBe(false);
    expect(hasLine(FULL_BOARD)).toBe(true);
  });

  it('bitCount conta bits de 9 bits', () => {
    expect(bitCount(0)).toBe(0);
    expect(bitCount(FULL_BOARD)).toBe(9);
    expect(bitCount(0b101010101)).toBe(5);
  });

  it('isFull só aceita as 9 células', () => {
    expect(isFull(FULL_BOARD)).toBe(true);
    expect(isFull(0b011111111)).toBe(false);
  });

  it('winningCell devolve a célula que fecha a trinca', () => {
    expect(winningCell(0b000000011, 0b000000011)).toBe(2);
    expect(winningCell(0b100010000, 0b100010000)).toBe(0);
    expect(winningCell(0b001001000, 0b001001000)).toBe(0);
  });

  it('winningCell devolve -1 quando a célula restante está ocupada', () => {
    expect(winningCell(0b000000011, 0b000000111)).toBe(-1);
    expect(winningCell(0, 0)).toBe(-1);
  });
});
