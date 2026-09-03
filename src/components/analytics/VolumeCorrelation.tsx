"use client";

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TradeDoc } from '@/lib/firebase/schema';
import { useAuth } from '@/lib/firebase/authContext';
import Link from 'next/link';

export const VolumeCorrelation: React.FC<{ trades: TradeDoc[] }> = ({ trades }) => {
  const { tier } = useAuth();
  const isPremium = tier === 'pro' || tier === 'elite';

  const { data, correlationAlert } = useMemo(() => {
    if (!isPremium || trades.length < 5) return { data: [], correlationAlert: null };

    const tiers = {
      "Micro (< 0.5)": { wins: 0, lossProfit: 0, winProfit: 0, total: 0 },
      "Small (0.5 - 1)": { wins: 0, lossProfit: 0, winProfit: 0, total: 0 },
      "Medium (1 - 3)": { wins: 0, lossProfit: 0, winProfit: 0, total: 0 },
      "Large (3+)": { wins: 0, lossProfit: 0, winProfit: 0, total: 0 }
    };

    trades.forEach(t => {
      const net = (t.profit_loss || t.net_pnl || 0) - (t.commission || 0);
      const vol = t.lot_size || t.quantity || 0;
      let tierKey = "";
      if (vol < 0.5) tierKey = "Micro (< 0.5)";
      else if (vol <= 1) tierKey = "Small (0.5 - 1)";
      else if (vol <= 3) tierKey = "Medium (1 - 3)";
      else tierKey = "Large (3+)";

      tiers[tierKey as keyof typeof tiers].total++;
      if (net > 0) {
        tiers[tierKey as keyof typeof tiers].wins++;
        tiers[tierKey as keyof typeof tiers].winProfit += net;
      } else {
        tiers[tierKey as keyof typeof tiers].lossProfit += Math.abs(net);
      }
    });

    const chartData = Object.entries(tiers).map(([name, stats]) => {
      const winRate = stats.total > 0 ? (stats.wins / stats.total) * 100 : 0;
      const profitFactor = stats.lossProfit > 0 ? stats.winProfit / stats.lossProfit : (stats.winProfit > 0 ? 99 : 0);
      return {
        name,
        winRate,
        profitFactor,
        total: stats.total
      };
    }).filter(d => d.total > 0);

    let alert = null;
    if (chartData.length >= 2) {
      // Check if win rate drops significantly when lot size increases
      const smallest = chartData[0];
      const largest = chartData[chartData.length - 1];
      if (smallest.winRate - largest.winRate > 20 && largest.total >= 3) {
        alert = `Your win rate drops from ${smallest.winRate.toFixed(0)}% to ${largest.winRate.toFixed(0)}% when you increase volume. This indicates psychological breakdown at higher risk.`;
      }
    }

    return { data: chartData, correlationAlert: alert };
  }, [trades, isPremium]);

  if (!isPremium) {
    return (
      <div className="bg-surface border border-default rounded-2xl p-6 shadow-xl w-full relative overflow-hidden h-[400px]">
        <div className="absolute inset-0 bg-surface/80 backdrop-blur-md z-10 flex flex-col items-center justify-center text-center p-6">
          <div className="w-16 h-16 bg-elevated rounded-full flex items-center justify-center border border-default mb-4">
            <i className="las la-lock text-3xl text-secondary"></i>
          </div>
          <h3 className="text-xl font-black text-primary mb-2">Volume Correlation Locked</h3>
          <p className="text-sm text-secondary font-medium mb-6 max-w-sm">
            Upgrade to Pro to mathematically prove if your edge decays when you increase your lot size.
          </p>
          <Link href="/pricing" className="bg-[#a855f7] hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-bold transition-colors">
            Upgrade to Pro
          </Link>
        </div>
        <div className="opacity-20 pointer-events-none blur-sm w-full h-full">
           <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-primary">Volume Correlation</h2>
          </div>
          <div className="h-[250px] bg-neutral-900 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (trades.length < 5) {
    return (
      <div className="bg-surface border border-default rounded-2xl p-6 shadow-xl w-full h-[400px] flex flex-col items-center justify-center text-center">
        <i className="las la-weight-hanging text-6xl text-neutral-800 mb-4"></i>
        <h2 className="text-xl font-bold text-primary tracking-tight">Volume Correlation</h2>
        <p className="text-sm text-muted mt-2">Log at least 5 trades to correlate lot sizes against performance.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-elevated border border-default p-3 rounded-lg shadow-xl">
          <p className="text-xs text-secondary mb-2 font-bold">{label}</p>
          <p className="text-sm font-bold text-[#a855f7] mb-1">Win Rate: {payload[0].value.toFixed(1)}%</p>
          <p className="text-xs text-emerald-400">Profit Factor: {payload[0].payload.profitFactor.toFixed(2)}</p>
          <p className="text-xs text-muted mt-2">Sample Size: {payload[0].payload.total} Trades</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-surface border border-default rounded-2xl p-4 md:p-6 shadow-xl w-full min-w-0 overflow-hidden">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-primary tracking-tight flex items-center gap-2">
          <i className="las la-weight-hanging text-[#a855f7]"></i> Volume Correlation
        </h2>
        {correlationAlert && (
          <div className="mt-4 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
            <p className="text-sm text-primary font-medium">
              <span className="text-rose-500 font-bold">Risk Alert:</span> {correlationAlert}
            </p>
          </div>
        )}
      </div>

      <div className="h-[250px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
            <XAxis dataKey="name" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--border-subtle)' }} />
            <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.winRate > 50 ? '#a855f7' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
