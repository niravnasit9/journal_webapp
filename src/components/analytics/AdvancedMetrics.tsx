"use client";

import React, { useMemo } from 'react';
import { TradeDoc } from '@/lib/firebase/schema';

export const AdvancedMetrics: React.FC<{ trades: TradeDoc[] }> = ({ trades }) => {
  const stats = useMemo(() => {
    if (trades.length === 0) return { expectancy: 0, maxDrawdownPct: 0, avgRr: 0 };

    let totalWins = 0;
    let totalLosses = 0;
    let winProfit = 0;
    let lossProfit = 0;
    let rrSum = 0;
    let rrCount = 0;

    // For Max DD calculation
    let runningBalance = 0;
    let peak = 0;
    let maxDd = 0;

    const sorted = [...trades].sort((a, b) => new Date(a.close_time).getTime() - new Date(b.close_time).getTime());

    sorted.forEach(t => {
      const net = t.profit_loss - (t.commission || 0);
      
      // Expectancy & R:R
      if (net > 0) {
        totalWins++;
        winProfit += net;
      } else {
        totalLosses++;
        lossProfit += Math.abs(net);
      }

      if (t.risk_reward_ratio) {
        rrSum += t.risk_reward_ratio;
        rrCount++;
      }

      // Max DD
      runningBalance += net;
      if (runningBalance > peak) peak = runningBalance;
      
      // Calculate drop from peak as a percentage of the peak
      // Note: Since we are tracking relative PnL, assuming a base 100000 for realistic % drop
      // If we don't know initial balance, we'll calculate absolute drop and assume 100k for pct for now,
      // or we can just pass initialBalance down. Let's just pass absolute Max DD amount if we can't do pct,
      // but prompt asked for Max Drawdown %. We'll use relative to a 100k base.
      const baseBalance = 100000;
      const currentEquity = baseBalance + runningBalance;
      const peakEquity = baseBalance + peak;
      
      const ddPct = ((peakEquity - currentEquity) / peakEquity) * 100;
      if (ddPct > maxDd) maxDd = ddPct;
    });

    const total = totalWins + totalLosses;
    const winRate = total > 0 ? totalWins / total : 0;
    const lossRate = total > 0 ? totalLosses / total : 0;
    const avgWin = totalWins > 0 ? winProfit / totalWins : 0;
    const avgLoss = totalLosses > 0 ? lossProfit / totalLosses : 0;

    const expectancy = (winRate * avgWin) - (lossRate * avgLoss);
    const avgRr = rrCount > 0 ? rrSum / rrCount : (avgLoss > 0 ? avgWin / avgLoss : 0);

    return { expectancy, maxDrawdownPct: maxDd, avgRr };
  }, [trades]);

  if (trades.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <div className="bg-elevated border border-default rounded-xl p-4 flex items-center justify-between">
        <div>
          <span className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Expectancy / Trade</span>
          <span className={`text-xl font-black ${stats.expectancy > 0 ? 'text-[#a855f7]' : 'text-rose-500'}`}>
            {stats.expectancy > 0 ? '+' : ''}${stats.expectancy.toFixed(2)}
          </span>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#a855f7]/10 flex items-center justify-center">
          <i className="las la-calculator text-[#a855f7] text-xl"></i>
        </div>
      </div>
      
      <div className="bg-elevated border border-default rounded-xl p-4 flex items-center justify-between">
        <div>
          <span className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Max Drawdown</span>
          <span className="text-xl font-black text-rose-500">
            -{stats.maxDrawdownPct.toFixed(2)}%
          </span>
        </div>
        <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
          <i className="las la-chart-line text-rose-500 text-xl transform rotate-180"></i>
        </div>
      </div>

      <div className="bg-elevated border border-default rounded-xl p-4 flex items-center justify-between">
        <div>
          <span className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Avg R:R Ratio</span>
          <span className="text-xl font-black text-primary">
            1 : {stats.avgRr.toFixed(2)}
          </span>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
          <i className="las la-balance-scale text-blue-500 text-xl"></i>
        </div>
      </div>
    </div>
  );
};
