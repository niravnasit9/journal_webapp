"use client";

import React, { useMemo } from 'react';
import { useTierAccess } from '@/hooks/useTierAccess';
import { TradeDoc } from '@/lib/firebase/schema';

interface RecoverySimulatorProps {
  account: any;
  trades: TradeDoc[];
  currency?: "USD" | "INR";
}

export const RecoverySimulator: React.FC<RecoverySimulatorProps> = ({ account, trades, currency = "USD" }) => {
  const { activeTier } = useTierAccess();
  const isUnlocked = activeTier === 'pro' || activeTier === 'elite';

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const { isDrawdown, recoveryAmount, consecutiveWins, normalTrades, winRate, avgWin } = useMemo(() => {
    if (!account || !trades || trades.length === 0) {
      return { isDrawdown: false, recoveryAmount: 0, consecutiveWins: 0, normalTrades: 0, winRate: 0, avgWin: 0 };
    }

    const currentBalance = account.current_balance || account.initial_balance;
    const peak = account.highest_equity || Math.max(account.initial_balance, currentBalance);
    
    // Check if in drawdown
    const drawdownAmount = peak - currentBalance;
    if (drawdownAmount <= 0) {
      return { isDrawdown: false, recoveryAmount: 0, consecutiveWins: 0, normalTrades: 0, winRate: 0, avgWin: 0 };
    }

    let winningTrades = 0;
    let sumWinPnl = 0;

    trades.forEach(t => {
      const pnl = t.profit_loss - (t.commission || 0);
      if (pnl > 0) {
        winningTrades++;
        sumWinPnl += pnl;
      }
    });

    const historicalWinRate = winningTrades / trades.length;
    const historicalAvgWin = winningTrades > 0 ? sumWinPnl / winningTrades : 0;

    if (historicalAvgWin <= 0 || historicalWinRate <= 0) {
      return { isDrawdown: true, recoveryAmount: drawdownAmount, consecutiveWins: Infinity, normalTrades: Infinity, winRate: historicalWinRate, avgWin: historicalAvgWin };
    }

    const consWins = Math.ceil(drawdownAmount / historicalAvgWin);
    const normTrades = Math.ceil(consWins / historicalWinRate);

    return {
      isDrawdown: true,
      recoveryAmount: drawdownAmount,
      consecutiveWins: consWins,
      normalTrades: normTrades,
      winRate: historicalWinRate * 100,
      avgWin: historicalAvgWin
    };
  }, [account, trades]);

  if (!isDrawdown) {
    return null; // Don't show if they are at all time highs
  }

  if (!isUnlocked) {
    return (
      <div className="relative w-full bg-surface border border-default rounded-2xl p-6 overflow-hidden flex flex-col items-center justify-center text-center min-h-[160px]">
        <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-[3px] flex items-center justify-center z-10 transition-all duration-300">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-surface/50 border border-white/10 flex items-center justify-center shadow-xl">
              <i className="las la-lock text-2xl text-white/70"></i>
            </div>
            <div className="bg-white/10 px-3 py-1 rounded-full">
               <span className="text-xs font-bold text-white uppercase tracking-widest">Pro Tier</span>
            </div>
            <p className="text-sm text-white/70 max-w-xs">
              Unlock the Drawdown Recovery Simulator to get a personalized mathematical path out of drawdown.
            </p>
          </div>
        </div>
        {/* Blurred background mock data */}
        <h3 className="text-lg font-bold text-primary mb-2 opacity-30 filter blur-sm">Drawdown Recovery Simulator</h3>
        <p className="text-sm text-secondary opacity-30 filter blur-sm">
          Based on your historical win rate of 45% and average win of $200, you need exactly 10 consecutive wins to recover your drawdown.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface border border-[var(--plan-pro)]/30 rounded-2xl p-6 shadow-[0_0_15px_-3px_var(--plan-pro-bg)]">
      <div className="flex items-center gap-3 mb-4 border-b border-subtle pb-4">
        <div className="w-10 h-10 rounded-full bg-[var(--plan-pro-bg)] text-[var(--plan-pro)] flex items-center justify-center">
          <i className="las la-calculator text-2xl"></i>
        </div>
        <div>
          <h3 className="text-lg font-bold text-primary tracking-tight">Recovery Simulator</h3>
          <p className="text-xs text-secondary font-medium uppercase tracking-wider">Algorithmic Reality Check</p>
        </div>
      </div>
      
      {consecutiveWins === Infinity ? (
        <p className="text-sm text-primary leading-relaxed font-medium">
          You are currently in a <span className="font-bold text-danger">{formatMoney(recoveryAmount)}</span> drawdown. Unfortunately, you do not have enough historical winning data to calculate a recovery path. Focus on logging profitable trades first.
        </p>
      ) : (
        <p className="text-sm text-primary leading-relaxed font-medium">
          Based on your historical win rate of <span className="font-black text-info">{winRate.toFixed(1)}%</span> and average win of <span className="font-black text-success">{formatMoney(avgWin)}</span>, you need exactly <span className="font-black text-[var(--plan-pro)] px-1 bg-[var(--plan-pro-bg)] rounded">{consecutiveWins} consecutive average wins</span>, or <span className="font-black text-[var(--plan-pro)] px-1 bg-[var(--plan-pro-bg)] rounded">{normalTrades} normal trades</span>, to recover your current <span className="font-bold text-danger">{formatMoney(recoveryAmount)}</span> drawdown. 
          <br/><br/>
          <span className="text-warning font-bold"><i className="las la-exclamation-triangle text-lg"></i> Do not increase your lot size to rush this process.</span>
        </p>
      )}
    </div>
  );
};
