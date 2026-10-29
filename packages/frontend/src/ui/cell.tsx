/**
 * Célula do sub-tabuleiro (SPEC-003 A2): marca X/O em SVG procedural,
 * pré-seleção (marca de caneta fantasma a 50% alfa + anel âmbar) e estado
 * finalizado (marcas translúcidas sob o carimbo macro, `pointer-events: none`).
 */

import { microStatus, type GameState, type MicroStatus } from '@ttt/shared/domain';
import { Mark, type MarkId } from './marks';

export interface CellProps {
  readonly board: number;
  readonly cell: number;
  readonly state: GameState;
  readonly selected: boolean;
  readonly ghost: boolean;
  readonly finalized: boolean;
  readonly disabled: boolean;
  readonly onPress: (move: { readonly board: number; readonly cell: number }) => void;
  readonly onHover?: (move: { readonly board: number; readonly cell: number } | null) => void;
}

const GLYPH_FOR_CELL = (state: GameState, board: number, cell: number): MarkId | null => {
  const bit = 1 << cell;
  if ((state.x[board] & bit) !== 0) return 'X';
  if ((state.o[board] & bit) !== 0) return 'O';
  return null;
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
  onHover,
}: CellProps) {
  const status: MicroStatus = microStatus(state, board);
  const glyph = GLYPH_FOR_CELL(state, board, cell);
  const playerMark: MarkId = state.player === 1 ? 'X' : 'O';

  const className = [
    'ttt-cell',
    `ttt-cell--${status}`,
    selected ? 'ttt-cell--selected' : '',
    ghost ? 'ttt-cell--ghost' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const label =
    `Quadrante ${board}, sub-célula ${cell}` +
    (glyph !== null ? `, marca ${glyph}` : '') +
    (finalized ? ', quadrante finalizado' : selected ? ', pré-selecionada' : '');

  return (
    <button
      type="button"
      className={className}
      data-board={board}
      data-cell={cell}
      data-status={status}
      data-selected={selected ? 'true' : 'false'}
      disabled={disabled || finalized}
      aria-label={label}
      onClick={() => onPress({ board, cell })}
      onMouseEnter={onHover === undefined ? undefined : () => onHover({ board, cell })}
      onMouseLeave={onHover === undefined ? undefined : () => onHover(null)}
      onFocus={onHover === undefined ? undefined : () => onHover({ board, cell })}
      onBlur={onHover === undefined ? undefined : () => onHover(null)}
      style={finalized ? { pointerEvents: 'none' } : undefined}
    >
      {glyph !== null ? (
        <span className={`ttt-cell__glyph ttt-cell__glyph--${glyph.toLowerCase()} ttt-cell__glyph--played`}>
          <Mark id={glyph} />
        </span>
      ) : selected ? (
        <span className={`ttt-cell__glyph ttt-cell__glyph--${playerMark.toLowerCase()} ttt-cell__glyph--ghost`}>
          <Mark id={playerMark} />
        </span>
      ) : (
        <span className="ttt-cell__glyph" aria-hidden="true" />
      )}
    </button>
  );
}
