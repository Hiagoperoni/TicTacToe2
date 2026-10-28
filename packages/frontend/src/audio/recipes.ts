/**
 * Receitas de sons sintéticos da base05 §2.2 (TIC-8 / SPEC-003 R3.5): impacto,
 * seleção, conquista de quadrante, alerta e game over. Sem arquivos de mídia.
 */

export type SoundEvent = 'impact' | 'select' | 'quadrantWin' | 'alert' | 'gameOverWin' | 'gameOverLose';

export interface SoundTone {
  readonly type: OscillatorType;
  readonly fromHz: number;
  readonly toHz: number;
  readonly filter: { readonly type: BiquadFilterType; readonly frequency: number; readonly Q: number };
}

export interface SoundRecipe {
  readonly tones: readonly SoundTone[];
}

export const SOUND_RECIPES: Readonly<Record<SoundEvent, SoundRecipe>> = {
  impact: {
    tones: [
      { type: 'triangle', fromHz: 180, toHz: 60, filter: { type: 'lowpass', frequency: 800, Q: 1 } },
    ],
  },
  select: {
    tones: [
      { type: 'square', fromHz: 1200, toHz: 400, filter: { type: 'bandpass', frequency: 2500, Q: 3 } },
    ],
  },
  quadrantWin: {
    tones: [
      { type: 'sine', fromHz: 261.63, toHz: 523.25, filter: { type: 'lowpass', frequency: 4000, Q: 0.5 } },
    ],
  },
  alert: {
    tones: [
      { type: 'square', fromHz: 880, toHz: 880, filter: { type: 'lowpass', frequency: 2000, Q: 0.8 } },
    ],
  },
  gameOverWin: {
    tones: [
      { type: 'sine', fromHz: 392, toHz: 783.99, filter: { type: 'lowpass', frequency: 4000, Q: 0.5 } },
    ],
  },
  gameOverLose: {
    tones: [
      { type: 'sawtooth', fromHz: 220, toHz: 110, filter: { type: 'lowpass', frequency: 1500, Q: 1 } },
    ],
  },
};
