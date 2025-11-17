
import React from 'react';
import type { LayerSettings, SourceType, NoiseType } from '../types';
import { Knob } from './Knob';

interface LayerStripProps {
  layer: LayerSettings;
  onUpdate: <K extends keyof LayerSettings>(id: number, key: K, value: LayerSettings[K]) => void;
  masterDuration: number;
}

const colors = ['border-blue-500', 'border-green-500', 'border-purple-500'];

export const LayerStrip: React.FC<LayerStripProps> = ({ layer, onUpdate, masterDuration }) => {
  const { id, enabled, name, sourceType, noiseType, envelope, pitch, pan, volume } = layer;
  const colorClass = colors[(id-1) % colors.length];

  // FIX: Replace the problematic generic function with a more specific and type-safe version.
  // The original function's generics were too loose, causing incorrect type inference.
  const handleSubUpdate = <
    O extends 'envelope' | 'pitch' | 'pan',
    K extends keyof LayerSettings[O]
  >(
    objKey: O,
    subKey: K,
    value: LayerSettings[O][K]
  ) => {
    const currentObject = layer[objKey];
    onUpdate(id, objKey, { ...currentObject, [subKey]: value });
  };
  
  return (
    <div className={`bg-gray-800 rounded-lg p-4 border-l-4 ${enabled ? colorClass : 'border-gray-700'} flex flex-col gap-4 transition-all duration-200 ${!enabled && 'opacity-50'}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <label htmlFor={`enable-${id}`} className="flex items-center cursor-pointer">
                    <div className="relative">
                        <input id={`enable-${id}`} type="checkbox" className="sr-only" checked={enabled} onChange={e => onUpdate(id, 'enabled', e.target.checked)} />
                        <div className={`block w-10 h-6 rounded-full ${enabled ? 'bg-accent' : 'bg-gray-600'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${enabled ? 'translate-x-4' : ''}`}></div>
                    </div>
                </label>
                <h3 className="text-lg font-bold text-white">{name}</h3>
            </div>
            <div className="flex gap-2">
                 <select value={sourceType} onChange={e => onUpdate(id, 'sourceType', e.target.value as SourceType)} className="bg-gray-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent">
                    <optgroup label="Noise">
                        <option value="noise">Noise</option>
                    </optgroup>
                    <optgroup label="Synth">
                        <option value="sine">Sine</option>
                        <option value="square">Square</option>
                        <option value="sawtooth">Sawtooth</option>
                        <option value="triangle">Triangle</option>
                    </optgroup>
                 </select>
                 {sourceType === 'noise' && (
                     <select value={noiseType} onChange={e => onUpdate(id, 'noiseType', e.target.value as NoiseType)} className="bg-gray-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent">
                         <option value="white">White</option>
                         <option value="pink">Pink</option>
                         <option value="brown">Brown</option>
                     </select>
                 )}
            </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 p-2 rounded-lg flex flex-col items-center">
                <span className="text-xs font-bold text-gray-400 mb-2">ENVELOPE</span>
                <div className="flex justify-around w-full">
                    <Knob label="Attack" value={envelope.attack} min={0.01} max={1} onChange={v => handleSubUpdate('envelope', 'attack', v)} unit="s" />
                    <Knob label="Hold" value={envelope.hold} min={0} max={1} onChange={v => handleSubUpdate('envelope', 'hold', v)} unit="s" />
                    <Knob label="Decay" value={envelope.decay} min={0.01} max={1} onChange={v => handleSubUpdate('envelope', 'decay', v)} unit="s" />
                </div>
            </div>
            <div className="bg-gray-900 p-2 rounded-lg flex flex-col items-center">
                 <span className="text-xs font-bold text-gray-400 mb-2">PITCH</span>
                 <div className="flex justify-around w-full">
                    <Knob label="Start" value={pitch.start} min={20} max={20000} onChange={v => handleSubUpdate('pitch', 'start', v)} unit="Hz" logarithmic={true} />
                    <Knob label="End" value={pitch.end} min={20} max={20000} onChange={v => handleSubUpdate('pitch', 'end', v)} unit="Hz" logarithmic={true} />
                </div>
            </div>
             <div className="bg-gray-900 p-2 rounded-lg flex flex-col items-center">
                 <span className="text-xs font-bold text-gray-400 mb-2">PAN</span>
                 <div className="flex justify-around w-full">
                    <Knob label="Start" value={pan.start} min={-1} max={1} onChange={v => handleSubUpdate('pan', 'start', v)} unit="L/R" />
                    <Knob label="End" value={pan.end} min={-1} max={1} onChange={v => handleSubUpdate('pan', 'end', v)} unit="L/R" />
                </div>
            </div>
             <div className="bg-gray-900 p-2 rounded-lg flex flex-col items-center">
                 <span className="text-xs font-bold text-gray-400 mb-2">VOLUME</span>
                 <div className="flex justify-around w-full">
                    <Knob label="Volume" value={volume} min={0} max={1} onChange={v => onUpdate(id, 'volume', v)} />
                </div>
            </div>
        </div>
    </div>
  );
};