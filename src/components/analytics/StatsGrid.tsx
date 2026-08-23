"use client";

import React from 'react';
import { useTierAccess } from '@/hooks/useTierAccess';
import { TradeDoc } from '@/lib/firebase/schema';

interface StatsGridProps {
  trades: TradeDoc[];
  currency?: "USD" | "INR";
}

export const StatsGrid: React.FC<StatsGridProps> = ({ trades, currency = "USD" }) => {
  const { analyticsLevel } = useTierAccess();
  const isAdvanced = analyticsLevel === 'advanced';

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(val);
  };

  const calculateMetrics = () => {
    if (!trades || trades.length === 0) return null;

    let grossProfit = 0;
    let grossLoss = 0;
    let wins = 0;
    let losses = 0;
    let totalFees = 0;

    let currentWinStreak = 0;
    let maxWinStreak = 0;
    let currentLossStreak = 0;
    let maxLossStreak = 0;

    trades.forEach(t => {
      const pnl = t.profit_loss || 0;
      const fees = (t.commission || 0) + (t.swap || 0);
      totalFees += fees;

      if (pnl > 0) {
        grossProfit += pnl;
        wins++;
        currentWinStreak++;
        currentLossStreak = 0;
        if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
      } else if (pnl < 0) {
        grossLoss += Math.abs(pnl);
        losses++;
        currentLossStreak++;
        currentWinStreak = 0;
        if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
      }
    });

    const netPnl = grossProfit - grossLoss;
    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
    const avgTrade = trades.length > 0 ? netPnl / trades.length : 0;
    
    const avgWin = wins > 0 ? grossProfit / wins : 0;
    const avgLoss = losses > 0 ? grossLoss / losses : 0;
    
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0);
    const avgRR = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? Infinity : 0);

    return {
      netPnl,
      totalTrades: trades.length,
      winRate,
      avgTrade,
      grossProfit,
      grossLoss,
      profitFactor,
      maxWinStreak,
      maxLossStreak,
      avgRR,
      totalFees
    };
  };

  const metrics = calculateMetrics();

  if (!metrics) {
    return (
      <div className="w-full h-32 bg-surface border border-default rounded-2xl flex items-center justify-center text-muted">
        No trades to analyze in this period.
      </div>
    );
  }

  const GridItem = ({ label, value, isLocked = false, color = "text-primary" }: any) => {
    if (isLocked) {
      return (
        <div className="relative overflow-hidden bg-surface border border-default rounded-2xl p-5 flex flex-col justify-between group">
          <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-[3px] flex items-center justify-center z-10 transition-all duration-300">
            <div className="flex flex-col items-center gap-2 group-hover:scale-110 transition-transform">
              <div className="h-10 w-10 rounded-full bg-surface/50 border border-white/10 flex items-center justify-center shadow-xl">
                <i className="las la-lock text-xl text-white/70"></i>
              </div>
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Pro Tier</span>
            </div>
          </div>
          <div className="text-sm font-bold text-muted uppercase tracking-wider mb-2 opacity-30">{label}</div>
          <div className="text-2xl font-black font-mono text-primary opacity-30 filter blur-sm">
            {typeof value === 'number' && label.includes('Factor') ? value.toFixed(2) : value}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-surface border border-default rounded-2xl p-5 flex flex-col justify-between hover:shadow-lg hover:border-strong transition-all duration-300">
        <div className="text-sm font-bold text-secondary uppercase tracking-wider mb-2">{label}</div>
        <div className={`text-2xl font-black font-mono ${color}`}>
          {value}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Basic Metrics (Always Unlocked) */}
      <GridItem 
        label="Net P&L" 
        value={formatMoney(metrics.netPnl)} 
        color={metrics.netPnl >= 0 ? "text-success" : "text-danger"} 
      />
      <GridItem 
        label="Win Rate" 
        value={`${metrics.winRate.toFixed(1)}%`} 
        color={metrics.winRate >= 50 ? "text-info" : "text-warning"}
      />
      <GridItem 
        label="Total Trades" 
        value={metrics.totalTrades} 
      />
      <GridItem 
        label="Avg Trade" 
        value={formatMoney(metrics.avgTrade)} 
        color={metrics.avgTrade >= 0 ? "text-success" : "text-danger"}
      />

      {/* Advanced Metrics (Tier Locked) */}
      <GridItem 
        label="Profit Factor" 
        value={metrics.profitFactor === Infinity ? "∞" : metrics.profitFactor.toFixed(2)} 
        color={metrics.profitFactor >= 1 ? "text-success" : "text-danger"}
        isLocked={!isAdvanced}
      />
      <GridItem 
        label="Avg R:R" 
        value={metrics.avgRR === Infinity ? "∞" : `1 : ${metrics.avgRR.toFixed(2)}`} 
        isLocked={!isAdvanced}
      />
      <GridItem 
        label="Max Streaks" 
        value={<div className="flex items-center gap-2"><span className="text-success">{metrics.maxWinStreak}W</span><span className="text-muted text-sm">/</span><span className="text-danger">{metrics.maxLossStreak}L</span></div>} 
        isLocked={!isAdvanced}
      />
      <GridItem 
        label="Total Fees" 
        value={formatMoney(metrics.totalFees)} 
        color="text-warning"
        isLocked={!isAdvanced}
      />
    </div>
  );
};
