import { describe, expect, it, vi } from 'vitest';
import { createLocalSession, type AiPort, type AiRequest, type AiResponse } from '@ttt/shared/contracts';
import { createInitialState, legalMoveAt, type Move } from '@ttt/shared/domain';

const CENTER: Move = { board: 4, cell: 4 };

/** AiPort fake determinístico (SPEC-003 §5.1): devolve a 1ª jogada legal disponível. */
function fakeAi(iterations = 7) {
  const request = vi.fn(
    async (request: AiRequest): Promise<AiResponse> => ({
      id: request.id,
      move: legalMoveAt(request.state, 0),
      iterations,
      elapsedMs: 1,
    }),
  );
  const ai: AiPort = { request };
  return { ai, request };
}

describe('createLocalSession (SPEC-003 §5.1 / B2)', () => {
  it('snapshot inicial: estado puro, sem IA pendente', () => {
    const session = createLocalSession({ ai: fakeAi().ai });
    const snap = session.getSnapshot();
    expect(snap.mode).toBe('vs-ai');
    expect(snap.state.status).toBe('in_progress');
    expect(snap.aiPending).toBe(false);
    expect(snap.lastMove).toBeNull();
    expect(snap.turn).toBe(1);
  });

  it('jogada ilegal lança RangeError e o snapshot permanece idêntico', () => {
    const session = createLocalSession({ ai: fakeAi().ai, mode: 'local-2p' });
    session.play(CENTER); // legal: humano 1 ocupa board=4, cell=4
    const afterLegal = session.getSnapshot();
    expect(() => session.play(CENTER)).toThrow(RangeError); // humano 2 repete a célula
    expect(session.getSnapshot()).toEqual(afterLegal);
  });

  it('vs-ai: humano joga → aiPending=true → resposta da IA aplicada → turno volta ao humano', async () => {
    const { ai, request } = fakeAi();
    const session = createLocalSession({ ai });
    const listener = vi.fn();
    const off = session.subscribe(listener);
    session.play(CENTER);
    expect(session.getSnapshot().aiPending).toBe(true);
    await vi.waitFor(() => {
      expect(session.getSnapshot().aiPending).toBe(false);
    });
    const after = session.getSnapshot();
    expect(after.state.moveCount).toBe(2); // humana + IA
    expect(after.aiPending).toBe(false);
    expect(after.state.status).toBe('in_progress');
    expect(request).toHaveBeenCalledTimes(1);
    off();
  });

  it('determinismo: mesma seed + dificuldade ⇒ mesma jogada', async () => {
    const { ai } = fakeAi();
    const a = createLocalSession({ ai, seed: 42, difficulty: 'casual' });
    const b = createLocalSession({ ai, seed: 42, difficulty: 'casual' });
    a.play(CENTER);
    b.play(CENTER);
    await vi.waitFor(() => {
      expect(a.getSnapshot().aiPending).toBe(false);
    });
    await vi.waitFor(() => {
      expect(b.getSnapshot().aiPending).toBe(false);
    });
    const sa = a.getSnapshot().state;
    const sb = b.getSnapshot().state;
    expect([...sa.x]).toEqual([...sb.x]);
    expect([...sa.o]).toEqual([...sb.o]);
  });

  it('reset restaura createInitialState e lastMove null', async () => {
    const session = createLocalSession({ ai: fakeAi().ai });
    session.play(CENTER);
    await vi.waitFor(() => {
      expect(session.getSnapshot().aiPending).toBe(false);
    });
    session.reset({ difficulty: 'mestre' });
    const snap = session.getSnapshot();
    expect(snap.lastMove).toBeNull();
    expect([...snap.state.x]).toEqual([...createInitialState().x]);
    expect(snap.difficulty).toBe('mestre');
  });

  it('subscribe notifica 1x por mudança; unsubscribe encerra', () => {
    const session = createLocalSession({ ai: fakeAi().ai, mode: 'local-2p' });
    expect(session.getSnapshot().mode).toBe('local-2p');
    const listener = vi.fn();
    const off = session.subscribe(listener);
    session.play(CENTER);
    expect(listener).toHaveBeenCalledTimes(1);
    off();
    session.play({ board: 4, cell: 0 });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
