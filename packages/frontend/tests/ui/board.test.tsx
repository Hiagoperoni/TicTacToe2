// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { applyMove, createInitialState, stateFromBoards } from '@ttt/shared/domain';
import { Board } from '../../src/ui/board';

afterEach(cleanup);

const initialState = () => createInitialState();

describe('Board (SPEC-003 A2)', () => {
  it('renderiza 81 células a partir do GameState', () => {
    const { container } = render(<Board state={initialState()} onPlay={() => {}} onZoom={() => {}} />);
    expect(container.querySelectorAll('.ttt-cell')).toHaveLength(81);
  });

  it('renderiza a jogada na célula (X em board 4, cell 6 — marca SVG procedural)', () => {
    const state = applyMove(initialState(), { board: 4, cell: 6 });
    render(<Board state={state} onPlay={() => {}} onZoom={() => {}} />);
    const cell = document.querySelector('[data-board="4"][data-cell="6"]') as HTMLElement;
    expect(cell.querySelector('svg[data-mark="X"]')).toBeTruthy();
  });

  it('quadrante finalizado: overlay de glifo gigante + pointer-events none', () => {
    const state = stateFromBoards({
      x: [7, 0, 0, 0, 0, 0, 0, 0, 0],
      o: new Array<number>(9).fill(0),
      activeBoard: null,
      player: 1,
      moveCount: 0,
    });
    render(<Board state={state} onPlay={() => {}} onZoom={() => {}} />);
    expect(screen.getByTestId('final-overlay')).toBeTruthy();
    const cell = document.querySelector('[data-board="0"][data-cell="0"]') as HTMLButtonElement;
    expect(cell.disabled).toBe(true);
    expect(cell.style.pointerEvents).toBe('none');
  });
});
