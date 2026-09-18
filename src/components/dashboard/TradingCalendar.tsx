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

  return (
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

          return (
            <div 
              key={dateKey} 
              className={`min-h-[80px] p-2 rounded-xl border flex flex-col justify-between transition-colors ${bgColor}`}
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
  );
}
