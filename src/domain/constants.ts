/**
 * Constantes estruturais do Ultimate Tic-Tac-Toe.
 * Ver docs/specs/SPEC-001-regras-e-bitboards.md e docs/ADR/ADR-001-bitboard.md.
 */

/** Quantidade de células (bits) de um micro-tabuleiro. */
export const CELL_BITS = 9;

/** Quantidade de micro-tabuleiros do macro-tabuleiro. */
export const BOARD_COUNT = 9;

/** Quantidade total de células jogáveis. */
export const TOTAL_CELLS = 81;

/** Máscara com todas as 9 células de um micro-tabuleiro ocupadas. */
export const FULL_BOARD = 0b111111111;

/**
 * As 8 linhas vencedoras de uma grade 3x3.
 * Bit 0 = célula superior esquerda (ordem de leitura).
 */
export const WIN_MASKS: readonly number[] = Object.freeze([
  0b000000111, // linha superior   (7)
  0b000111000, // linha central    (56)
  0b111000000, // linha inferior   (448)
  0b001001001, // coluna esquerda  (73)
  0b010010010, // coluna central   (146)
  0b100100100, // coluna direita   (292)
  0b100010001, // diagonal         (273)
  0b001010100, // anti-diagonal    (84)
]);

/** Índices das células centrais de cada micro-tabuleiro (coluna/linha 2). */
export const BOARD_CENTER_CELL = 4;
