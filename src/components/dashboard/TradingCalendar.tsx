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
    const stats: Record<string, { pnl: number; count: number; wins: number; losses: number }> = {};
    
    trades.forEach(trade => {
      const tradeDate = new Date(trade.close_time);
      if (isNaN(tradeDate.getTime())) return;
      
      const dateKey = format(tradeDate, 'yyyy-MM-dd');
      const pnl = isDomestic ? (trade as any).net_pnl || 0 : trade.profit_loss || 0;
      
      if (!stats[dateKey]) {
        stats[dateKey] = { pnl: 0, count: 0, wins: 0, losses: 0 };
      }
      
      stats[dateKey].pnl += pnl;
      stats[dateKey].count += 1;
      if (pnl > 0) stats[dateKey].wins += 1;
      else if (pnl < 0) stats[dateKey].losses += 1;
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

      {/* Days of Week */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-[10px] font-bold text-muted uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {daysInGrid.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const stat = dailyStats[dateKey];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);
          
          let bgColor = "bg-elevated border-default";
          let textColor = "text-secondary";
          
          if (stat && stat.count > 0) {
            if (stat.pnl > 0) {
              bgColor = "bg-emerald-500/10 border-emerald-500/30";
              textColor = "text-emerald-400";
            } else if (stat.pnl < 0) {
              bgColor = "bg-rose-500/10 border-rose-500/30";
              textColor = "text-rose-400";
            } else {
              bgColor = "bg-blue-500/10 border-blue-500/30";
              textColor = "text-blue-400";
            }
          } else if (!isCurrentMonth) {
            bgColor = "bg-background/50 border-transparent opacity-50";
          }

          if (isTodayDate) {
            bgColor += " ring-2 ring-primary ring-offset-2 ring-offset-base";
          }

          if (selectedDate && isSameDay(day, selectedDate)) {
            bgColor += " ring-2 ring-blue-500 ring-offset-2 ring-offset-base";
          }

          return (
            <div 
              key={dateKey} 
              onClick={() => setSelectedDate(day)}
              className={`min-h-[80px] p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer hover:border-primary ${bgColor}`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-xs font-bold ${!isCurrentMonth && !stat ? 'text-muted' : 'text-primary'}`}>
                  {format(day, 'd')}
                </span>
                {stat && stat.count > 0 && (
                  <span className="text-[9px] font-medium bg-background/50 px-1.5 py-0.5 rounded text-muted">
                    {stat.count} {stat.count === 1 ? 'trade' : 'trades'}
                  </span>
                )}
              </div>
              
              {stat && stat.count > 0 && (
                <div className="mt-2 text-right">
                  <span className={`text-sm font-black tracking-tight block ${textColor}`}>
                    {stat.pnl >= 0 ? '+' : '-'}{currencySymbol}{formatMoney(stat.pnl)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
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
