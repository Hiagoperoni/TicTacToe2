/**
 * Tabuleiro 9x9 em duas visualizações (SPEC-003 A2): visão geral (9 quadrantes)
 * e sub-grade focada (Smart Auto-Zoom R3.1 com transição FLIP — a sub-grade
 * cresce a partir do quadrante tocado). Preview tático do destino (hover/seta
 * → quadrante ou "jogada livre"), navegação por setas e onda de confirmação.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
  isBoardResolved,
  isLegalMove,
  microStatus,
  type GameState,
  type MicroStatus,
  type Move,
} from '@ttt/shared/domain';
import { confirmSelection, initialSelection, type SelectionState } from './interaction/two-step';
import { ghostBoardOf } from './highlights';
import { handleGridKeyDown } from './keyboard-nav';
import { Quadrant, type QuadrantVariant } from './quadrant';

export interface BoardProps {
  readonly state: GameState;
  /** Confirma o lance pré-selecionado (dois toques) e delega ao motor/hook. */
  readonly onPlay: (move: Move) => void;
  /** Dispara o Smart Auto-Zoom para o quadrante tocado. */
  readonly onZoom: (board: number) => void;
  readonly onInvalidMove?: (move: Move) => void;
  /** Última jogada do snapshot: onda visual no quadrante que recebeu a marca. */
  readonly lastMove?: Move | null;
}

const FOCUSED_HINT = { pending: '2º toque confirma a marca', idle: 'toque 2× para marcar' } as const;
const ZOOM_DURATION_MS = 260;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function Board({ state, onPlay, onZoom, onInvalidMove, lastMove }: BoardProps) {
  const [selection, setSelection] = useState<SelectionState>(() => initialSelection());
  const [zoomedBoard, setZoomedBoard] = useState<number | null>(null);
  const [hovered, setHovered] = useState<Move | null>(null);
  const focusedRef = useRef<HTMLDivElement | null>(null);
  const zoomFromRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    setZoomedBoard(null);
    setHovered(null);
  }, [state]);

  // FLIP do auto-zoom: a sub-grade parte do retângulo do quadrante tocado.
  useLayoutEffect(() => {
    if (zoomedBoard === null) return;
    const node = focusedRef.current;
    const from = zoomFromRef.current;
    zoomFromRef.current = null;
    if (node === null || from === null || from.width === 0 || prefersReducedMotion()) return;
    const to = node.getBoundingClientRect();
    if (to.width === 0) return;
    const scale = from.width / to.width;
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    node.style.transition = 'none';
    node.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    node.getBoundingClientRect();
    node.style.transition = `transform ${ZOOM_DURATION_MS}ms var(--ease-out)`;
    node.style.transform = 'translate(0px, 0px) scale(1)';
  }, [zoomedBoard]);

  const handleBack = () => {
    setSelection(initialSelection());
    setHovered(null);
    setZoomedBoard(null);
  };

  const handleGridKeys = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && zoomedBoard !== null) {
      handleBack();
      return;
    }
    if (handleGridKeyDown(event)) event.preventDefault();
  };

  const handlePress = (move: Move) => {
    const legal = isLegalMove(state, { board: move.board, cell: move.cell });
    if (!legal) {
      onInvalidMove?.(move);
      return;
    }
    const result = confirmSelection(selection, { board: move.board, cell: move.cell });
    setSelection(result.selection);
    if (result.moveToPlay) {
      onPlay(result.moveToPlay);
      return;
    }
    // Pré-seleção confirmada como intenção: Smart Auto-Zoom a partir do quadrante.
    const origin = document.querySelector<HTMLElement>(`.ttt-quadrant[data-board="${move.board}"]`);
    zoomFromRef.current = origin === null ? null : origin.getBoundingClientRect();
    setZoomedBoard(move.board);
    onZoom(move.board);
  };

  // Preview tático: só conta jogada legal; o destino é a célula (índice = quadrante).
  const previewMove = hovered !== null && isLegalMove(state, hovered) ? hovered : null;
  const destinationBoard = previewMove === null ? null : previewMove.cell;
  const sendsToFreeMove = destinationBoard !== null && isBoardResolved(state, destinationBoard);
  const isFreeMove = state.activeBoard === null && state.status === 'in_progress';

  if (zoomedBoard !== null) {
    const status: MicroStatus = microStatus(state, zoomedBoard);
    return (
      <div
        className="ttt-board ttt-board--focused"
        data-board={zoomedBoard}
        ref={(node) => {
          focusedRef.current = node;
        }}
        onKeyDown={handleGridKeys}
      >
        <Quadrant
          board={zoomedBoard}
          variant="focused"
          state={state}
          isActive={status === 'active' && zoomedBoard === state.activeBoard}
          ghost={ghostBoardOf(selection.phase === 'pending' ? selection.move : null) === zoomedBoard}
          selectedCell={selection.phase === 'pending' && selection.move.board === zoomedBoard ? selection.move.cell : null}
          onCellPress={handlePress}
          onCellHover={setHovered}
        />
        <div className="ttt-board__bar">
          <button type="button" className="ttt-board__back" data-testid="board-back" onClick={handleBack}>
            ◀ visão geral
          </button>
          <span className="ttt-board__hint" data-visible="true" data-testid="board-hint" role="status">
            {selection.phase === 'pending' ? FOCUSED_HINT.pending : FOCUSED_HINT.idle}
          </span>
        </div>
      </div>
    );
  }

  const hint =
    previewMove !== null
      ? sendsToFreeMove
        ? 'jogada livre — escolha qualquer quadrante'
        : `envia o oponente ao quadrante ${destinationBoard === null ? 0 : destinationBoard + 1}`
      : isFreeMove
        ? 'jogada livre — escolha um quadrante'
        : null;

  return (
    <div
      className="ttt-board"
      data-mode="overview"
      data-free-move={isFreeMove ? 'true' : 'false'}
      onKeyDown={handleGridKeys}
    >
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
              isDestination={!finalized && destinationBoard === board}
              isWave={lastMove !== undefined && lastMove !== null && lastMove.board === board}
              ghost={ghost}
              selectedCell={selectedCell}
              onCellPress={handlePress}
              onCellHover={setHovered}
            />
          );
        })}
      </div>
      <div className="ttt-board__bar">
        <span className="ttt-board__hint" data-visible={hint === null ? 'false' : 'true'} data-testid="board-hint" role="status">
          {hint ?? ''}
        </span>
      </div>
      {lastMove !== undefined && lastMove !== null ? (
        <span className="ttt-visually-hidden" data-testid="last-move">
          última jogada: quadrante {lastMove.board + 1}, célula {lastMove.cell + 1}
        </span>
      ) : null}
    </div>
  );
}
