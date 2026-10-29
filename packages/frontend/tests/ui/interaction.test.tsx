// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { applyMove, createInitialState } from '@ttt/shared/domain';
import { Board } from '../../src/ui/board';

afterEach(cleanup);

function setup() {
  const onPlay = vi.fn();
  const onZoom = vi.fn();
  const onInvalidMove = vi.fn();
  const state = applyMove(createInitialState(), { board: 4, cell: 6 });
  render(
    <Board
      state={state}
      onPlay={onPlay}
      onZoom={onZoom}
      onInvalidMove={onInvalidMove}
    />,
  );
  const cell = (board: number, cell: number) =>
    document.querySelector(`[data-board="${board}"][data-cell="${cell}"]`) as HTMLElement;
  return { onPlay, onZoom, onInvalidMove, cell };
}

describe('Board interaction (SPEC-003 A3/A2)', () => {
  it('1º toque pré-seleciona a célula (data-selected) e marca o ghost do destino', () => {
    const { cell } = setup();
    fireEvent.click(cell(6, 2));
    expect(cell(6, 2).dataset.selected).toBe('true');
    expect(cell(6, 2).className).toContain('ttt-cell--selected');
  });

  it('2º toque na mesma célula aplica a jogada (onPlay) e limpa a seleção', () => {
    const { cell, onPlay } = setup();
    fireEvent.click(cell(6, 2));
    fireEvent.click(cell(6, 2));
    expect(onPlay).toHaveBeenCalledWith({ board: 6, cell: 2 });
    expect(cell(6, 2).dataset.selected).toBe('false');
  });

  it('toque ilegal não altera estado nem aplica jogada', () => {
    const { cell, onPlay, onInvalidMove } = setup();
    fireEvent.click(cell(0, 0)); // board 0 ≠ activeBoard 6 => ilegal
    expect(onPlay).not.toHaveBeenCalled();
    expect(onInvalidMove).toHaveBeenCalled();
  });

  it('toque no quadrante ativo dispara o auto-zoom', () => {
    const { cell, onZoom } = setup();
    fireEvent.click(cell(6, 2));
    expect(onZoom).toHaveBeenCalledWith(6);
  });
});
