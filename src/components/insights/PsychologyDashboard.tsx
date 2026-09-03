"use client";

import React, { useMemo } from 'react';
import { TradeDoc } from '@/lib/firebase/schema';

export const PsychologyDashboard: React.FC<{ trades: TradeDoc[], currency: "USD" | "INR" }> = ({ trades, currency }) => {
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(val));
  };

  const {
    disciplineScore,
    revengeLoss,
    fomoLoss,
    totalPreventableLoss,
    emotionStats,
    prescriptions
  } = useMemo(() => {
    if (!trades || trades.length === 0) {
      return { disciplineScore: 0, revengeLoss: 0, fomoLoss: 0, totalPreventableLoss: 0, emotionStats: {}, prescriptions: [] };
    }

    let neutralCount = 0;
    let perfectExecCount = 0;
    let revengeLossTotal = 0;
    let fomoLossTotal = 0;
    let revengeOccurrences = 0;

    const stats: Record<string, { count: number; wins: number; pnl: number }> = {};
    const sorted = [...trades].sort((a, b) => new Date(a.open_time).getTime() - new Date(b.open_time).getTime());

    sorted.forEach((t, i) => {
      const pnl = t.profit_loss - (t.commission || 0);
      const emo = t.emotion || "Neutral";
      const exec = t.execution_score || "None";

      // Stats
      if (!stats[emo]) stats[emo] = { count: 0, wins: 0, pnl: 0 };
      stats[emo].count++;
      stats[emo].pnl += pnl;
      if (pnl > 0) stats[emo].wins++;

      // Discipline metrics
      if (emo === "Neutral") neutralCount++;
      if (exec === "Perfect") perfectExecCount++;

      // FOMO / Early Entry Loss
      if ((exec === "FOMO" || exec === "Early Entry" || emo === "FOMO") && pnl < 0) {
        fomoLossTotal += Math.abs(pnl);
      }

      // Revenge Logic
      if (pnl < 0) {
        const next = sorted[i + 1];
        if (next) {
          const timeGap = (new Date(next.open_time).getTime() - new Date(t.close_time).getTime()) / 60000;
          if (timeGap >= 0 && timeGap <= 15) {
            revengeOccurrences++;
            const nextPnl = next.profit_loss - (next.commission || 0);
            if (nextPnl < 0) {
              revengeLossTotal += Math.abs(nextPnl);
            }
          }
        }
      }
    });

    const total = trades.length;
    
    // Discipline Score Calculation (Max 100)
    // 40% Neutral Emotion, 40% Perfect Execution, 20% Avoid Revenge (deduct for revenge)
    const neutralScore = (neutralCount / total) * 40;
    const execScore = (perfectExecCount / total) * 40;
    const revengePenalty = Math.min(20, (revengeOccurrences / total) * 100);
    const disciplineScore = Math.max(0, Math.min(100, Math.round(neutralScore + execScore + (20 - revengePenalty))));

    // AI Prescriptions
    const rx: string[] = [];
    if (revengeOccurrences > 0) {
      rx.push(`Rule: Mandatory 30-minute walkaway after any losing trade. You have entered ${revengeOccurrences} revenge trades.`);
    }
    if (fomoLossTotal > 0) {
      rx.push(`Rule: Wait for candle close. You have bled ${formatMoney(fomoLossTotal)} to FOMO and early entries.`);
    }
    
    let worstEmo = "";
    let worstEmoLoss = 0;
    for (const [emo, data] of Object.entries(stats)) {
      if (data.pnl < worstEmoLoss && data.count >= 3 && emo !== "Neutral") {
        worstEmoLoss = data.pnl;
        worstEmo = emo;
      }
    }
    if (worstEmo) {
      rx.push(`Rule: Stop trading immediately if you feel '${worstEmo}'. It is your most destructive state (${formatMoney(worstEmoLoss)} net loss).`);
    }

    if (rx.length === 0 && disciplineScore > 80) {
      rx.push("Rule: Maintain current execution logic. You are highly disciplined.");
    } else if (rx.length === 0) {
      rx.push("Rule: Focus on tagging your trades with emotions and execution scores to unlock deep AI insights.");
    }

    return {
      disciplineScore,
      revengeLoss: revengeLossTotal,
      fomoLoss: fomoLossTotal,
      totalPreventableLoss: revengeLossTotal + fomoLossTotal,
      emotionStats: stats,
      prescriptions: rx
    };
  }, [trades]);

  if (trades.length === 0) {
    return (
      <div className="bg-[#0a0a0a] border border-default rounded-2xl p-6 shadow-xl w-full text-center">
        <i className="las la-brain text-6xl text-neutral-800 mb-4"></i>
        <h2 className="text-xl font-bold text-white tracking-tight mb-2">Psychological Analytics</h2>
        <p className="text-sm text-secondary">Log your first trade to unlock deep behavioral insights and the Cost of Mistakes ledger.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Row: Discipline & Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Discipline Index */}
        <div className="bg-[#0a0a0a] border border-default p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-xl">
          <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-6">Discipline Index</h3>
          
          <div className="relative w-40 h-40 flex items-center justify-center mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#121212" strokeWidth="8" />
              <circle 
                cx="50" cy="50" r="45" 
                fill="none" 
                stroke={disciplineScore >= 80 ? '#10b981' : disciplineScore >= 50 ? '#f59e0b' : '#ef4444'} 
                strokeWidth="8" 
                strokeDasharray={`${disciplineScore * 2.827} 282.7`} 
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white">{disciplineScore}</span>
              <span className="text-xs text-muted font-bold uppercase">/ 100</span>
            </div>
          </div>
          
          <p className="text-xs text-secondary leading-relaxed max-w-[200px]">
            Based on emotional neutrality, flawless execution, and avoidance of revenge patterns.
          </p>
        </div>

        {/* Cost of Mistakes Ledger */}
        <div className="bg-[#0a0a0a] border border-default p-6 rounded-2xl lg:col-span-2 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-6 flex items-center gap-2">
              <i className="las la-file-invoice-dollar text-rose-500 text-lg"></i> Cost of Mistakes Ledger
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center pb-4 border-b border-default/50">
                <span className="text-sm text-neutral-300">Revenge Trading Losses (Tilt)</span>
                <span className="text-sm font-mono text-rose-400">-{formatMoney(revengeLoss)}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-default/50">
                <span className="text-sm text-neutral-300">FOMO / Bad Execution Losses</span>
                <span className="text-sm font-mono text-rose-400">-{formatMoney(fomoLoss)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex justify-between items-center">
            <span className="text-sm font-bold text-rose-400 uppercase tracking-wider">Total Preventable Loss</span>
            <span className="text-2xl font-black text-rose-500">-{formatMoney(totalPreventableLoss)}</span>
          </div>
        </div>

      </div>

      {/* Bottom Row: Prescriptions & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Prescriptions */}
        <div className="bg-[#0a0a0a] border border-default p-6 rounded-2xl shadow-xl">
          <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-6 flex items-center gap-2">
            <i className="las la-capsules text-blue-500 text-lg"></i> AI Actionable Prescriptions
          </h3>
          <ul className="space-y-4">
            {prescriptions.map((px, i) => (
              <li key={i} className="flex items-start gap-3 bg-[#121212] p-4 rounded-xl border border-default">
                <i className="las la-arrow-right text-blue-500 mt-0.5"></i>
                <span className="text-sm text-neutral-300 font-medium leading-relaxed">{px}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Emotion Table */}
        <div className="bg-[#0a0a0a] border border-default p-6 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-6">Emotion vs. Performance</h3>
          
          <div className="overflow-x-auto no-scrollbar flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-[#121212] text-muted text-[10px] font-bold uppercase tracking-widest border-b border-default">
                  <th className="px-4 py-3">Emotion</th>
                  <th className="px-4 py-3">Trades</th>
                  <th className="px-4 py-3">Win Rate</th>
                  <th className="px-4 py-3 text-right">Net P&L</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {Object.keys(emotionStats).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted">No emotional data tagged yet.</td>
                  </tr>
                ) : (
                  Object.entries(emotionStats).sort((a,b) => b[1].count - a[1].count).map(([emo, data]) => (
                    <tr key={emo} className="border-b border-default/50 hover:bg-[#121212] transition-colors">
                      <td className="px-4 py-3 font-bold text-white">{emo}</td>
                      <td className="px-4 py-3 text-secondary">{data.count}</td>
                      <td className="px-4 py-3 text-secondary">{((data.wins / data.count) * 100).toFixed(0)}%</td>
                      <td className={`px-4 py-3 text-right font-bold ${data.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {data.pnl >= 0 ? '+' : '-'}{formatMoney(data.pnl)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
