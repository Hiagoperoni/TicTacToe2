/**
 * Semiótica visual obrigatória (SPEC-003 §3, base05 §1.2–1.3):
 * - borda pulsante do quadrante ativo (1,2 Hz);
 * - ghost do destino do oponente (pré-visualização);
 * - overlay de quadrante finalizado (30% opacidade + blur + glifo gigante).
 */

import { isBoardResolved, type GameState, type MicroStatus, type Player } from '@ttt/shared/domain';
import type { Move } from '@ttt/shared/domain';

/** Quadrante que recebe a jogada do oponente (próximo sub-tabuleiro da pré-seleção). */
export function ghostBoardOf(selection: Move | null): number | null {
  if (selection === null) return null;
  return selection.cell;
}

/** `true` quando o micro-tabuleiro já foi finalizado (venceu ou empatou). */
export function isFinalizedBoard(state: GameState, board: number): boolean {
  return isBoardResolved(state, board);
}

/** `true` enquanto o micro-tabuleiro está aberto e é o ativo no turno. */
export function isActiveQuadrant(state: GameState, board: number): boolean {
  if (state.status !== 'in_progress') return false;
  if (state.activeBoard === null) return false;
  if (board !== state.activeBoard) return false;
  return !isBoardResolved(state, board);
}

const GLYPH_BY_STATUS: Record<MicroStatus, string> = {
  active: '',
  wonX: 'X',
  wonO: 'O',
  tied: 'D',
};

export function glyphForStatus(status: MicroStatus): string {
  return GLYPH_BY_STATUS[status];
}

export function winnerLabel(winner: Player | null): string {
  if (winner === 1) return 'X';
  if (winner === 2) return 'O';
  return 'D';
}

/** Borda pulsante do quadrante ativo (1,2 Hz). */
export function ActiveBorder({ board }: { readonly board: number }) {
  return <div className="ttt-highlight ttt-highlight--active-border" data-board={board} data-testid="active-border" />;
}

/** Ghost do destino do oponente: contorno fantasma no quadrante que será focado. */
export function GhostHighlight({ board }: { readonly board: number }) {
  return <div className="ttt-highlight ttt-highlight--ghost" data-board={board} data-testid="ghost-highlight" />;
}

/** Overlay de quadrante finalizado: 30% opacidade + blur + glifo gigante. */
export function FinalOverlay({ board, status }: { readonly board: number; readonly status: MicroStatus }) {
  return (
    <div
      className="ttt-highlight ttt-highlight--final"
      data-board={board}
      data-testid="final-overlay"
      style={{ opacity: 0.3, pointerEvents: 'none' }}
    >
      <span className="ttt-highlight__glyph">{glyphForStatus(status)}</span>
    </div>
  );
}
