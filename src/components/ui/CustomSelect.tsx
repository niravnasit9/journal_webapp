"use client";

import { useState, useRef, useEffect } from "react";

export interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  icon?: string;
}

export default function CustomSelect({ options, value, onChange, className = "", icon }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {icon && <i className={`${icon} text-[16px] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 z-10 pointer-events-none`}></i>}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[44px] bg-[#fafafa] dark:bg-[#0a0f1c] border border-gray-200 dark:border-slate-800 rounded-lg ${icon ? 'pl-9' : 'pl-4'} pr-8 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 hover:border-gray-300 dark:hover:border-slate-700 text-sm transition-all cursor-pointer flex justify-between items-center`}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <i className={`las la-angle-down text-[12px] absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
      </div>

      {isOpen && (
        <div className="absolute z-[9999] mt-1 w-full bg-white dark:bg-[#111318] border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto custom-scrollbar">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`px-4 py-3 min-h-[44px] flex items-center text-sm cursor-pointer transition-colors ${
                value === option.value 
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-bold' 
                  : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-[#1a1d24]'
              }`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
