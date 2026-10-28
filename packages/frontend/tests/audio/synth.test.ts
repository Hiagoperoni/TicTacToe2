import { describe, expect, it } from 'vitest';
import { createSynth } from '../../src/audio/synth';

describe('Synth (SPEC-003 A6)', () => {
  it('play não lança com contexto indisponível (jsdom) e resume resolve', async () => {
    const synth = createSynth({ createContext: () => null });
    expect(() => synth.play('impact')).not.toThrow();
    expect(() => synth.play('select')).not.toThrow();
    expect(() => synth.play('quadrantWin')).not.toThrow();
    expect(() => synth.play('alert')).not.toThrow();
    expect(() => synth.play('gameOverWin')).not.toThrow();
    expect(() => synth.play('gameOverLose')).not.toThrow();
    await expect(synth.resume()).resolves.toBeUndefined();
  });
});
