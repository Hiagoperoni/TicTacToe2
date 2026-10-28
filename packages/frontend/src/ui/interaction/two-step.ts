/**
 * Máquina de dois passos (SPEC-003 R3.2, base05 §1.1): toque 1 pré-seleciona a célula
 * (marca temporária 50% alfa + ghost), toque 2 na mesma célula confirma o lance.
 */

import type { Move } from '@ttt/shared/domain';

export type SelectionState = { readonly phase: 'idle' } | { readonly phase: 'pending'; readonly move: Move };

export function initialSelection(): SelectionState {
  return { phase: 'idle' };
}

/** Pré-seleciona uma célula (idempotente: retarget se já houver seleção pendente). */
export function beginSelection(current: SelectionState, move: Move): SelectionState {
  if (current.phase === 'pending') return { phase: 'pending', move };
  return { phase: 'pending', move };
}

export interface SelectionResult {
  readonly selection: SelectionState;
  /** Lance a ser jogado; `null` enquanto a seleção não está confirmada. */
  readonly moveToPlay: Move | null;
}

/** Confirma a seleção: 1º toque pré-seleciona; 2º toque na mesma célula aplica o lance. */
export function confirmSelection(current: SelectionState, move: Move): SelectionResult {
  if (current.phase !== 'pending') {
    return { selection: { phase: 'pending', move }, moveToPlay: null };
  }
  const confirmed = current.move.board === move.board && current.move.cell === move.cell;
  return {
    selection: { phase: 'idle' },
    moveToPlay: confirmed ? move : null,
  };
}
