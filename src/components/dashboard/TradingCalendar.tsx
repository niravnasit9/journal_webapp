"use client";

import { useState, useMemo } from "react";
import { TradeDoc } from "@/lib/firebase/schema";
import { 
  format, addMonths, subMonths, 
  startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, 
  isSameDay, isToday
} from "date-fns";

interface TradingCalendarProps {
  trades: TradeDoc[];
  isDomestic: boolean;
}

export default function TradingCalendar({ trades, isDomestic }: TradingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Compute stats per day for the entire dataset
  const dailyStats = useMemo(() => {
    const stats: Record<string, { grossPnl: number; netPnl: number; count: number; wins: number; losses: number }> = {};
    
    trades.forEach(trade => {
      const tradeDate = new Date(trade.close_time);
      if (isNaN(tradeDate.getTime())) return;
      
      const dateKey = format(tradeDate, 'yyyy-MM-dd');
      const netPnl = isDomestic ? (trade as any).net_pnl || 0 : trade.profit_loss || 0;
      const grossPnl = trade.profit_loss || 0;
      
      if (!stats[dateKey]) {
        stats[dateKey] = { grossPnl: 0, netPnl: 0, count: 0, wins: 0, losses: 0 };
      }
      
      stats[dateKey].grossPnl += grossPnl;
      stats[dateKey].netPnl += netPnl;
      stats[dateKey].count += (trade as any).trades_count || 1;
      // Evaluate win/loss based on gross PnL
      if (grossPnl > 0) stats[dateKey].wins += 1;
      else if (grossPnl < 0) stats[dateKey].losses += 1;
    });
    
    return stats;
  }, [trades, isDomestic]);

  // Generate calendar grid
  const daysInGrid = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const currencySymbol = isDomestic ? "₹" : "$";
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat(isDomestic ? 'en-IN' : 'en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(val));
  };

  // Compute selected day details
  const selectedDayDetails = useMemo(() => {
    if (!selectedDate) return null;
    const tradesOnDay = trades.filter(t => {
      const d = new Date(t.close_time);
      return !isNaN(d.getTime()) && isSameDay(d, selectedDate);
    });

    if (tradesOnDay.length === 0) return null;

    let grossPnl = 0;
    let netPnl = 0;
    let brokerage = 0;
    let stt = 0;
    let gst = 0;
    let totalTaxes = 0;

    tradesOnDay.forEach(t => {
      grossPnl += t.profit_loss || 0;
      if (isDomestic) {
        netPnl += (t as any).net_pnl || 0;
        const taxes = (t as any).tax_breakdown || {};
        brokerage += taxes.brokerage || 0;
        stt += taxes.stt || 0;
        gst += taxes.gst || 0;
        totalTaxes += (t as any).total_taxes || 0;
      } else {
        netPnl += t.profit_loss || 0;
      }
    });

    return {
      tradeCount: tradesOnDay.length,
      grossPnl,
      netPnl,
      brokerage,
      stt,
      gst,
      totalTaxes,
    };
  }, [selectedDate, trades, isDomestic]);

  return (
    <div className="space-y-6">
      <div className="premium-card p-6 shadow-sm border-default">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <i className="las la-calendar-alt text-2xl text-blue-500"></i>
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-lg bg-elevated border border-default flex items-center justify-center text-secondary hover:text-primary transition-colors"
          >
            <i className="las la-angle-left"></i>
          </button>
          <button 
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-lg bg-elevated border border-default flex items-center justify-center text-secondary hover:text-primary transition-colors"
          >
            <i className="las la-angle-right"></i>
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="border border-default rounded-xl bg-surface shadow-sm mb-2">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-default bg-elevated/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center py-3 text-[10px] font-bold text-muted uppercase tracking-widest border-r border-default last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
        {daysInGrid.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const stat = dailyStats[dateKey];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);
          
          const primaryPnl = isDomestic ? stat?.netPnl : stat?.grossPnl;
          
          let bgColor = "bg-surface";
          let textColor = "text-secondary";
          
          if (stat && stat.count > 0 && primaryPnl !== undefined) {
            if (primaryPnl > 0) {
              bgColor = "bg-emerald-50 dark:bg-emerald-500/10";
              textColor = "text-emerald-500 dark:text-emerald-400";
            } else if (primaryPnl < 0) {
              bgColor = "bg-rose-50 dark:bg-rose-500/10";
              textColor = "text-rose-500 dark:text-rose-400";
            } else {
              bgColor = "bg-blue-50 dark:bg-blue-500/10";
              textColor = "text-blue-500 dark:text-blue-400";
            }
          } else if (!isCurrentMonth) {
            bgColor = "bg-background/20";
          } else {
            bgColor = "bg-surface";
          }

          let ringClass = "";
          if (selectedDate && isSameDay(day, selectedDate)) {
            ringClass = "ring-1 ring-inset ring-primary/10 shadow-inner";
          }

          return (
            <div 
              key={dateKey} 
              onClick={() => setSelectedDate(day)}
              className={`group min-h-[100px] md:min-h-[140px] p-3 border-r border-b border-default flex flex-col relative transition-all duration-200 cursor-pointer ${bgColor} ${ringClass} ${day.getDay() === 6 ? 'border-r-0' : ''}`}
            >
              {/* Day Number Header & Trade Count */}
              <div className="flex justify-between items-start">
                <div className={`flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full text-sm font-semibold ${isTodayDate ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : !isCurrentMonth && !stat ? 'text-muted/30' : 'text-secondary'}`}>
                  {format(day, 'd')}
                </div>
                {/* Trade Count Dot */}
                {stat && stat.count > 0 && (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-surface border border-default text-[10px] font-bold text-muted shadow-sm">
                    {stat.count}
                  </span>
                )}
              </div>
              
              {/* Centered PnL */}
              {stat && stat.count > 0 && primaryPnl !== undefined && (
                <div className="flex-1 flex items-center justify-center pt-2 pb-1">
                  <span className={`text-[15px] md:text-[17px] font-bold tracking-tight text-center ${textColor}`}>
                    {primaryPnl >= 0 ? '+' : '-'}{currencySymbol}{formatMoney(primaryPnl)}
                  </span>
                </div>
              )}
              
              {/* Detailed Hover Tooltip */}
              {stat && stat.count > 0 && primaryPnl !== undefined && (
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-elevated border border-default shadow-2xl rounded-xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none hidden md:block">
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-elevated border-b border-r border-default rotate-45"></div>
                  <p className="text-xs font-bold text-primary mb-2 border-b border-default pb-2">{format(day, 'MMM do, yyyy')}</p>
                  <div className="space-y-1.5 text-xs relative z-10">
                    <div className="flex justify-between">
                      <span className="text-muted">Trades</span>
                      <span className="font-bold text-primary">{stat.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Win / Loss</span>
                      <span className="font-bold text-primary">{stat.wins}W / {stat.losses}L</span>
                    </div>
                    {isDomestic && (
                      <div className="flex justify-between">
                        <span className="text-muted">Gross P&L</span>
                        <span className={`font-bold ${stat.grossPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {stat.grossPnl >= 0 ? '+' : '-'}{currencySymbol}{formatMoney(stat.grossPnl)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-black pt-2 border-t border-default mt-2">
                      <span className="text-primary">{isDomestic ? 'Net P&L' : 'Total P&L'}</span>
                      <span className={primaryPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                        {primaryPnl >= 0 ? '+' : '-'}{currencySymbol}{formatMoney(primaryPnl)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
      </div>

      {/* Detailed Breakdown for Selected Date */}
      {selectedDate && selectedDayDetails && (
        <div className="premium-card p-6 shadow-sm border-default animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-6 border-b border-default pb-4">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <i className="las la-clipboard-list text-xl text-blue-500"></i>
              Daily Summary: {format(selectedDate, 'MMM do, yyyy')}
            </h3>
            <button onClick={() => setSelectedDate(null)} className="text-muted hover:text-primary transition-colors">
              <i className="las la-times text-xl"></i>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-elevated p-4 rounded-xl border border-default">
              <p className="text-xs text-muted uppercase font-bold tracking-widest mb-1">Total Trades</p>
              <p className="text-xl font-black text-primary">{selectedDayDetails.tradeCount}</p>
            </div>
            <div className="bg-elevated p-4 rounded-xl border border-default">
              <p className="text-xs text-muted uppercase font-bold tracking-widest mb-1">Gross P&L</p>
              <p className={`text-xl font-black ${selectedDayDetails.grossPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {selectedDayDetails.grossPnl >= 0 ? '+' : '-'}{currencySymbol}{formatMoney(selectedDayDetails.grossPnl)}
              </p>
            </div>
            {isDomestic && (
              <div className="bg-rose-500/5 p-4 rounded-xl border border-rose-500/20">
                <p className="text-xs text-rose-400 uppercase font-bold tracking-widest mb-1">Total Taxes</p>
                <p className="text-xl font-black text-rose-400">
                  {currencySymbol}{formatMoney(selectedDayDetails.totalTaxes)}
                </p>
              </div>
            )}
            <div className={`p-4 rounded-xl border ${selectedDayDetails.netPnl >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
              <p className={`text-xs uppercase font-bold tracking-widest mb-1 ${selectedDayDetails.netPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>Net P&L</p>
              <p className={`text-xl font-black ${selectedDayDetails.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {selectedDayDetails.netPnl >= 0 ? '+' : '-'}{currencySymbol}{formatMoney(selectedDayDetails.netPnl)}
              </p>
            </div>
          </div>

          {/* Tax Breakdown for Domestic */}
          {isDomestic && (
            <div className="bg-background/50 rounded-xl p-4 border border-default">
              <h4 className="text-xs font-bold text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                <i className="las la-receipt text-base"></i> Tax Breakdown
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[10px] text-muted uppercase font-bold">Brokerage</p>
                  <p className="text-sm font-bold text-primary">{currencySymbol}{formatMoney(selectedDayDetails.brokerage)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted uppercase font-bold">STT</p>
                  <p className="text-sm font-bold text-primary">{currencySymbol}{formatMoney(selectedDayDetails.stt)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted uppercase font-bold">GST</p>
                  <p className="text-sm font-bold text-primary">{currencySymbol}{formatMoney(selectedDayDetails.gst)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
