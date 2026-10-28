import { describe, expect, it } from 'vitest';
import { GameStatePayloadSchema } from '@ttt/shared/contracts';
import {
  applyMove,
  applyMoves,
  createInitialState,
  deadlockWinner,
  isLegalMove,
  legalMoveCount,
  legalMoves,
  microStatus,
  stateFromBoards,
  stateKey,
  winnerOf,
  type GameState,
  type Move,
} from '../../src/domain';

const line = (cells: number[]): number => cells.reduce((m, c) => m | (1 << c), 0);

function emptyState(): GameState {
  return createInitialState();
}

describe('regras: estado inicial e jogadas legais', () => {
  it('cria tabuleiro vazio com jogada livre e 81 jogadas legais', () => {
    const state = emptyState();
    expect(state.player).toBe(1);
    expect(state.activeBoard).toBeNull();
    expect(state.moveCount).toBe(0);
    expect(state.status).toBe('in_progress');
    expect(legalMoveCount(state)).toBe(81);
    expect(legalMoves(state)).toHaveLength(81);
    expect(isLegalMove(state, { board: 5, cell: 7 })).toBe(true);
  });

  it('redireciona para o micro-tabuleiro da célula jogada e alterna o jogador', () => {
    const after = applyMove(emptyState(), { board: 4, cell: 6 });
    expect(after.x[4]).toBe(1 << 6);
    expect(after.activeBoard).toBe(6);
    expect(after.player).toBe(2);
    expect(after.moveCount).toBe(1);
    expect(legalMoveCount(after)).toBe(9);

    const reply = applyMove(after, { board: 6, cell: 0 });
    expect(reply.o[6]).toBe(1);
    expect(reply.activeBoard).toBe(0);
    expect(reply.player).toBe(1);
  });

  it('rejeita jogada fora do micro-tabuleiro ativo', () => {
    const state = applyMove(emptyState(), { board: 4, cell: 6 });
    expect(isLegalMove(state, { board: 0, cell: 0 })).toBe(false);
    expect(() => applyMove(state, { board: 0, cell: 0 })).toThrow(/ilegal/);
  });

  it('rejeita célula ocupada e índices inválidos', () => {
    const state = applyMove(emptyState(), { board: 4, cell: 6 });
    const taken = applyMove(state, { board: 6, cell: 6 });
    expect(isLegalMove(taken, { board: 6, cell: 6 })).toBe(false);
    expect(isLegalMove(state, { board: 6, cell: 9 })).toBe(false);
    expect(isLegalMove(state, { board: 9, cell: 0 })).toBe(false);
    expect(isLegalMove(state, { board: -1, cell: 0 })).toBe(false);
  });

  it('não muta o estado de origem', () => {
    const state = emptyState();
    const before = stateKey(state);
    const after = applyMove(state, { board: 0, cell: 0 });
    expect(stateKey(state)).toBe(before);
    expect(state.x[0]).toBe(0);
    expect(state.moveCount).toBe(0);
    expect(after).not.toBe(state);
    expect(after.x).not.toBe(state.x);

    after.x[0] = 0x1ff; // clone raso não deve vazar para o original
    expect(state.x[0]).toBe(0);
  });
});

describe('regras: micro-tabuleiro encerrado e free move', () => {
  it('concede jogada livre quando o alvo já está vencido', () => {
    const state = stateFromBoards({
      x: [line([0])],
      o: [0, 0, 0, line([0, 1, 2])],
      activeBoard: 0,
      player: 2,
    });
    expect(microStatus(state, 3)).toBe('wonO');

    const after = applyMove(state, { board: 0, cell: 3 });
    expect(after.activeBoard).toBeNull();
    expect(after.macroO & (1 << 3)).toBe(1 << 3);
    // Jogada livre cobre só micro-tabuleiros abertos: board0 com 7 livres + 7 boards × 9.
    expect(legalMoveCount(after)).toBe(70);
  });

  it('nunca aceita jogada em sub-grid encerrado', () => {
    const state = stateFromBoards({
      x: [line([0, 1, 2])],
      o: [],
      activeBoard: null,
      player: 2,
    });
    expect(isLegalMove(state, { board: 0, cell: 3 })).toBe(false);
    expect(() => applyMove(state, { board: 0, cell: 3 })).toThrow(/ilegal/);
  });

  it('fecha o micro-tabuleiro ao completar trinca local', () => {
    const state = stateFromBoards({
      x: [line([0, 1])],
      o: [],
      activeBoard: 0,
      player: 1,
    });
    const after = applyMove(state, { board: 0, cell: 2 });
    expect(microStatus(after, 0)).toBe('wonX');
    expect(after.macroX & 1).toBe(1);
    expect(after.status).toBe('in_progress');
  });

  it('marca empate local como quadrante neutro', () => {
    // X: 0,2,3,7  O: 1,4,5,6  -> resta a célula 8 (empate, sem trinca)
    const state = stateFromBoards({
      x: [line([0, 2, 3, 7])],
      o: [line([1, 4, 5, 6])],
      activeBoard: 0,
      player: 1,
    });
    const after = applyMove(state, { board: 0, cell: 8 });
    expect(microStatus(after, 0)).toBe('tied');
    expect(after.macroTied & 1).toBe(1);
    expect(after.macroX & 1).toBe(0);
    expect(after.macroO & 1).toBe(0);
  });
});

describe('regras: vitória macro e deadlock', () => {
  it('encerra a partida quando X alinha três micro-tabuleiros', () => {
    const state = stateFromBoards({
      x: [line([0, 1, 2]), line([0, 1, 2]), line([0, 1])],
      o: [],
      activeBoard: 2,
      player: 1,
    });
    const after = applyMove(state, { board: 2, cell: 2 });
    expect(after.status).toBe('wonX');
    expect(winnerOf(after)).toBe(1);
    expect(after.activeBoard).toBeNull();
    expect(legalMoveCount(after)).toBe(0);
  });

  it('desempata deadlock por número de quadrantes', () => {
    // X: 0,1,3 e O: 2,6 ; empatados: 4,5,8 ; board 7 é a última jogada.
    const win = line([0, 1, 2]);
    const drewX = line([0, 1, 5, 6]); // 4 células, sem trinca
    const drewO = line([2, 3, 4, 7, 8]); // 5 células, sem trinca

    const state = stateFromBoards({
      x: [win, win, 0, win, drewX, drewX, 0, line([0, 1]), drewX],
      o: [0, 0, win, 0, drewO, drewO, win, line([3, 4, 6, 8]), drewO],
      activeBoard: 7,
      player: 1,
    });
    expect(state.status).toBe('in_progress');
    expect(state.macroTied).toBe((1 << 4) | (1 << 5) | (1 << 8));

    const after = applyMove(state, { board: 7, cell: 2 });
    expect(after.status).toBe('wonX');
    expect(winnerOf(after)).toBe(1);
    expect(after.activeBoard).toBeNull();
    expect(deadlockWinner(after)).toBe(1);
  });

  it('desempata por células quando quadrantes empatam', () => {
    const win = line([0, 1, 2]);
    const six = line([0, 1, 2, 3, 4, 5]);
    const drewX = line([0, 1, 5, 6]);
    const drewO = line([2, 3, 4, 7, 8]);

    const state = stateFromBoards({
      x: [six, six, 0, six, drewX, drewX, 0, 0, drewX],
      o: [0, 0, win, 0, drewO, drewO, win, win, drewO],
      activeBoard: null,
      player: 1,
    });
    // 3x3 quadrantes; X = 18 + 12 = 30 células, O = 9 + 15 = 24.
    expect(state.macroX).toBe((1 << 0) | (1 << 1) | (1 << 3));
    expect(state.macroO).toBe((1 << 2) | (1 << 6) | (1 << 7));
    expect(deadlockWinner(state)).toBe(1);
  });

  it('usa vantagem de pretas (Jogador 2) no empate total', () => {
    const five = line([0, 1, 2, 3, 4]);
    const four = line([0, 1, 2, 3]);
    const drewX = line([0, 1, 5, 6]);
    const drewO = line([2, 3, 4, 7, 8]);

    const state = stateFromBoards({
      x: [five, five, 0, five, drewX, drewX, 0, 0, drewX],
      o: [0, 0, four, 0, drewO, drewO, four, four, drewO],
      activeBoard: null,
      player: 1,
    });
    // X = 15 + 12 = 27 células; O = 12 + 15 = 27; quadrantes 3x3 -> O vence.
    expect(deadlockWinner(state)).toBe(2);
    expect(state.status).toBe('wonO');
    expect(winnerOf(state)).toBe(2);
  });
});

describe('regras: consistência auxiliar', () => {
  it('legalMoves e legalMoveAt concordam com legalMoveCount', () => {
    const state = applyMove(emptyState(), { board: 0, cell: 4 });
    expect(legalMoves(state)).toHaveLength(legalMoveCount(state));
    expect(legalMoves(state)).toEqual(
      Array.from({ length: legalMoveCount(state) }, (_, k) => legalMoves(state)[k]),
    );
  });

  it('stateKey descreve a posição e é estável', () => {
    const state = applyMoves(emptyState(), [
      { board: 4, cell: 4 },
      { board: 4, cell: 0 },
    ] as Move[]);
    expect(stateKey(state)).toBe(stateKey(state));
    expect(stateKey(state)).toContain('o...x....');
    expect(stateKey(state)).toMatch(/ 0 1$/);
  });
});

describe('regras: endurecimento de stateFromBoards (SPEC-004 B2)', () => {
  const baseLine = line([0, 1, 2]);

  it('activeBoard apontando para sub-grid vencido por X rejeita', () => {
    expect(() =>
      stateFromBoards({ x: [baseLine], o: [], activeBoard: 0 }),
    ).toThrow(RangeError);
  });

  it('activeBoard apontando para sub-grid empatado rejeita', () => {
    // X: 0,2,3,7,8  O: 1,4,5,6 -> board 0 fica tied (todas as 9 células ocupadas, sem trinca)
    expect(() =>
      stateFromBoards({
        x: [line([0, 2, 3, 7, 8])],
        o: [line([1, 4, 5, 6])],
        activeBoard: 0,
      }),
    ).toThrow(/resolvido/);
  });

  it('activeBoard fora de 0..8 rejeita', () => {
    expect(() => stateFromBoards({ x: [], o: [], activeBoard: 9 })).toThrow(/0\.\.8/);
    expect(() => stateFromBoards({ x: [], o: [], activeBoard: -1 })).toThrow(/0\.\.8/);
  });

  it('activeBoard null ou válido com sub-grid ativo passa', () => {
    const free = stateFromBoards({ x: [baseLine], o: [], activeBoard: null });
    expect(free.activeBoard).toBeNull();
    const ok = stateFromBoards({ x: [baseLine], o: [], activeBoard: 3 });
    expect(ok.activeBoard).toBe(3);
  });

  it('máscara acima de 9 bits é rejeitada no decode de rede (teto 511)', () => {
    // O truncamento silencioso em stateFromBoards é comportamento de fixture;
    // a fronteira de rede (GameStatePayloadSchema) é quem rejeita.
    expect(() =>
      GameStatePayloadSchema.parse({
        x: [512, 0, 0, 0, 0, 0, 0, 0, 0],
        o: [],
        activeBoard: null,
        player: 1,
        moveCount: 0,
      }),
    ).toThrow();
  });
});
