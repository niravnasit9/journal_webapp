import React, { useState } from 'react';
import { Button } from './Button';
import { getStartOfDay } from '@/lib/dateUtils';

export type DateRangePreset = 'all' | 'today' | '7days' | '30days' | 'thisMonth';

export interface DateRange {
  preset: DateRangePreset;
  start: Date | null;
  end: Date | null;
}

interface DateRangePickerProps {
  value: DateRangePreset;
  onChange: (range: DateRange) => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const presets: { id: DateRangePreset; label: string }[] = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: '7days', label: 'Last 7 Days' },
    { id: '30days', label: 'Last 30 Days' },
    { id: 'thisMonth', label: 'This Month' },
  ];

  const handleSelect = (presetId: DateRangePreset) => {
    const today = getStartOfDay();
    let start: Date | null = null;
    let end: Date | null = new Date(); // now

    switch (presetId) {
      case 'today':
        start = today;
        break;
      case '7days':
        start = new Date(today);
        start.setDate(today.getDate() - 7);
        break;
      case '30days':
        start = new Date(today);
        start.setDate(today.getDate() - 30);
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'all':
      default:
        start = null;
        end = null;
        break;
    }

    onChange({ preset: presetId, start, end });
    setIsOpen(false);
  };

  const selectedLabel = presets.find(p => p.id === value)?.label || 'All Time';

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 px-4 h-11 bg-surface/80 backdrop-blur-md border border-default rounded-xl text-sm font-bold text-primary hover:bg-elevated hover:shadow-md transition-all duration-300 min-w-[160px] group"
      >
        <div className="flex items-center gap-2">
          <i className="las la-calendar text-lg text-primary/70 group-hover:text-primary transition-colors"></i>
          {selectedLabel}
        </div>
        <i className={`las la-angle-down text-primary/70 group-hover:text-primary transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full mt-2 left-0 w-48 bg-surface/90 backdrop-blur-xl border border-default rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200">
            {presets.map(preset => (
              <button
                key={preset.id}
                onClick={() => handleSelect(preset.id)}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-all duration-200 min-h-[44px] flex items-center justify-between ${
                  value === preset.id 
                    ? 'bg-primary/10 text-primary font-bold pl-5' 
                    : 'text-secondary hover:bg-elevated hover:text-primary hover:pl-5'
                }`}
              >
                {preset.label}
                {value === preset.id && <i className="las la-check text-primary"></i>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
