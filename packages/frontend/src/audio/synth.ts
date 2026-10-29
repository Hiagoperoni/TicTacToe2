/**
 * Sintetizador procedural 100% via Web Audio API (SPEC-003 R3.5, base05 §2.2):
 * OscillatorNode → BiquadFilterNode → GainNode (ADS) → destino. Zero arquivos de mídia.
 */

import { SOUND_RECIPES, type SoundEvent, type SoundRecipe } from './recipes';

export interface SynthController {
  readonly resume: () => Promise<void>;
  readonly play: (event: SoundEvent) => void;
}

export interface SynthOptions {
  readonly createContext?: () => AudioContext | null;
}

const ATTACK = 0.001;
const DECAY = 0.04;
const RELEASE = 0.01;

function createContextOrNull(factory: () => AudioContext | null): AudioContext | null {
  const context = factory();
  if (context === null) return null;
  void context.resume();
  return context;
}

function playRecipe(context: AudioContext, recipe: SoundRecipe): void {
  const destination = context.destination;
  const master = context.createGain();
  master.gain.value = 0.8;
  master.connect(destination);

  for (const tone of recipe.tones) {
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    oscillator.type = tone.type;
    oscillator.frequency.setValueAtTime(tone.fromHz, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, tone.toHz), context.currentTime + DECAY);
    filter.type = tone.filter.type;
    filter.frequency.value = tone.filter.frequency;
    filter.Q.value = tone.filter.Q;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.8, context.currentTime + ATTACK);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + DECAY + RELEASE);
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + DECAY + RELEASE + 0.05);
  }
}

export function createSynth(options: SynthOptions = {}): SynthController {
  const createContext = options.createContext ?? (() => globalAudioContext());

  let contextCache: AudioContext | null = null;

  const resolveContext = (): AudioContext | null => {
    if (contextCache === null) {
      contextCache = createContextOrNull(createContext);
    }
    return contextCache;
  };

  const play = (event: SoundEvent): void => {
    const context = resolveContext();
    if (context === null) return;
    playRecipe(context, SOUND_RECIPES[event]);
  };

  return {
    play,
    resume: async () => {
      const context = resolveContext();
      if (context !== null) {
        await context.resume();
      }
    },
  };
}

function globalAudioContext(): AudioContext | null {
  const scope = globalThis as unknown as { readonly AudioContext?: AudioContext };
  return scope.AudioContext ?? null;
}
