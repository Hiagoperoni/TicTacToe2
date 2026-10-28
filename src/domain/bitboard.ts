/**
 * Operações bit a bit O(1) sobre máscaras de 9 bits.
 * Tabelas pré-computadas: dados determinísticos, calculados na carga do módulo.
 */

import { FULL_BOARD, WIN_MASKS } from './constants';

/** Tabela de vitória: `WIN_TABLE[mask] === 1` se a máscara contém uma trinca. */
export const WIN_TABLE: Uint8Array = (() => {
  const table = new Uint8Array(512);
  for (let mask = 0; mask < 512; mask++) {
    for (let i = 0; i < WIN_MASKS.length; i++) {
      const line = WIN_MASKS[i];
      if ((mask & line) === line) {
        table[mask] = 1;
        break;
      }
    }
  }
  return table;
})();

const POPCOUNT: Uint8Array = (() => {
  const table = new Uint8Array(512);
  for (let mask = 1; mask < 512; mask++) {
    table[mask] = table[mask >> 1] + (mask & 1);
  }
  return table;
})();

/** Número de bits ligados em uma máscara de 9 bits. */
export function bitCount(mask: number): number {
  return POPCOUNT[mask & FULL_BOARD];
}

/** Máscara de uma única célula (0..8). */
export function cellMask(cell: number): number {
  return 1 << cell;
}

/** `true` se a máscara de um jogador contém uma trinca. */
export function hasLine(mask: number): boolean {
  return WIN_TABLE[mask & FULL_BOARD] === 1;
}

/** `true` se todas as 9 células estão ocupadas. */
export function isFull(mask: number): boolean {
  return (mask & FULL_BOARD) === FULL_BOARD;
}

/**
 * Célula (0..8) que completa uma trinca de `own` considerando `occupied`
 * como todas as células já tomadas (de ambos os jogadores).
 * Retorna -1 quando não há ameaça convertível.
 */
export function winningCell(own: number, occupied: number): number {
  const free = ~occupied & FULL_BOARD;
  for (let i = 0; i < WIN_MASKS.length; i++) {
    const line = WIN_MASKS[i];
    const mine = own & line;
    if (bitCount(mine) === 2) {
      const missing = line & ~mine;
      if ((missing & free) !== 0) return 31 - Math.clz32(missing);
    }
  }
  return -1;
}

/** `true` se o dono de `own` pode fechar uma trinca na próxima jogada. */
export function hasImmediateWin(own: number, occupied: number): boolean {
  return winningCell(own, occupied) >= 0;
}

/** Célula livre que bloqueia a ameaça do oponente, ou -1. */
export function blockingCell(opponent: number, occupied: number): number {
  return winningCell(opponent, occupied);
}
