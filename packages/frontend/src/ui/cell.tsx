/**
 * Célula do sub-tabuleiro (SPEC-003 A2): glifo X/O, pré-seleção (50% alfa) e overlay
 * de quadrante finalizado (glifo gigante + `pointer-events: none`).
 */

import { microStatus, type GameState, type MicroStatus } from '@ttt/shared/domain';

export interface CellProps {
  readonly board: number;
  readonly cell: number;
  readonly state: GameState;
  readonly selected: boolean;
  readonly ghost: boolean;
  readonly finalized: boolean;
  readonly disabled: boolean;
  readonly onPress: (move: { readonly board: number; readonly cell: number }) => void;
}

const GLYPH_FOR_CELL = (state: GameState, board: number, cell: number): string => {
  const bit = 1 << cell;
  if ((state.x[board] & bit) !== 0) return 'X';
  if ((state.o[board] & bit) !== 0) return 'O';
  return '';
};

export function Cell({
  board,
  cell,
  state,
  selected,
  ghost,
  finalized,
  disabled,
  onPress,
}: CellProps) {
  const status: MicroStatus = microStatus(state, board);
  const glyph = GLYPH_FOR_CELL(state, board, cell);

  const className = [
    'ttt-cell',
    `ttt-cell--${status}`,
    selected ? 'ttt-cell--selected' : '',
    ghost ? 'ttt-cell--ghost' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={className}
      data-board={board}
      data-cell={cell}
      data-status={status}
      data-selected={selected ? 'true' : 'false'}
      disabled={disabled || finalized}
      aria-label={`Quadrante ${board}, sub-célula ${cell}`}
      onClick={() => onPress({ board, cell })}
      style={finalized ? { pointerEvents: 'none' } : undefined}
    >
      {finalized ? (
        <span className="ttt-cell__final-glyph">{status === 'wonX' ? 'X' : status === 'wonO' ? 'O' : 'D'}</span>
      ) : (
        <span className="ttt-cell__glyph">{glyph}</span>
      )}
    </button>
  );
}
