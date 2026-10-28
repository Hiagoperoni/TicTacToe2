// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, renderHook, act } from '@testing-library/react';
import { FakeAi } from '../../src/mocks/fake-ai';
import { useGameSession } from '../../src/session/use-game-session';

afterEach(cleanup);

function setup() {
  const ai = new FakeAi();
  const { result } = renderHook(() =>
    useGameSession({ ai, mode: 'vs-ai', difficulty: 'casual', seed: 42 }),
  );
  return { ai, result };
}

describe('useGameSession (SPEC-003 A7)', () => {
  it('snapshot inicial: humano (X) com partida em progresso', () => {
    const { result } = setup();
    expect(result.current.snapshot.state.status).toBe('in_progress');
    expect(result.current.snapshot.turn).toBe(1);
    expect(result.current.snapshot.aiPending).toBe(false);
    expect(result.current.snapshot.lastMove).toBeNull();
  });

  it('humano joga → aiPending=true → IA aplica → turno volta ao humano', async () => {
    const { result } = setup();
    act(() => {
      result.current.play({ board: 4, cell: 6 });
    });
    expect(result.current.snapshot.state.moveCount).toBe(1);
    expect(result.current.snapshot.aiPending).toBe(true);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.snapshot.aiPending).toBe(false);
    expect(result.current.snapshot.state.moveCount).toBe(2);
    expect(result.current.snapshot.state.player).toBe(1);
  });

  it('jogada ilegal não altera o snapshot (rollback) e registra erro', () => {
    const { result } = setup();
    act(() => {
      result.current.play({ board: 4, cell: 6 });
    });
    act(() => {
      result.current.play({ board: 0, cell: 0 });
    });
    expect(result.current.snapshot.state.moveCount).toBe(1);
    expect(result.current.error).not.toBeNull();
  });
});
