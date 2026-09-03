"use client";

import React, { useMemo } from 'react';
import { useTierAccess } from '@/hooks/useTierAccess';
import { TradeDoc } from '@/lib/firebase/schema';

interface BehavioralChainProps {
  trades: TradeDoc[];
  currency?: "USD" | "INR";
}

export const BehavioralChain: React.FC<BehavioralChainProps> = ({ trades, currency = "USD" }) => {
  const { activeTier } = useTierAccess();
  const isUnlocked = activeTier === 'elite';

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const { chainStats, totalRevengeLoss } = useMemo(() => {
    if (!trades || trades.length < 2) return { chainStats: null, totalRevengeLoss: 0 };

    const sorted = [...trades].sort((a, b) => new Date(a.open_time).getTime() - new Date(b.open_time).getTime());

    let revengeOccurrences = 0;
    let revengeLosses = 0;
    let totalLossAmount = 0;
    let averageLotIncrease = 0;

    let lossCount = 0;

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const pnl = current.profit_loss - (current.commission || 0);

      if (pnl < 0) {
        lossCount++;
        const next = sorted[i + 1];
        
        const currentClose = new Date(current.close_time).getTime();
        const nextOpen = new Date(next.open_time).getTime();
        
        // Time gap in minutes
        const timeGap = (nextOpen - currentClose) / 1000 / 60;
        
        // 15 minute threshold
        if (timeGap >= 0 && timeGap <= 15) {
          revengeOccurrences++;
          
          if (Math.abs((next.lot_size || next.quantity || 0) - (current.lot_size || current.quantity || 0)) > ((current.lot_size || current.quantity || 0) * 0.5)) {
            // Penalize for erratic sizing
          }
          
          if ((next.lot_size || next.quantity || 0) > (current.lot_size || current.quantity || 0)) {
            averageLotIncrease += ((next.lot_size || next.quantity || 0) - (current.lot_size || current.quantity || 0));
          }
          
          const nextPnl = next.profit_loss - (next.commission || 0);
          if (nextPnl < 0) {
            revengeLosses++;
            totalLossAmount += Math.abs(nextPnl);
          }
        }
      }
    }

    if (lossCount === 0 || revengeOccurrences === 0) return { chainStats: null, totalRevengeLoss: 0 };

    return {
      chainStats: {
        totalLosses: lossCount,
        revengeOccurrences,
        revengeLosses,
        winRateDrop: revengeLosses / revengeOccurrences,
        avgLotIncrease: revengeOccurrences > 0 ? averageLotIncrease / revengeOccurrences : 0
      },
      totalRevengeLoss: totalLossAmount
    };
  }, [trades]);

  if (!isUnlocked) {
    return (
      <div className="relative w-full bg-surface border border-default rounded-2xl p-6 overflow-hidden flex flex-col items-center justify-center text-center min-h-[220px]">
        <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-md flex items-center justify-center z-10 transition-all duration-300">
          <div className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-surface/50 border border-[var(--plan-elite)]/30 flex items-center justify-center shadow-[0_0_20px_-5px_var(--plan-elite)]">
              <i className="las la-link text-3xl text-[var(--plan-elite)]"></i>
            </div>
            <div className="bg-[var(--plan-elite-bg)] px-3 py-1 rounded-full border border-[var(--plan-elite)]/20">
               <span className="text-xs font-bold text-[var(--plan-elite)] uppercase tracking-widest">Elite Tier Required</span>
            </div>
            <h3 className="text-lg font-bold text-primary mt-1">Post-Loss Behavioral Chain</h3>
            <p className="text-sm text-primary/70 max-w-sm">
              Upgrade to Elite to mathematically track how your lot size and win rate collapse immediately after a losing trade.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!chainStats) {
    return null; // Not enough data or no losses
  }

  const revengeRate = (chainStats.revengeOccurrences / chainStats.totalLosses) * 100;
  const failureRate = chainStats.winRateDrop * 100;

  return (
    <div className="w-full bg-surface border border-[var(--plan-elite)]/30 rounded-2xl p-6 shadow-[0_0_15px_-3px_var(--plan-elite-bg)]">
      <div className="flex items-center gap-3 mb-4 border-b border-subtle pb-4">
        <div className="w-10 h-10 rounded-full bg-[var(--plan-elite-bg)] text-[var(--plan-elite)] flex items-center justify-center border border-[var(--plan-elite)]/20">
          <i className="las la-fire-alt text-2xl"></i>
        </div>
        <div>
          <h3 className="text-lg font-bold text-primary tracking-tight">Post-Loss Behavioral Chain</h3>
          <p className="text-xs text-secondary font-medium uppercase tracking-wider">Algorithmic Tilt Detection</p>
        </div>
      </div>
      
      {chainStats.revengeOccurrences > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-primary leading-relaxed font-medium">
            When you lose a trade, <span className="font-black text-warning">{revengeRate.toFixed(0)}%</span> of the time your next trade is entered within 15 minutes. 
            {chainStats.avgLotIncrease > 0 && <span> Your lot size increases by an average of <span className="font-black text-danger">{chainStats.avgLotIncrease.toFixed(2)}</span> lots.</span>}
            <br/><br/>
            On these specific "revenge" entries, you lose <span className="font-black text-danger">{failureRate.toFixed(0)}%</span> of the time. 
            This specific behavioral chain has cost you <span className="font-black text-danger">{formatMoney(totalRevengeLoss)}</span>.
          </p>
        </div>
      ) : (
        <p className="text-sm text-primary leading-relaxed font-medium">
          You show exceptional discipline. You rarely enter a trade within 15 minutes of taking a loss. Keep protecting your mental capital.
        </p>
      )}
    </div>
  );
};
