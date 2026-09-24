"use client";

import React, { useState, useRef, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO, isValid } from "date-fns";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  className?: string;
}

export default function DatePicker({ value, onChange, minDate, maxDate, placeholder = "Select Date", className = "" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse initial date or default to today
  const initialDate = value && isValid(parseISO(value)) ? parseISO(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(initialDate));
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Handle outside click to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd");
    if (minDate && dayStr < minDate) return;
    if (maxDate && dayStr > maxDate) return;
    onChange(dayStr);
    setIsOpen(false);
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={prevMonth} className="p-1 hover:bg-elevated rounded-lg text-secondary transition-colors">
          <i className="las la-angle-left text-lg"></i>
        </button>
        <span className="text-sm font-bold text-primary">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <button type="button" onClick={nextMonth} className="p-1 hover:bg-elevated rounded-lg text-secondary transition-colors">
          <i className="las la-angle-right text-lg"></i>
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-[10px] font-bold text-muted uppercase tracking-wider text-center py-1">
          {format(addDays(startDate, i), "EEEEE")}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const selectedDateObj = value && isValid(parseISO(value)) ? parseISO(value) : null;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        const dayStr = format(day, "yyyy-MM-dd");
        
        let isDisabled = false;
        if (minDate && dayStr < minDate) isDisabled = true;
        if (maxDate && dayStr > maxDate) isDisabled = true;
        
        const isSelected = selectedDateObj && isSameDay(day, selectedDateObj);
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            onClick={() => !isDisabled ? onDateClick(cloneDay) : undefined}
            className={`
              flex items-center justify-center h-8 w-8 rounded-full text-sm cursor-pointer transition-all
              ${!isCurrentMonth ? "text-muted/30" : isDisabled ? "text-muted/50 cursor-not-allowed" : "text-secondary hover:text-primary hover:bg-elevated"}
              ${isSelected ? "!bg-blue-500 !text-white font-bold shadow-lg shadow-blue-500/30" : ""}
            `}
          >
            {formattedDate}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1 place-items-center mb-1" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div 
        className="relative cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted transition-colors">
          <i className="las la-calendar-alt text-lg"></i>
        </div>
        <input 
          type="text"
          readOnly
          value={value ? format(parseISO(value), "dd MMM yyyy") : ""}
          placeholder={placeholder}
          className={`input-premium w-full pl-10 cursor-pointer ${isOpen ? "ring-1 ring-blue-500/50 border-blue-500/50 bg-elevated/50" : ""}`}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted">
          <i className={`las la-angle-down transition-transform ${isOpen ? "rotate-180" : ""}`}></i>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[9999] mt-2 p-4 bg-surface border border-default rounded-xl shadow-2xl backdrop-blur-xl w-64 origin-top-left transform transition-all">
          {renderHeader()}
          {renderDays()}
          {renderCells()}
        </div>
      )}
    </div>
  );
}
