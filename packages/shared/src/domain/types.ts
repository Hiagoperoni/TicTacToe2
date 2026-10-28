/** Tipos do domínio. Nenhuma dependência externa: apenas dados puros. */

/** Jogador 1 = X, Jogador 2 = O (números ímpares/par para bitboards). */
export type Player = 1 | 2;

/** Índice de micro-tabuleiro no intervalo 0..8. */
export type BoardIndex = number;

/** Índice de célula local no intervalo 0..8. */
export type CellIndex = number;

/** Jogada localizada: sub-tabuleiro + célula. */
export interface Move {
  readonly board: BoardIndex;
  readonly cell: CellIndex;
}

/** Código compacto de jogada (0..80), usado pelo MCTS. */
export type MoveCode = number;

/** Situação de um micro-tabuleiro. */
export type MicroStatus = 'active' | 'wonX' | 'wonO' | 'tied';

/** Situação global da partida. */
export type GameStatus = 'in_progress' | 'wonX' | 'wonO' | 'draw';

/**
 * Estado completo e imutável.
 *
 * - `x`/`o`: 9 máscaras de 9 bits (uma por micro-tabuleiro).
 * - `macroX`/`macroO`/`macroTied`: 9 bits representando os micro-tabuleiros
 *   conquistados por cada jogador e os empatados (quadrante neutro).
 * - `activeBoard`: micro-tabuleiro obrigatório, ou `null` para jogada livre.
 * - `player`: jogador com o turno.
 * - `moveCount`: número de jogadas realizadas.
 * - `status`: condição terminal (o desempate por deadlock já está resolvido).
 * - `winner`: vencedor quando `status` é `wonX`/`wonO`; `null` em curso ou empate.
 */
export interface GameState {
  readonly x: Uint16Array;
  readonly o: Uint16Array;
  readonly macroX: number;
  readonly macroO: number;
  readonly macroTied: number;
  readonly activeBoard: BoardIndex | null;
  readonly player: Player;
  readonly moveCount: number;
  readonly status: GameStatus;
  readonly winner: Player | null;
}
