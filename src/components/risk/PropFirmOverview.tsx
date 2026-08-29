"use client";

import React, { useState, useEffect } from 'react';
import { AccountDoc, TradeDoc, PropFirmPreset } from '@/lib/firebase/schema';

export const PropFirmOverview: React.FC<{ account: AccountDoc, trades: TradeDoc[], preset?: PropFirmPreset, currency: "USD" | "INR" }> = ({ account, trades, preset, currency }) => {
  const [timeLeft, setTimeLeft] = useState("");

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  if (trades.length === 0) {
    return (
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-6 shadow-2xl w-full text-center">
        <i className="las la-rocket text-6xl text-neutral-800 mb-4"></i>
        <h2 className="text-xl font-bold text-white tracking-tight mb-2">Prop Firm Overview</h2>
        <p className="text-sm text-neutral-400">Log your first trade to unlock this module and track your consistency.</p>
      </div>
    );
  }

  // 1. Target Progress
  const initialBalance = account.initial_balance || 100000;
  const currentBalance = account.current_balance || initialBalance;
  const netGain = currentBalance - initialBalance;
  
  // DYNAMIC TARGET LOGIC: Uses preset if it exists, otherwise falls back to 8%
  const targetPct = preset?.target_pct ? (preset.target_pct / 100) : 0.08;
  const targetGoal = initialBalance * targetPct;
  const progressPct = Math.max(0, Math.min(100, (netGain / targetGoal) * 100));

  // 2. Reset Clock (5:00 PM EST)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      // Get current time in EST
      const estTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
      
      const resetTime = new Date(estTime);
      resetTime.setHours(17, 0, 0, 0); // 5 PM EST
      
      if (estTime.getTime() > resetTime.getTime()) {
        resetTime.setDate(resetTime.getDate() + 1); // Next day 5 PM
      }
      
      const diff = resetTime.getTime() - estTime.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Consistency Auditor (50% rule)
  const dailyPnL: Record<string, number> = {};
  let totalProfit = 0;
  trades.forEach(t => {
    const pnl = t.profit_loss - (t.commission || 0);
    const dateStr = new Date(t.close_time).toISOString().split('T')[0];
    dailyPnL[dateStr] = (dailyPnL[dateStr] || 0) + pnl;
  });

  const profitDays = Object.values(dailyPnL).filter(pnl => pnl > 0);
  totalProfit = profitDays.reduce((a, b) => a + b, 0);
  
  const maxProfitDay = profitDays.length > 0 ? Math.max(...profitDays) : 0;
  const consistencyPct = totalProfit > 0 ? (maxProfitDay / totalProfit) * 100 : 0;
  const consistencyPass = consistencyPct <= 50;

  // 4. Pass Probability
  const avgDailyPnL = profitDays.length > 0 ? (totalProfit - Math.abs(Object.values(dailyPnL).filter(pnl => pnl < 0).reduce((a, b) => a + b, 0))) / Object.keys(dailyPnL).length : 0;
  const remainingToTarget = targetGoal - netGain;
  const projectedDays = (avgDailyPnL > 0 && remainingToTarget > 0) ? Math.ceil(remainingToTarget / avgDailyPnL) : null;

  return (
    <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-6 shadow-2xl w-full">
      <div className="flex items-center justify-between mb-6 border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <i className="las la-rocket text-blue-500"></i> Prop Firm Overview
          </h2>
          <p className="text-sm text-neutral-400 mt-1">Command center for evaluation phase.</p>
        </div>
        <div className="bg-[#121212] border border-neutral-800 px-4 py-2 rounded-lg text-right">
          <span className="block text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Reset In (EST)</span>
          <span className="text-lg font-mono text-white font-black animate-pulse">{timeLeft || "00:00:00"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Target Progress */}
        <div className="bg-[#121212] border border-neutral-800 rounded-xl p-5 lg:col-span-2">
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Phase 1 Target (8%)</span>
              <span className="text-2xl font-black text-white">{formatMoney(netGain)} <span className="text-sm font-medium text-neutral-500">/ {formatMoney(targetGoal)}</span></span>
            </div>
            <span className="text-lg font-bold text-blue-500">{progressPct.toFixed(1)}%</span>
          </div>
          <div className="h-3 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
            <div 
              className="h-full bg-blue-600 transition-all duration-1000 ease-out relative"
              style={{ width: `${progressPct}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-neutral-400">Projected Completion:</span>
            <span className="font-bold text-white">
              {netGain >= targetGoal ? "Target Hit! 🎉" : (projectedDays ? `~${projectedDays} Trading Days` : "Need more data")}
            </span>
          </div>
        </div>

        {/* Consistency Auditor */}
        <div className="bg-[#121212] border border-neutral-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <span className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              Consistency Rule
              {consistencyPass ? (
                <i className="las la-check-circle text-emerald-500 text-lg"></i>
              ) : (
                <i className="las la-exclamation-triangle text-amber-500 text-lg animate-pulse"></i>
              )}
            </span>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-black ${consistencyPass ? 'text-white' : 'text-amber-500'}`}>
                {consistencyPct.toFixed(1)}%
              </span>
              <span className="text-sm text-neutral-500 mb-1 border-b border-neutral-700 border-dashed pb-0.5 tooltip-trigger">
                Max 50%
              </span>
            </div>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed mt-4">
            {consistencyPass 
              ? "Your largest winning day is well within the 50% consistency threshold. Excellent steady growth."
              : "Warning: A single day accounts for over 50% of your total profit. You must trade more to dilute this day before passing."}
          </p>
        </div>

      </div>
    </div>
  );
};
