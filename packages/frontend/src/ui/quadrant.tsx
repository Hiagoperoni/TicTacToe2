/**
 * Quadrante (micro-tabuleiro 3x3) dentro do macro-tabuleiro (SPEC-003 A2).
 * `overview`: grade compacta das 9 sub-células; `focused`: grade ampliada
 * (auto-zoom). `isDestination` marca o destino tático do preview no hover.
 */

import { microStatus, type GameState, type MicroStatus } from '@ttt/shared/domain';
import { FinalOverlay } from './highlights';
import { Cell } from './cell';

export type QuadrantVariant = 'overview' | 'focused';

export interface QuadrantProps {
  readonly board: number;
  readonly variant: QuadrantVariant;
  readonly state: GameState;
  readonly isActive: boolean;
  readonly isDestination?: boolean;
  /** Onda visual de confirmação (aqui entrou a última marca). */
  readonly isWave?: boolean;
  readonly ghost: boolean;
  readonly selectedCell: number | null;
  readonly onCellPress: (move: { readonly board: number; readonly cell: number }) => void;
  readonly onCellHover?: (move: { readonly board: number; readonly cell: number } | null) => void;
}

export function Quadrant({
  board,
  variant,
  state,
  isActive,
  isDestination = false,
  isWave = false,
  ghost,
  selectedCell,
  onCellPress,
  onCellHover,
}: QuadrantProps) {
  const status: MicroStatus = microStatus(state, board);
  const finalized = status !== 'active';

  const className = [
    'ttt-quadrant',
    `ttt-quadrant--${variant}`,
    isActive ? 'ttt-quadrant--active' : '',
    isDestination ? 'ttt-quadrant--destination' : '',
    isWave ? 'ttt-quadrant--wave' : '',
    finalized ? 'ttt-quadrant--finalized' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const cells = [];
  for (let cell = 0; cell < 9; cell += 1) {
    cells.push(
      <Cell
        key={cell}
        board={board}
        cell={cell}
        state={state}
        selected={!finalized && selectedCell === cell}
        ghost={!finalized && ghost && selectedCell === cell}
        finalized={finalized}
        disabled={finalized}
        onPress={onCellPress}
        onHover={onCellHover}
      />,
    );
  }

  return (
    <section className={className} data-board={board} data-status={status} data-active={isActive ? 'true' : 'false'}>
      {finalized ? <FinalOverlay board={board} status={status} /> : null}
      <div className="ttt-quadrant__grid">{cells}</div>
    </section>
  );
}
