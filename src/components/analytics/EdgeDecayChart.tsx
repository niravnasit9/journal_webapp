"use client";

import React, { useMemo } from 'react';
import { useTierAccess } from '@/hooks/useTierAccess';
import { TradeDoc } from '@/lib/firebase/schema';

interface EdgeDecayChartProps {
  trades: TradeDoc[];
}

export const EdgeDecayChart: React.FC<EdgeDecayChartProps> = ({ trades }) => {
  const { activeTier } = useTierAccess();
  const isUnlocked = activeTier === 'elite';

  const { buckets, insights, decayPoint } = useMemo(() => {
    if (!trades || trades.length === 0) return { buckets: [], insights: null, decayPoint: null };

    // Buckets: <15m, 15-60m, 1h-4h, >4h
    const data = [
      { label: "< 15m", wins: 0, total: 0, pnl: 0, id: 0 },
      { label: "15m - 1h", wins: 0, total: 0, pnl: 0, id: 1 },
      { label: "1h - 4h", wins: 0, total: 0, pnl: 0, id: 2 },
      { label: "4h+", wins: 0, total: 0, pnl: 0, id: 3 },
    ];

    trades.forEach(t => {
      const open = new Date(t.open_time).getTime();
      const close = new Date(t.close_time).getTime();
      if (isNaN(open) || isNaN(close)) return;

      const durationMins = (close - open) / 1000 / 60;
      const pnl = t.profit_loss - (t.commission || 0);
      const isWin = pnl > 0;

      let idx = 3;
      if (durationMins < 15) idx = 0;
      else if (durationMins < 60) idx = 1;
      else if (durationMins < 240) idx = 2;

      data[idx].total++;
      if (isWin) data[idx].wins++;
      data[idx].pnl += pnl;
    });

    const processed = data.map(b => ({
      ...b,
      winRate: b.total > 0 ? (b.wins / b.total) * 100 : 0
    })).filter(b => b.total > 0);

    if (processed.length < 2) return { buckets: processed, insights: null, decayPoint: null };

    // Find Decay Point (Sharpest drop in win rate or lowest win rate bucket after highest)
    let highestWinRateIdx = 0;
    for (let i = 1; i < processed.length; i++) {
      if (processed[i].winRate > processed[highestWinRateIdx].winRate) {
        highestWinRateIdx = i;
      }
    }

    let lowestSubsequentIdx = -1;
    for (let i = highestWinRateIdx + 1; i < processed.length; i++) {
      if (lowestSubsequentIdx === -1 || processed[i].winRate < processed[lowestSubsequentIdx].winRate) {
        lowestSubsequentIdx = i;
      }
    }

    if (lowestSubsequentIdx !== -1 && processed[highestWinRateIdx].winRate - processed[lowestSubsequentIdx].winRate > 15) {
      const best = processed[highestWinRateIdx];
      const worst = processed[lowestSubsequentIdx];
      
      const insight = `Your edge completely expires after ${best.label}. Trades held in the ${best.label} window have a ${best.winRate.toFixed(0)}% win rate, but trades held into the ${worst.label} window crash to a ${worst.winRate.toFixed(0)}% win rate. You are holding losers too long or fighting the market regime.`;
      
      return { buckets: processed, insights: insight, decayPoint: worst.label };
    }

    return { buckets: processed, insights: "Your win rate is relatively stable across different hold times. No extreme time decay detected.", decayPoint: null };
  }, [trades]);

  if (!isUnlocked) {
    return (
      <div className="relative w-full bg-surface border border-default rounded-2xl p-6 overflow-hidden flex flex-col items-center justify-center text-center min-h-[300px]">
        <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-md flex items-center justify-center z-10 transition-all duration-300">
          <div className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-surface/50 border border-[var(--plan-elite)]/30 flex items-center justify-center shadow-[0_0_20px_-5px_var(--plan-elite)]">
              <i className="las la-hourglass-end text-3xl text-[var(--plan-elite)]"></i>
            </div>
            <div className="bg-[var(--plan-elite-bg)] px-3 py-1 rounded-full border border-[var(--plan-elite)]/20">
               <span className="text-xs font-bold text-[var(--plan-elite)] uppercase tracking-widest">Elite Tier Required</span>
            </div>
            <h3 className="text-lg font-bold text-primary mt-1">Hold-Time Edge Decay</h3>
            <p className="text-sm text-primary/70 max-w-sm">
              Upgrade to Elite to discover exactly when your statistical edge expires in a trade, preventing you from holding losers too long.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (buckets.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-surface border border-[var(--plan-elite)]/30 rounded-2xl p-6 shadow-[0_0_15px_-3px_var(--plan-elite-bg)]">
      <div className="flex items-center gap-3 mb-6 border-b border-subtle pb-4">
        <div className="w-10 h-10 rounded-full bg-[var(--plan-elite-bg)] text-[var(--plan-elite)] flex items-center justify-center border border-[var(--plan-elite)]/20">
          <i className="las la-hourglass-half text-2xl"></i>
        </div>
        <div>
          <h3 className="text-lg font-bold text-primary tracking-tight">Hold-Time Edge Decay</h3>
          <p className="text-xs text-secondary font-medium uppercase tracking-wider">Algorithmic Duration Analysis</p>
        </div>
      </div>
      
      {insights && (
        <div className="mb-6 bg-elevated rounded-xl p-4 border-l-4 border-[var(--plan-elite)]">
          <p className="text-sm text-primary font-medium leading-relaxed">
            {insights.split(decayPoint || '||').map((part, i, arr) => 
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && decayPoint && <span className="font-black text-danger">{decayPoint}</span>}
              </React.Fragment>
            )}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Win Rate by Hold Time</h4>
        {buckets.map(b => (
          <div key={b.label} className="flex items-center gap-4">
            <div className="w-20 text-sm font-bold text-primary">{b.label}</div>
            <div className="flex-1 bg-subtle h-4 rounded-full overflow-hidden flex">
              <div 
                className={`h-full ${b.winRate >= 50 ? 'bg-success' : 'bg-danger'} transition-all duration-500`} 
                style={{ width: `${b.winRate}%` }}
              ></div>
            </div>
            <div className="w-16 text-right text-sm font-black text-primary">{b.winRate.toFixed(0)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
};
