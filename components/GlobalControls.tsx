import React from 'react';
import type { GlobalSettings } from '../types';
import { Knob } from './Knob';

interface GlobalControlsProps {
  settings: GlobalSettings;
  onUpdate: <K extends keyof GlobalSettings>(key: K, value: GlobalSettings[K]) => void;
}

export const GlobalControls: React.FC<GlobalControlsProps> = ({ settings, onUpdate }) => {
  return (
    <div>
        <div>
            <h3 className="text-lg font-bold text-white mb-4 text-center">MASTER</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 justify-items-center mb-4">
                <Knob
                    label="Duration"
                    value={settings.masterDuration}
                    min={0.1} max={5}
                    onChange={v => onUpdate('masterDuration', v)}
                    unit="s"
                />
                 <Knob
                    label="Volume"
                    value={settings.masterVolume}
                    min={0} max={1}
                    onChange={v => onUpdate('masterVolume', v)}
                />
                <Knob
                    label="HPF"
                    value={settings.hpfFreq}
                    min={20} max={10000}
                    onChange={v => onUpdate('hpfFreq', v)}
                    unit="Hz"
                    logarithmic
                />
                 <Knob
                    label="LPF"
                    value={settings.lpfFreq}
                    min={100} max={20000}
                    onChange={v => onUpdate('lpfFreq', v)}
                    unit="Hz"
                    logarithmic
                />
            </div>
            <h4 className="text-md font-semibold text-white mb-3 text-center">REVERB</h4>
            <div className="grid grid-cols-3 gap-4 justify-items-center">
                 <Knob
                    label="Mix"
                    value={settings.reverbMix}
                    min={0} max={1}
                    onChange={v => onUpdate('reverbMix', v)}
                />
                <Knob
                    label="Time"
                    value={settings.reverbTime}
                    min={0.5} max={4}
                    onChange={v => onUpdate('reverbTime', v)}
                    unit="s"
                />
                <Knob
                    label="Decay"
                    value={settings.reverbDecay}
                    min={1} max={5}
                    onChange={v => onUpdate('reverbDecay', v)}
                />
            </div>
        </div>
    </div>
  );
};
