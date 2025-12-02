
export type NoiseType = 'white' | 'pink' | 'brown';
export type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';
export type SourceType = 'noise' | OscillatorType;

export interface EnvelopeSettings {
  attack: number;
  hold: number;
  decay: number;
}

export interface PitchSettings {
  start: number;
  end: number;
}

export interface PanSettings {
  start: number;
  end: number;
}

export interface LayerSettings {
  id: number;
  enabled: boolean;
  name: string;
  sourceType: SourceType;
  noiseType: NoiseType;
  envelope: EnvelopeSettings;
  pitch: PitchSettings;
  pan: PanSettings;
  volume: number;
}

export interface GlobalSettings {
  masterDuration: number;
  masterVolume: number;
  hpfFreq: number;
  lpfFreq: number;
  reverbMix: number;
  reverbTime: number;
  reverbDecay: number;
}

export interface WhooshSettings {
  layers: LayerSettings[];
  global: GlobalSettings;
}

export interface Preset {
  name: string;
  settings: WhooshSettings;
}
