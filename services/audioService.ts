
import type { WhooshSettings, LayerSettings } from '../types';
import { audioBufferToWav } from './wavEncoder';

let audioContext: AudioContext | null = null;
let activeSources: (AudioBufferSourceNode | OscillatorNode)[] = [];
let masterGain: GainNode | null = null;

const getAudioContext = async (): Promise<AudioContext> => {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  // Resume if suspended. This is crucial for Safari and other modern browsers.
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  return audioContext;
};

const createNoiseBuffer = (
  context: BaseAudioContext,
  type: 'white' | 'pink' | 'brown',
  duration: number
): AudioBuffer => {
  const bufferSize = context.sampleRate * duration;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const output = buffer.getChannelData(0);

  if (type === 'white') {
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  } else if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; // (roughly) compensate for gain
        b6 = white * 0.115926;
    }
  } else if (type === 'brown') {
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // (roughly) compensate for gain
    }
  }

  return buffer;
};

const createImpulseResponse = (context: BaseAudioContext, duration: number = 2, decay: number = 2) => {
    const sr = context.sampleRate;
    const impulse = context.createBuffer(2, sr * duration, sr);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    for (let i = 0; i < sr * duration; i++) {
        const n = i / (sr * duration);
        left[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
        right[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
    }
    return impulse;
};


const buildGraph = (context: BaseAudioContext, settings: WhooshSettings) => {
  stop(); // Clear any existing audio
  if (context instanceof AudioContext) {
      audioContext = context;
  }
  
  const { global, layers } = settings;
  const now = context.currentTime;
  const duration = global.masterDuration;

  masterGain = context.createGain();
  masterGain.gain.setValueAtTime(global.masterVolume, now);

  const hpf = context.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.setValueAtTime(global.hpfFreq, now);

  const lpf = context.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.setValueAtTime(global.lpfFreq, now);
  
  const reverb = context.createConvolver();
  reverb.buffer = createImpulseResponse(context, global.reverbTime, global.reverbDecay);
  const reverbWet = context.createGain();
  reverbWet.gain.setValueAtTime(global.reverbMix, now);
  const reverbDry = context.createGain();
  reverbDry.gain.setValueAtTime(1 - global.reverbMix, now);

  // FIX: Corrected the audio routing for the reverb effect.
  // The old method incorrectly chained the wet signal into the dry gain node,
  // causing volume loss or silence. The new method creates two parallel paths
  // (wet and dry) that are mixed at the final destination.
  masterGain.connect(hpf).connect(lpf);
  
  // Dry path to destination
  lpf.connect(reverbDry).connect(context.destination);

  // Wet path to destination
  lpf.connect(reverbWet).connect(reverb).connect(context.destination);


  layers.forEach((layer: LayerSettings) => {
    if (!layer.enabled) return;

    // 1. Create Source
    let source: AudioBufferSourceNode | OscillatorNode;
    if (layer.sourceType === 'noise') {
      const noiseSource = context.createBufferSource();
      noiseSource.buffer = createNoiseBuffer(context, layer.noiseType, duration);
      noiseSource.loop = true;
      source = noiseSource;
    } else {
      const osc = context.createOscillator();
      osc.type = layer.sourceType;
      source = osc;
    }

    // 2. Setup Nodes per layer
    const volumeEnvelope = context.createGain();
    const panner = context.createStereoPanner();
    const layerGain = context.createGain();

    // 3. Connect layer chain
    source.connect(volumeEnvelope).connect(panner).connect(layerGain).connect(masterGain);
    
    // 4. Schedule parameter automation
    const totalDuration = global.masterDuration;
    const { attack, hold, decay } = layer.envelope;
    const attackEndTime = now + attack * totalDuration;
    const holdEndTime = attackEndTime + hold * totalDuration;
    const decayEndTime = holdEndTime + decay * totalDuration;
    
    // Volume Envelope
    volumeEnvelope.gain.setValueAtTime(0, now);
    volumeEnvelope.gain.linearRampToValueAtTime(1, attackEndTime);
    volumeEnvelope.gain.setValueAtTime(1, holdEndTime);
    volumeEnvelope.gain.linearRampToValueAtTime(0, Math.min(decayEndTime, now + totalDuration));

    // Pitch Sweep (only for oscillators)
    if ('frequency' in source) {
        source.frequency.setValueAtTime(layer.pitch.start, now);
        source.frequency.exponentialRampToValueAtTime(layer.pitch.end, now + totalDuration);
    }

    // Pan Sweep
    panner.pan.setValueAtTime(layer.pan.start, now);
    panner.pan.linearRampToValueAtTime(layer.pan.end, now + totalDuration);
    
    // Layer Volume
    layerGain.gain.setValueAtTime(layer.volume, now);

    // 5. Start and stop source
    source.start(now);
    source.stop(now + totalDuration);

    activeSources.push(source);
  });
};

export const play = async (settings: WhooshSettings): Promise<void> => {
  const context = await getAudioContext();
  buildGraph(context, settings);
};

export const stop = (): void => {
  if (audioContext) {
    activeSources.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Ignore errors if source is already stopped
      }
    });
    activeSources = [];
    if (masterGain) {
        masterGain.disconnect();
        masterGain = null;
    }
  }
};

export const render = async (settings: WhooshSettings): Promise<Blob> => {
    stop();
    const offlineContext = new OfflineAudioContext({
        numberOfChannels: 2,
        length: settings.global.masterDuration * 48000,
        sampleRate: 48000,
    });
    buildGraph(offlineContext, settings);
    const renderedBuffer = await offlineContext.startRendering();
    return audioBufferToWav(renderedBuffer);
};
