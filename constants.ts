
import type { WhooshSettings, Preset } from './types';

export const NUM_LAYERS = 3;

export const INITIAL_LAYER_SETTINGS = {
  id: 0,
  enabled: true,
  name: "Layer",
  sourceType: 'noise' as const,
  noiseType: 'white' as const,
  envelope: { attack: 0.1, hold: 0.2, decay: 0.7 },
  pitch: { start: 440, end: 880 },
  pan: { start: -0.8, end: 0.8 },
  volume: 0.7,
};

export const INITIAL_SETTINGS: WhooshSettings = {
  layers: Array.from({ length: NUM_LAYERS }, (_, i) => ({
    ...INITIAL_LAYER_SETTINGS,
    id: i + 1,
    name: `Layer ${i + 1}`,
    enabled: i === 0, // Only first layer enabled by default
    sourceType: i === 0 ? 'noise' : 'sine',
    noiseType: (['white', 'pink', 'brown'] as const)[i % 3],
    pan: { start: -0.8 + i * 0.8, end: 0.8 - i * 0.8 }
  })),
  global: {
    masterDuration: 1.0,
    masterVolume: 0.8,
    hpfFreq: 20,
    lpfFreq: 20000,
    reverbMix: 0.3,
  },
};

export const PRESETS: Preset[] = [
  {
    name: 'Soft Air Whoosh',
    settings: {
      ...INITIAL_SETTINGS,
      layers: [
        { id: 1, enabled: true, name: 'Air', sourceType: 'noise', noiseType: 'white', envelope: { attack: 0.2, hold: 0.1, decay: 0.7 }, pitch: { start: 1000, end: 400 }, pan: { start: -0.7, end: 0.7 }, volume: 0.6 },
        { id: 2, enabled: true, name: 'Body', sourceType: 'noise', noiseType: 'pink', envelope: { attack: 0.1, hold: 0.1, decay: 0.6 }, pitch: { start: 400, end: 200 }, pan: { start: -0.5, end: 0.5 }, volume: 0.8 },
        { id: 3, enabled: false, name: 'Tone', sourceType: 'sine', noiseType: 'white', envelope: { attack: 0.05, hold: 0.2, decay: 0.5 }, pitch: { start: 300, end: 150 }, pan: { start: 0, end: 0 }, volume: 0.4 },
      ],
      global: { masterDuration: 1, masterVolume: 0.8, hpfFreq: 150, lpfFreq: 12000, reverbMix: 0.4 },
    },
  },
  {
    name: 'Fast Swish',
    settings: {
      ...INITIAL_SETTINGS,
      layers: [
        { id: 1, enabled: true, name: 'Swoosh', sourceType: 'noise', noiseType: 'white', envelope: { attack: 0.01, hold: 0.05, decay: 0.14 }, pitch: { start: 12000, end: 1000 }, pan: { start: -1, end: 1 }, volume: 0.7 },
        { id: 2, enabled: false, name: 'Layer 2', sourceType: 'noise', noiseType: 'pink', envelope: { attack: 0.1, hold: 0.2, decay: 0.7 }, pitch: { start: 440, end: 880 }, pan: { start: -0.8, end: 0.8 }, volume: 0.7 },
        { id: 3, enabled: false, name: 'Layer 3', sourceType: 'sine', noiseType: 'white', envelope: { attack: 0.1, hold: 0.2, decay: 0.7 }, pitch: { start: 440, end: 880 }, pan: { start: -0.8, end: 0.8 }, volume: 0.7 },
      ],
      global: { masterDuration: 0.2, masterVolume: 0.9, hpfFreq: 800, lpfFreq: 18000, reverbMix: 0.1 },
    },
  },
  {
    name: 'Metallic Pass-By',
    settings: {
        ...INITIAL_SETTINGS,
      layers: [
        { id: 1, enabled: true, name: 'Metal', sourceType: 'sawtooth', noiseType: 'white', envelope: { attack: 0.05, hold: 0.2, decay: 0.4 }, pitch: { start: 1200, end: 800 }, pan: { start: -1, end: 1 }, volume: 0.5 },
        { id: 2, enabled: true, name: 'Wind', sourceType: 'noise', noiseType: 'brown', envelope: { attack: 0.1, hold: 0.1, decay: 0.8 }, pitch: { start: 400, end: 300 }, pan: { start: -0.8, end: 0.8 }, volume: 0.8 },
        { id: 3, enabled: false, name: 'Layer 3', sourceType: 'sine', noiseType: 'white', envelope: { attack: 0.1, hold: 0.2, decay: 0.7 }, pitch: { start: 440, end: 880 }, pan: { start: -0.8, end: 0.8 }, volume: 0.7 },
      ],
      global: { masterDuration: 0.6, masterVolume: 0.7, hpfFreq: 250, lpfFreq: 9000, reverbMix: 0.6 },
    },
  },
    {
    name: 'Sci-Fi Sweep',
    settings: {
        ...INITIAL_SETTINGS,
      layers: [
        { id: 1, enabled: true, name: 'Rise', sourceType: 'sine', noiseType: 'white', envelope: { attack: 0.8, hold: 0.1, decay: 0.5 }, pitch: { start: 100, end: 2000 }, pan: { start: 0, end: 0 }, volume: 0.6 },
        { id: 2, enabled: true, name: 'Sparkle', sourceType: 'noise', noiseType: 'white', envelope: { attack: 0.2, hold: 0.5, decay: 1.0 }, pitch: { start: 8000, end: 16000 }, pan: { start: -1, end: 1 }, volume: 0.3 },
        { id: 3, enabled: true, name: 'Rumble', sourceType: 'square', noiseType: 'white', envelope: { attack: 1.2, hold: 0.1, decay: 0.8 }, pitch: { start: 50, end: 80 }, pan: { start: -0.2, end: 0.2 }, volume: 0.7 },
      ],
      global: { masterDuration: 2.0, masterVolume: 0.8, hpfFreq: 40, lpfFreq: 15000, reverbMix: 0.7 },
    },
  },
];
