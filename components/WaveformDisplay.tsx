import React, { useRef, useEffect } from 'react';
import type { WhooshSettings } from '../types';

interface WaveformDisplayProps {
  settings: WhooshSettings;
  isPlaying: boolean;
  playbackProgress: number;
}

const layerColors = ['#3B82F6', '#22C55E', '#A855F7']; // blue-500, green-500, purple-500

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({ settings, isPlaying, playbackProgress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const { layers, global } = settings;
    const duration = global.masterDuration;
    const numPoints = Math.floor(width * 2); 
    const compositeSamplePoints = new Array(numPoints).fill(0);
    const layerSamplePoints: number[][] = layers.map(() => new Array(numPoints).fill(0));

    const layerPhases: { [key: number]: number } = {};

    layers.forEach((layer, layerIndex) => {
      if (!layer.enabled) return;

      layerPhases[layer.id] = 0;
      const { attack, hold, decay } = layer.envelope;
      const layerVolume = layer.volume;
      const { start: startFreq, end: endFreq } = layer.pitch;

      for (let i = 0; i < numPoints; i++) {
        const time = (i / numPoints) * duration;
        let envelope = 0;

        const attackTime = attack * duration;
        const holdTime = hold * duration;
        const decayTime = decay * duration;
        
        if (time <= attackTime) {
          envelope = time / attackTime;
        } else if (time <= attackTime + holdTime) {
          envelope = 1;
        } else if (time <= attackTime + holdTime + decayTime) {
          envelope = 1 - (time - (attackTime + holdTime)) / decayTime;
        }
        
        envelope = Math.max(0, Math.min(1, envelope));
        
        let carrier = 0;
        if (layer.sourceType === 'noise') {
            carrier = Math.random() * 2 - 1;
        } else {
            const progress = time / duration;
            const currentFreq = startFreq * Math.pow(endFreq / startFreq, progress);
            const phaseIncrement = (2 * Math.PI * currentFreq) / (numPoints / duration);
            layerPhases[layer.id] += phaseIncrement;
            const phase = layerPhases[layer.id];

            switch (layer.sourceType) {
                case 'sine': carrier = Math.sin(phase); break;
                case 'square': carrier = Math.sin(phase) >= 0 ? 1 : -1; break;
                case 'sawtooth': carrier = 2 * (phase / (2 * Math.PI) % 1) - 1; break;
                case 'triangle': {
                  const x = phase / (2 * Math.PI);
                  carrier = 1 - 4 * Math.abs(Math.round(x - 0.25) - (x - 0.25));
                  break;
                }
            }
        }
        const sampleValue = carrier * envelope * layerVolume;
        layerSamplePoints[layerIndex][i] = sampleValue;
        compositeSamplePoints[i] += sampleValue;
      }
    });

    let maxAmplitude = Math.max(...compositeSamplePoints.map(p => Math.abs(p)), 1);
    const halfHeight = height / 2;

    // --- Drawing ---

    // 1. Draw individual layer waveforms
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.6;
    layers.forEach((layer, index) => {
      if (!layer.enabled) return;
      
      ctx.strokeStyle = layerColors[index % layerColors.length];
      ctx.beginPath();
      ctx.moveTo(0, halfHeight);
      for (let i = 0; i < numPoints; i++) {
        const x = (i / numPoints) * width;
        const y = halfHeight - (layerSamplePoints[index][i] / maxAmplitude) * halfHeight * 0.9;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    ctx.globalAlpha = 1.0;

    // 2. Draw composite waveform on top
    ctx.strokeStyle = '#1DB954';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, halfHeight);

    for (let i = 0; i < numPoints; i++) {
        const x = (i / numPoints) * width;
        const y = halfHeight - (compositeSamplePoints[i] / maxAmplitude) * halfHeight * 0.9;
        ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 3. Draw gradient fill for composite waveform
    ctx.lineTo(width, halfHeight);
    ctx.lineTo(0, halfHeight);
    ctx.closePath(); 
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(29, 185, 84, 0.7)');
    gradient.addColorStop(0.5, 'rgba(29, 185, 84, 0.2)');
    gradient.addColorStop(1, 'rgba(29, 185, 84, 0.7)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // 4. Draw playback indicator
    if (isPlaying && playbackProgress > 0) {
      const x = playbackProgress * width;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

  }, [settings, isPlaying, playbackProgress]);

  return (
    <div className="p-2 h-full">
      <canvas ref={canvasRef} className="w-full h-full"></canvas>
    </div>
  );
};
