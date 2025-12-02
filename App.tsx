
import React, { useState, useCallback, useReducer, useEffect, useRef } from 'react';
import { PlayIcon, StopIcon, DownloadIcon, ResetIcon, RandomizeIcon } from './components/icons';
import { LayerStrip } from './components/LayerStrip';
import { GlobalControls } from './components/GlobalControls';
import { WaveformDisplay } from './components/WaveformDisplay';
import { play, stop, render } from './services/audioService';
import useLocalStorage from './hooks/useLocalStorage';
// FIX: Add OscillatorType and NoiseType to imports for correct typing in reducer
import type { WhooshSettings, LayerSettings, GlobalSettings, Preset, OscillatorType, NoiseType } from './types';
import { INITIAL_SETTINGS, PRESETS } from './constants';

type Action =
  | { type: 'UPDATE_LAYER'; payload: { id: number; key: keyof LayerSettings; value: any } }
  | { type: 'UPDATE_GLOBAL'; payload: { key: keyof GlobalSettings; value: any } }
  | { type: 'LOAD_SETTINGS'; payload: WhooshSettings }
  | { type: 'RANDOMIZE' }
  | { type: 'RESET' };

const settingsReducer = (state: WhooshSettings, action: Action): WhooshSettings => {
  switch (action.type) {
    case 'UPDATE_LAYER':
      return {
        ...state,
        layers: state.layers.map(l =>
          l.id === action.payload.id ? { ...l, [action.payload.key]: action.payload.value } : l
        ),
      };
    case 'UPDATE_GLOBAL':
      return {
        ...state,
        global: { ...state.global, [action.payload.key]: action.payload.value },
      };
    case 'LOAD_SETTINGS':
      return action.payload;
    case 'RESET':
      return INITIAL_SETTINGS;
    case 'RANDOMIZE':
        return {
            global: {
                masterDuration: Math.random() * 2.9 + 0.1,
                masterVolume: Math.random() * 0.4 + 0.5,
                hpfFreq: Math.pow(10, Math.random() * 2 + 1.3), // 20Hz - 2kHz
                lpfFreq: Math.pow(10, Math.random() * 1 + 3.3), // 2kHz - 20kHz
                reverbMix: Math.random() * 0.8,
                reverbTime: Math.random() * 3.5 + 0.5, // 0.5s - 4s
                reverbDecay: Math.random() * 4 + 1, // 1 - 5
            },
            layers: state.layers.map(layer => {
                const isNoise = Math.random() > 0.4;
                // FIX: Correctly type the arrays of possible values. `keyof` was incorrect.
                const sourceTypes: OscillatorType[] = ['sine', 'square', 'sawtooth', 'triangle'];
                const noiseTypes: NoiseType[] = ['white', 'pink', 'brown'];
                const attack = Math.random() * 0.8 + 0.01;
                const hold = Math.random() * 0.5;
                const decay = Math.random() * 0.9 + 0.1;

                return {
                    ...layer,
                    enabled: Math.random() > 0.3,
                    sourceType: isNoise ? 'noise' : sourceTypes[Math.floor(Math.random() * sourceTypes.length)],
                    noiseType: noiseTypes[Math.floor(Math.random() * noiseTypes.length)],
                    envelope: { attack, hold, decay },
                    pitch: {
                        start: Math.pow(10, Math.random() * 3 + 1.3),
                        end: Math.pow(10, Math.random() * 3 + 1.3),
                    },
                    pan: {
                        start: Math.random() * 2 - 1,
                        end: Math.random() * 2 - 1,
                    },
                    volume: Math.random() * 0.6 + 0.2,
                }
            })
        };
    default:
      return state;
  }
};


function App() {
  const [storedSettings, setStoredSettings] = useLocalStorage<WhooshSettings>('whoosh-settings', INITIAL_SETTINGS);
  const [settings, dispatch] = useReducer(settingsReducer, storedSettings);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    setStoredSettings(settings);
  }, [settings, setStoredSettings]);
  
  const handleStop = useCallback(() => {
    stop();
    setIsPlaying(false);
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }
    setPlaybackProgress(0);
  }, []);

  const handlePlay = useCallback(async () => {
    if (isPlaying) {
      handleStop();
      return;
    }
    
    await play(settings);
    setIsPlaying(true);
    
    const startTime = performance.now();
    const durationMs = settings.global.masterDuration * 1000;

    const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        setPlaybackProgress(progress);

        if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(animate);
        } else {
            setIsPlaying(false);
            setPlaybackProgress(0);
        }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);

  }, [settings, isPlaying, handleStop]);

  const handleRender = useCallback(async () => {
    setIsRendering(true);
    try {
      const blob = await render(settings);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url;
      a.download = `whoosh_${timestamp}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch(error) {
        console.error("Rendering failed:", error)
    } finally {
        setIsRendering(false);
    }
  }, [settings]);
  
  // Spacebar to play/stop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
             const target = e.target as HTMLElement;
            // Prevent play/stop if user is interacting with form elements
            if (['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'].includes(target.tagName)) {
                return;
            }
            e.preventDefault();
            handlePlay();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePlay]);


  const updateLayer = useCallback(<K extends keyof LayerSettings>(id: number, key: K, value: LayerSettings[K]) => {
    dispatch({ type: 'UPDATE_LAYER', payload: { id, key, value } });
  }, []);

  const updateGlobal = useCallback(<K extends keyof GlobalSettings>(key: K, value: GlobalSettings[K]) => {
    dispatch({ type: 'UPDATE_GLOBAL', payload: { key, value } });
  }, []);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetName = e.target.value;
    if (!presetName) return;
    const preset = PRESETS.find(p => p.name === presetName);
    if (preset) {
        dispatch({ type: 'LOAD_SETTINGS', payload: preset.settings });
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-300 p-4 lg:p-8 flex flex-col gap-4">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-gray-900 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white tracking-wider">
          WHOOSH <span className="text-accent">DESIGNER</span>
        </h1>
        <div className="flex items-center gap-2 flex-wrap justify-center">
            <select onChange={handlePresetChange} className="bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent appearance-none" defaultValue="">
                <option value="">-- Presets --</option>
                {PRESETS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
            <button onClick={() => dispatch({type: 'RANDOMIZE'})} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"><RandomizeIcon className="w-5 h-5"/> Randomize</button>
            <button onClick={() => dispatch({type: 'RESET'})} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"><ResetIcon className="w-5 h-5"/> Reset</button>
        </div>
        <div className="flex items-center gap-2">
           {isPlaying ? (
                <button onClick={handleStop} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors text-lg w-32 justify-center"><StopIcon className="w-6 h-6"/> Stop</button>
           ) : (
                <button onClick={handlePlay} className="bg-accent hover:bg-accent-hover text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors text-lg w-32 justify-center"><PlayIcon className="w-6 h-6"/> Play</button>
           )}
          <button onClick={handleRender} disabled={isRendering} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
            <DownloadIcon className="w-5 h-5"/> {isRendering ? 'Rendering...' : 'Render & Download'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Layers */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {settings.layers.map(layer => (
            <LayerStrip key={layer.id} layer={layer} onUpdate={updateLayer} masterDuration={settings.global.masterDuration}/>
          ))}
        </div>

        {/* Right: Waveform + Controls */}
        <div className="flex flex-col gap-4">
          {/* Waveform - Compact */}
          <div className="bg-gray-900 rounded-lg" style={{ height: '300px' }}>
            <WaveformDisplay settings={settings} isPlaying={isPlaying} playbackProgress={playbackProgress} />
          </div>

          {/* Master and Reverb Controls */}
          <div className="bg-gray-800 rounded-lg p-4">
            <GlobalControls settings={settings.global} onUpdate={updateGlobal} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
