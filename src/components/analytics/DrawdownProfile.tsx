"use client";

import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TradeDoc } from '@/lib/firebase/schema';
import { useAuth } from '@/lib/firebase/authContext';
import Link from 'next/link';

export const DrawdownProfile: React.FC<{ trades: TradeDoc[] }> = ({ trades }) => {
  const { tier } = useAuth();
  const isPremium = tier === 'pro' || tier === 'elite';

  const { data, maxDrawdown, avgRecoveryTrades } = useMemo(() => {
    if (!isPremium || trades.length < 5) return { data: [], maxDrawdown: 0, avgRecoveryTrades: 0 };

    const sorted = [...trades].sort((a, b) => new Date(a.close_time).getTime() - new Date(b.close_time).getTime());
    let balance = 0;
    let hwm = 0; // High Water Mark
    let maxDd = 0;

    let inDrawdown = false;
    let drawdownStartTradeIndex = 0;
    const recoveryLengths: number[] = [];

    const chartData = sorted.map((t, index) => {
      const net = t.profit_loss - (t.commission || 0);
      balance += net;
      
      if (balance > hwm) {
        hwm = balance;
        if (inDrawdown) {
          recoveryLengths.push(index - drawdownStartTradeIndex);
          inDrawdown = false;
        }
      } else if (balance < hwm && !inDrawdown) {
        inDrawdown = true;
        drawdownStartTradeIndex = index;
      }

      const drawdown = balance - hwm; // Will be 0 or negative
      if (drawdown < maxDd) maxDd = drawdown;

      return {
        date: new Date(t.close_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        drawdown: drawdown,
      };
    });

    const avgRec = recoveryLengths.length > 0 
      ? recoveryLengths.reduce((a, b) => a + b, 0) / recoveryLengths.length 
      : 0;

    return { data: chartData, maxDrawdown: Math.abs(maxDd), avgRecoveryTrades: Math.ceil(avgRec) };
  }, [trades, isPremium]);

  if (!isPremium) {
    return (
      <div className="bg-surface border border-default rounded-2xl p-6 shadow-xl w-full relative overflow-hidden h-[400px]">
        <div className="absolute inset-0 bg-surface/80 backdrop-blur-md z-10 flex flex-col items-center justify-center text-center p-6">
          <div className="w-16 h-16 bg-elevated rounded-full flex items-center justify-center border border-default mb-4">
            <i className="las la-lock text-3xl text-secondary"></i>
          </div>
          <h3 className="text-xl font-black text-primary mb-2">Drawdown Profile Locked</h3>
          <p className="text-sm text-secondary font-medium mb-6 max-w-sm">
            Upgrade to Pro or Elite to visualize your precise underwater equity depth and recovery timeline.
          </p>
          <Link href="/pricing" className="bg-[#a855f7] hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-bold transition-colors">
            Upgrade to Pro
          </Link>
        </div>
        <div className="opacity-20 pointer-events-none blur-sm w-full h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-primary">Underwater Profile</h2>
            <div className="text-xl font-black text-primary">- $1,250</div>
          </div>
          <div className="h-[250px] bg-neutral-900 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (trades.length < 5) {
    return (
      <div className="bg-surface border border-default rounded-2xl p-6 shadow-xl w-full h-[400px] flex flex-col items-center justify-center text-center">
        <i className="las la-water text-6xl text-neutral-800 mb-4"></i>
        <h2 className="text-xl font-bold text-primary tracking-tight">Drawdown Profile</h2>
        <p className="text-sm text-muted mt-2">Log at least 5 trades to calculate High Water Marks and underwater depth.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-elevated border border-default p-3 rounded-lg shadow-xl">
          <p className="text-xs text-secondary mb-1">{label}</p>
          <p className="text-sm font-bold text-rose-500 flex items-center gap-2">
            Drawdown: ${Math.abs(payload[0].value).toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-surface border border-default rounded-2xl p-4 md:p-6 shadow-xl w-full min-w-0 overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary tracking-tight flex items-center gap-2">
            <i className="las la-water text-rose-500"></i> Underwater Profile
          </h2>
          <p className="text-sm text-secondary mt-1">Equity depth below the High Water Mark.</p>
        </div>
        
        <div className="bg-elevated border border-default px-4 py-2 rounded-xl text-right flex items-center gap-6">
          <div>
            <span className="block text-[10px] uppercase font-bold text-muted tracking-wider">Max Depth</span>
            <span className="text-lg font-black text-rose-500">-${maxDrawdown.toFixed(2)}</span>
          </div>
          <div className="border-l border-default pl-4">
            <span className="block text-[10px] uppercase font-bold text-muted tracking-wider">Avg Recovery</span>
            <span className="text-lg font-black text-primary">{avgRecoveryTrades} <span className="text-xs font-normal text-secondary">Trades</span></span>
          </div>
        </div>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
            <XAxis dataKey="date" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
            <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${Math.abs(val)}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="drawdown" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorDrawdown)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
