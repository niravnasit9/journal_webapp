"use client";

import { useMemo } from "react";
import { TradeDoc } from "@/lib/firebase/schema";
import { 
  startOfDay, endOfDay, 
  startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, 
  startOfYear, endOfYear, 
  isWithinInterval 
} from "date-fns";

interface TimeBasedMetricsProps {
  trades: TradeDoc[];
  isDomestic: boolean;
}

export default function TimeBasedMetrics({ trades, isDomestic }: TimeBasedMetricsProps) {
  
  const metrics = useMemo(() => {
    const now = new Date();
    
    // Define intervals
    const today = { start: startOfDay(now), end: endOfDay(now) };
    const thisWeek = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };
    const thisYear = { start: startOfYear(now), end: endOfYear(now) };

    const result = {
      daily: 0,
      weekly: 0,
      monthly: 0,
      yearly: 0,
    };

    trades.forEach(trade => {
      // Use close_time for PnL realization
      const tradeDate = new Date(trade.close_time);
      if (isNaN(tradeDate.getTime())) return;
      
      const pnl = isDomestic ? (trade as any).net_pnl || 0 : trade.profit_loss || 0;

      if (isWithinInterval(tradeDate, today)) result.daily += pnl;
      if (isWithinInterval(tradeDate, thisWeek)) result.weekly += pnl;
      if (isWithinInterval(tradeDate, thisMonth)) result.monthly += pnl;
      if (isWithinInterval(tradeDate, thisYear)) result.yearly += pnl;
    });

    return result;
  }, [trades, isDomestic]);

  const currencySymbol = isDomestic ? "₹" : "$";
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat(isDomestic ? 'en-IN' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(val));
  };

  const MetricCard = ({ label, value, icon }: { label: string, value: number, icon: string }) => {
    const isProfit = value >= 0;
    return (
      <div className="premium-inner-box p-4">
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs text-muted uppercase font-bold tracking-widest">{label}</p>
          <div className="w-8 h-8 rounded-lg bg-elevated border border-default flex items-center justify-center text-secondary">
            <i className={`las ${icon} text-lg`}></i>
          </div>
        </div>
        <p className={`text-2xl font-black tracking-tight ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isProfit ? '+' : '-'}{currencySymbol}{formatMoney(value)}
        </p>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard label="Today" value={metrics.daily} icon="la-sun" />
      <MetricCard label="This Week" value={metrics.weekly} icon="la-calendar-week" />
      <MetricCard label="This Month" value={metrics.monthly} icon="la-calendar" />
      <MetricCard label="This Year" value={metrics.yearly} icon="la-calendar-alt" />
    </div>
  );
}
