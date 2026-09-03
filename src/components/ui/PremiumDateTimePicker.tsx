import React, { useState, useEffect, useRef } from 'react';
import { formatTradeDate } from '@/lib/dateUtils';

interface PremiumDateTimePickerProps {
  value: Date | string | null;
  onChange: (date: Date | null) => void;
  label?: string;
  icon?: string;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export const PremiumDateTimePicker: React.FC<PremiumDateTimePickerProps> = ({ value, onChange, label, icon = "la-calendar" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Initialize selected date to provided value or current date
  const [selectedDate, setSelectedDate] = useState<Date>(
    value ? new Date(value) : new Date()
  );

  // View state for calendar (which month is being viewed)
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());

  // Time state
  const [hours, setHours] = useState(selectedDate.getHours().toString().padStart(2, '0'));
  const [minutes, setMinutes] = useState(selectedDate.getMinutes().toString().padStart(2, '0'));

  // Sync internal state if prop value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setSelectedDate(d);
      setViewMonth(d.getMonth());
      setViewYear(d.getFullYear());
      setHours(d.getHours().toString().padStart(2, '0'));
      setMinutes(d.getMinutes().toString().padStart(2, '0'));
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day, parseInt(hours), parseInt(minutes));
    setSelectedDate(newDate);
    onChange(newDate);
  };

  const handleTimeChange = (type: 'h' | 'm', val: string) => {
    let numeric = parseInt(val.replace(/\D/g, '')) || 0;
    if (type === 'h') {
      if (numeric > 23) numeric = 23;
      const str = numeric.toString().padStart(2, '0');
      setHours(str);
      const newDate = new Date(selectedDate);
      newDate.setHours(numeric);
      setSelectedDate(newDate);
      onChange(newDate);
    } else {
      if (numeric > 59) numeric = 59;
      const str = numeric.toString().padStart(2, '0');
      setMinutes(str);
      const newDate = new Date(selectedDate);
      newDate.setMinutes(numeric);
      setSelectedDate(newDate);
      onChange(newDate);
    }
  };

  // Calendar logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const displayString = value ? formatTradeDate(value) : "Select Date & Time";

  return (
    <div className="relative w-full" ref={popoverRef}>
      {label && (
        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <i className={`las ${icon} text-base`}></i> {label}
        </label>
      )}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-surface border border-default rounded-xl px-4 py-3 text-sm font-medium text-primary hover:bg-elevated hover:border-strong transition-all duration-300 shadow-sm outline-none focus:ring-2 focus:ring-primary/20 group"
      >
        <span className={value ? "text-primary font-mono tracking-tight" : "text-muted"}>
          {displayString}
        </span>
        <div className="flex items-center gap-2">
          {value && (
            <span className="flex h-2 w-2 rounded-full bg-success opacity-80 animate-pulse"></span>
          )}
          <i className={`las la-angle-down text-secondary group-hover:text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
        </div>
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-5 w-72 bg-surface/80 backdrop-blur-2xl border border-default rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] z-50 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <button type="button" onClick={handlePrevMonth} className="p-1.5 rounded-full hover:bg-elevated text-secondary hover:text-primary transition-colors focus:ring-2 focus:ring-info outline-none">
              <i className="las la-angle-left text-lg"></i>
            </button>
            <div className="font-bold text-primary tracking-tight">
              {MONTH_NAMES[viewMonth]} <span className="text-muted font-normal ml-1">{viewYear}</span>
            </div>
            <button type="button" onClick={handleNextMonth} className="p-1.5 rounded-full hover:bg-elevated text-secondary hover:text-primary transition-colors focus:ring-2 focus:ring-info outline-none">
              <i className="las la-angle-right text-lg"></i>
            </button>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-muted uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-5">
            {blanks.map(b => (
              <div key={`blank-${b}`} className="h-8 w-8"></div>
            ))}
            {days.map(d => {
              const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === viewMonth && selectedDate.getFullYear() === viewYear;
              const isToday = new Date().getDate() === d && new Date().getMonth() === viewMonth && new Date().getFullYear() === viewYear;
              
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDateSelect(d)}
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200 outline-none
                    ${isSelected 
                      ? 'bg-info text-white shadow-lg shadow-info/40 scale-110 font-bold' 
                      : 'text-primary hover:bg-elevated hover:scale-110 focus:ring-1 focus:ring-info'
                    }
                    ${!isSelected && isToday ? 'border border-info/50 text-info' : ''}
                  `}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-subtle to-transparent my-4"></div>

          {/* Time Selector */}
          <div className="flex items-center justify-between bg-elevated/40 p-3 rounded-xl border border-subtle">
            <div className="flex items-center gap-2 text-primary font-mono text-sm">
              <div className="h-7 w-7 rounded bg-surface border border-default flex items-center justify-center shadow-sm">
                <i className="las la-clock text-secondary text-sm"></i>
              </div>
              <div className="flex items-center gap-1">
                <input 
                  type="text" 
                  value={hours}
                  onChange={(e) => handleTimeChange('h', e.target.value)}
                  className="w-7 text-center bg-transparent border-b border-transparent focus:border-info outline-none transition-colors"
                  maxLength={2}
                />
                <span className="text-muted/50 animate-pulse">:</span>
                <input 
                  type="text" 
                  value={minutes}
                  onChange={(e) => handleTimeChange('m', e.target.value)}
                  className="w-7 text-center bg-transparent border-b border-transparent focus:border-info outline-none transition-colors"
                  maxLength={2}
                />
              </div>
            </div>
            
            <button type="button" onClick={() => setIsOpen(false)} className="text-xs font-bold text-info hover:text-primary transition-all bg-info/10 hover:bg-info px-4 py-2 rounded-lg shadow-sm">
              Done
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
