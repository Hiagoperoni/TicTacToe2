/**
 * Tabuleiro 9x9 em duas visualizações (SPEC-003 A2): visão geral (9 quadrantes) e
 * sub-grade focada (auto-zoom). Renderiza 81 células a partir de `GameState`.
 */

import { useEffect, useState } from 'react';
import { isLegalMove, microStatus, type GameState, type MicroStatus } from '@ttt/shared/domain';
import { confirmSelection, initialSelection, type SelectionState } from './interaction/two-step';
import { ghostBoardOf } from './highlights';
import { Quadrant, type QuadrantVariant } from './quadrant';

export interface BoardProps {
  readonly state: GameState;
  /** Confirma o lance pré-selecionado (dois toques) e delega ao motor/hook. */
  readonly onPlay: (move: { readonly board: number; readonly cell: number }) => void;
  /** Dispara o Smart Auto-Zoom para o quadrante tocado. */
  readonly onZoom: (board: number) => void;
  readonly onInvalidMove?: (move: { readonly board: number; readonly cell: number }) => void;
}

export function Board({ state, onPlay, onZoom, onInvalidMove }: BoardProps) {
  const [selection, setSelection] = useState<SelectionState>(() => initialSelection());
  const [zoomedBoard, setZoomedBoard] = useState<number | null>(null);

  useEffect(() => {
    setZoomedBoard(null);
  }, [state]);

  const handlePress = (move: { board: number; cell: number }) => {
    const legal = isLegalMove(state, { board: move.board, cell: move.cell });
    if (!legal) {
      onInvalidMove?.(move);
      return;
    }
    const result = confirmSelection(selection, { board: move.board, cell: move.cell });
    setSelection(result.selection);
    if (result.moveToPlay) {
      onPlay(result.moveToPlay);
    }
    if (move.board === state.activeBoard) {
      setZoomedBoard(move.board);
      onZoom(move.board);
    }
  };

  if (zoomedBoard !== null) {
    const status: MicroStatus = microStatus(state, zoomedBoard);
    return (
      <div className="ttt-board ttt-board--focused" data-board={zoomedBoard}>
        <Quadrant
          board={zoomedBoard}
          variant="focused"
          state={state}
          isActive={status === 'active' && zoomedBoard === state.activeBoard}
          ghost={ghostBoardOf(
            selection.phase === 'pending' ? selection.move : null,
          ) === zoomedBoard}
          selectedCell={selection.phase === 'pending' && selection.move.board === zoomedBoard ? selection.move.cell : null}
          onCellPress={handlePress}
        />
      </div>
    );
  }

  return (
    <div className="ttt-board" data-mode="overview">
      <div className="ttt-board__grid">
        {Array.from({ length: 9 }, (_, index) => {
          const board = index;
          const status: MicroStatus = microStatus(state, board);
          const finalized = status !== 'active';
          const isActive = !finalized && state.activeBoard === board;
          const ghost = ghostBoardOf(selection.phase === 'pending' ? selection.move : null) === board;
          const selectedCell = selection.phase === 'pending' && selection.move.board === board ? selection.move.cell : null;
          const variant: QuadrantVariant = 'overview';
          return (
            <Quadrant
              key={board}
              board={board}
              variant={variant}
              state={state}
              isActive={isActive}
              ghost={ghost}
              selectedCell={selectedCell}
              onCellPress={handlePress}
            />
          );
        })}
      </div>
    </div>
  );
}
