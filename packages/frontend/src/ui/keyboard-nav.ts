/**
 * Navegação por setas no grid 9x9 (a11y SPEC-003): move o foco entre células
 * vizinhas na malha visual 9×9 (Tab segue percorrendo tudo). Só apresentação —
 * nenhuma regra de jogo aqui.
 */

import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

const DELTA_BY_KEY: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
};

/** Converte (quadrante, célula) em coordenada visual (linha, coluna) em 0..8. */
function toVisualCell(board: number, cell: number): readonly [number, number] {
  return [Math.floor(board / 3) * 3 + Math.floor(cell / 3), (board % 3) * 3 + (cell % 3)];
}

/** Converte (linha, coluna) visuais de volta em (quadrante, célula). */
function toBoardCell(row: number, col: number): readonly [number, number] {
  return [Math.floor(row / 3) * 3 + Math.floor(col / 3), (row % 3) * 3 + (col % 3)];
}

/**
 * Manipulador de `keydown` para o container do grid: setas levam o foco à
 * célula vizinha; retorna `true` quando a tecla foi consumida.
 */
export function handleGridKeyDown(event: ReactKeyboardEvent<HTMLElement>): boolean {
  const delta = DELTA_BY_KEY[event.key];
  if (delta === undefined) return false;
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return false;
  const board = active.dataset['board'];
  const cell = active.dataset['cell'];
  if (board === undefined || cell === undefined) return false;

  const [row, col] = toVisualCell(Number(board), Number(cell));
  const nextRow = row + delta[0];
  const nextCol = col + delta[1];
  if (nextRow < 0 || nextRow > 8 || nextCol < 0 || nextCol > 8) return true;

  const [nextBoard, nextCell] = toBoardCell(nextRow, nextCol);
  const neighbor = document.querySelector<HTMLElement>(
    `[data-board="${nextBoard}"][data-cell="${nextCell}"]`,
  );
  if (neighbor === null || (neighbor instanceof HTMLButtonElement && neighbor.disabled)) return true;
  neighbor.focus();
  return true;
}
