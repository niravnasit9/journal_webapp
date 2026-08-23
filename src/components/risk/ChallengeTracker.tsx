"use client";

import React from 'react';
import { useTierAccess } from '@/hooks/useTierAccess';

interface ChallengeTrackerProps {
  account: any; // Using any to accommodate demo data fields like highest_equity
  currency?: "USD" | "INR";
}

export const ChallengeTracker: React.FC<ChallengeTrackerProps> = ({ account, currency = "USD" }) => {
  const { propFirmGuardian } = useTierAccess();
  
  if (!account) return null;

  const isLocked = !propFirmGuardian;

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  // Locked State Render
  if (isLocked) {
    return (
      <div className="relative w-full bg-surface border border-default rounded-2xl p-6 overflow-hidden group min-h-[220px] flex items-center justify-center">
        {/* Background fake data blurred */}
        <div className="absolute inset-0 opacity-20 filter blur-[6px] p-6 pointer-events-none">
          <div className="h-4 bg-muted rounded w-1/3 mb-6"></div>
          <div className="h-8 bg-success rounded-full w-full mb-4"></div>
          <div className="h-8 bg-success rounded-full w-full mb-4"></div>
        </div>
        
        {/* Lock UI */}
        <div className="relative z-10 flex flex-col items-center gap-4 group-hover:scale-105 transition-transform text-center">
          <div className="h-14 w-14 rounded-full bg-info/20 border border-info flex items-center justify-center shadow-[0_0_30px_-5px_var(--status-info)]">
            <i className="las la-shield-alt text-3xl text-info"></i>
          </div>
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-bold text-primary tracking-tight">Prop Firm Guardian</h3>
            <p className="text-sm text-secondary max-w-[280px] mt-1">
              Upgrade to Pro or Elite to unlock real-time drawdown tracking and protect your funded accounts.
            </p>
          </div>
          <button className="mt-2 px-6 py-2 rounded-full bg-primary text-inverse font-bold text-sm shadow-md hover:scale-105 transition-transform">
            Unlock Tracker
          </button>
        </div>
      </div>
    );
  }

  // Active Tracker Logic
  const balance = account.current_balance || account.initial_balance;
  const equity = account.current_equity || balance + (account.current_floating_pnl || 0);
  const highestEquity = account.highest_equity || Math.max(account.initial_balance, equity);
  
  const dailyLossLimitPct = account.daily_loss_limit_pct || 5;
  const maxDrawdownPct = account.max_drawdown_pct || 10;
  
  // Daily Drawdown Math
  // Assuming start of day balance is roughly initial_balance if no other data (simplified for UI)
  const startOfDayBalance = account.initial_balance; 
  const maxDailyLossAllowed = startOfDayBalance * (dailyLossLimitPct / 100);
  const currentDailyLoss = startOfDayBalance - equity; // If equity < start, we have a loss
  
  const dailyLossPctUsed = currentDailyLoss <= 0 ? 0 : (currentDailyLoss / maxDailyLossAllowed) * 100;
  
  // Max Drawdown Math (Trailing vs Static)
  const isTrailing = account.is_trailing || account.drawdown_type === 'trailing';
  const highWaterMark = isTrailing ? highestEquity : account.initial_balance;
  
  const maxLossAllowed = highWaterMark * (maxDrawdownPct / 100);
  const currentMaxLoss = highWaterMark - equity;
  const maxLossPctUsed = currentMaxLoss <= 0 ? 0 : (currentMaxLoss / maxLossAllowed) * 100;

  // Helper to determine bar color
  const getBarColor = (pctUsed: number) => {
    if (pctUsed >= 90) return 'bg-rose-500 shadow-rose-500/50';
    if (pctUsed >= 75) return 'bg-amber-500 shadow-amber-500/50';
    return 'bg-emerald-500 shadow-emerald-500/50';
  };

  return (
    <div className="w-full bg-surface border border-default rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
          <i className="las la-shield-alt text-lg"></i>
          Drawdown Guardian
        </h3>
        <div className="text-xs font-bold text-muted bg-elevated px-3 py-1 rounded-full uppercase">
          {account.type || 'Evaluation'}
        </div>
      </div>

      <div className="space-y-6">
        {/* Daily Loss Tracker */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <div>
              <div className="text-sm font-bold text-primary">Daily Loss Limit ({dailyLossLimitPct}%)</div>
              <div className="text-xs text-muted">Max Loss: {formatMoney(maxDailyLossAllowed)}</div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-black font-mono ${dailyLossPctUsed >= 90 ? 'text-rose-500' : 'text-primary'}`}>
                {formatMoney(Math.max(0, currentDailyLoss))} <span className="text-muted font-normal">lost</span>
              </div>
            </div>
          </div>
          <div className="h-3 w-full bg-elevated rounded-full overflow-hidden border border-subtle">
            <div 
              className={`h-full rounded-full transition-all duration-500 shadow-lg ${getBarColor(dailyLossPctUsed)}`}
              style={{ width: `${Math.min(100, Math.max(0, dailyLossPctUsed))}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1 text-[10px] font-bold text-muted uppercase">
            <span>Safe</span>
            <span>{dailyLossPctUsed.toFixed(1)}% Used</span>
            <span className="text-rose-500/70">Breach</span>
          </div>
        </div>

        {/* Max Drawdown Tracker */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <div>
              <div className="text-sm font-bold text-primary">Max {isTrailing ? 'Trailing' : 'Static'} Drawdown ({maxDrawdownPct}%)</div>
              <div className="text-xs text-muted">High Watermark: {formatMoney(highWaterMark)}</div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-black font-mono ${maxLossPctUsed >= 90 ? 'text-rose-500' : 'text-primary'}`}>
                {formatMoney(Math.max(0, maxLossAllowed - currentMaxLoss))} <span className="text-muted font-normal">buffer</span>
              </div>
            </div>
          </div>
          <div className="h-3 w-full bg-elevated rounded-full overflow-hidden border border-subtle">
            <div 
              className={`h-full rounded-full transition-all duration-500 shadow-lg ${getBarColor(maxLossPctUsed)}`}
              style={{ width: `${Math.min(100, Math.max(0, maxLossPctUsed))}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1 text-[10px] font-bold text-muted uppercase">
            <span>Safe</span>
            <span>{maxLossPctUsed.toFixed(1)}% Used</span>
            <span className="text-rose-500/70">Breach</span>
          </div>
        </div>
      </div>
    </div>
  );
};
