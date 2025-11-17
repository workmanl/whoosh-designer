
import React, { useRef, useCallback, useState, useEffect } from 'react';

interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
  logarithmic?: boolean;
}

const mapToLog = (value: number, min: number, max: number): number => {
    return min * Math.pow(max / min, value);
};

const mapFromLog = (value: number, min: number, max: number): number => {
    return Math.log(value / min) / Math.log(max / min);
};


export const Knob: React.FC<KnobProps> = ({ label, value, min, max, step = 0.01, onChange, unit = '', logarithmic = false }) => {
  const knobRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  const getNormalizedValue = useCallback(() => {
    if (logarithmic) {
        return mapFromLog(value, min, max);
    }
    return (value - min) / (max - min);
  }, [value, min, max, logarithmic]);

  const rotation = getNormalizedValue() * 270 - 135;

  const handleInteraction = useCallback((e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const startY = clientY;
      const startValue = value;

      const onMove = (moveEvent: MouseEvent | TouchEvent) => {
        const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
        const deltaY = startY - currentY;
        const range = max - min;
        
        let newValue;
        if (logarithmic) {
            const currentNormalized = mapFromLog(startValue, min, max);
            const newNormalized = Math.max(0, Math.min(1, currentNormalized + deltaY * 0.005));
            newValue = mapToLog(newNormalized, min, max);
        } else {
            newValue = startValue + (deltaY / 150) * range;
        }

        newValue = Math.max(min, Math.min(max, newValue));
        
        // Snap to step
        const steppedValue = Math.round(newValue / step) * step;
        
        onChange(steppedValue);
        setDisplayValue(steppedValue);
      };

      const onEnd = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
        setIsDragging(false);
      };
      
      setIsDragging(true);
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onEnd);
      document.addEventListener('touchmove', onMove);
      document.addEventListener('touchend', onEnd);
  }, [value, min, max, step, onChange, logarithmic]);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);
  
  const formatValue = (val: number) => {
      if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
      if (val < 1 && val > 0) return val.toFixed(2);
      if (val < 10) return val.toFixed(1);
      return Math.round(val);
  }

  return (
    <div className="flex flex-col items-center justify-center w-20 text-center select-none">
      <div 
        className="relative w-14 h-14 cursor-pointer"
        onMouseDown={e => handleInteraction(e.nativeEvent)}
        onTouchStart={e => handleInteraction(e.nativeEvent)}
      >
        <svg ref={knobRef} viewBox="0 0 50 50" className="w-full h-full">
          <circle cx="25" cy="25" r="20" strokeWidth="3" className="stroke-gray-700" fill="none" />
          <path
            d="M 25 5 A 20 20 0 1 1 5.36 17.5"
            strokeWidth="3"
            className="stroke-accent"
            fill="none"
            strokeDasharray={`${getNormalizedValue() * 20 * 2 * Math.PI * 0.75}, 1000`}
          />
          <g transform={`rotate(${rotation}, 25, 25)`}>
            <line x1="25" y1="5" x2="25" y2="15" strokeWidth="3" className="stroke-gray-500 rounded-full" />
          </g>
        </svg>
      </div>
      <div className="mt-1">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
        <p className="text-sm font-mono text-white">{`${formatValue(displayValue)}${unit}`}</p>
      </div>
    </div>
  );
};
