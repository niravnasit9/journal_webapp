"use client";

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TradeDoc, AccountDoc } from '@/lib/firebase/schema';
import { useAuth } from '@/lib/firebase/authContext';
import Link from 'next/link';

export const MonteCarloSimulator: React.FC<{ trades: TradeDoc[], account?: AccountDoc }> = ({ trades, account }) => {
  const { tier } = useAuth();
  const isElite = tier === 'elite';

  const { data, riskOfRuin } = useMemo(() => {
    if (!isElite || trades.length < 5) return { data: [], riskOfRuin: 0 };

    let totalWins = 0;
    let winProfit = 0;
    let totalLosses = 0;
    let lossProfit = 0;

    trades.forEach(t => {
      const net = t.profit_loss - (t.commission || 0);
      if (net > 0) {
        totalWins++;
        winProfit += net;
      } else {
        totalLosses++;
        lossProfit += Math.abs(net);
      }
    });

    const total = totalWins + totalLosses;
    const winRate = totalWins / total;
    const avgWin = totalWins > 0 ? winProfit / totalWins : 0;
    const avgLoss = totalLosses > 0 ? lossProfit / totalLosses : 0;

    const iterations = 100;
    const nextTrades = 50;
    const currentBalance = account?.current_balance || account?.initial_balance || 10000;
    const ruinThreshold = currentBalance * 0.90; // 10% drop

    let ruinCount = 0;
    const endBalances: number[] = [];
    const allPaths: number[][] = [];

    for (let i = 0; i < iterations; i++) {
      let balance = currentBalance;
      let ruined = false;
      const path = [balance];
      
      for (let j = 0; j < nextTrades; j++) {
        if (Math.random() < winRate) {
          balance += avgWin;
        } else {
          balance -= avgLoss;
        }
        path.push(balance);
        if (balance <= ruinThreshold) {
          ruined = true;
        }
      }
      
      if (ruined) ruinCount++;
      endBalances.push(balance);
      allPaths.push(path);
    }

    // Sort paths by end balance to find Best, Worst, Median
    const sortedIndices = allPaths.map((_, i) => i).sort((a, b) => endBalances[a] - endBalances[b]);
    const worstPath = allPaths[sortedIndices[0]];
    const medianPath = allPaths[sortedIndices[Math.floor(iterations / 2)]];
    const bestPath = allPaths[sortedIndices[iterations - 1]];

    const chartData = [];
    for (let i = 0; i <= nextTrades; i++) {
      chartData.push({
        trade: i,
        worst: worstPath[i],
        median: medianPath[i],
        best: bestPath[i]
      });
    }

    return { 
      data: chartData, 
      riskOfRuin: (ruinCount / iterations) * 100 
    };
  }, [trades, account, isElite]);

  if (!isElite) {
    return (
      <div className="bg-surface border border-default rounded-2xl p-6 shadow-xl w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-surface/80 backdrop-blur-md z-10 flex flex-col items-center justify-center text-center p-6">
          <div className="w-16 h-16 bg-elevated rounded-full flex items-center justify-center border border-default mb-4">
            <i className="las la-lock text-3xl text-secondary"></i>
          </div>
          <h3 className="text-xl font-black text-white mb-2">Monte Carlo Simulator Locked</h3>
          <p className="text-sm text-secondary font-medium mb-6 max-w-sm">
            Upgrade to Elite to unlock 10,000-iteration Risk of Ruin simulations based on your unique edge.
          </p>
          <Link href="/pricing" className="bg-[#a855f7] hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-bold transition-colors">
            Upgrade to Elite
          </Link>
        </div>
        <div className="opacity-20 pointer-events-none blur-sm h-[400px]">
          {/* Mock UI to blur */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Risk of Ruin</h2>
            <div className="text-3xl font-black text-white">X%</div>
          </div>
          <div className="h-[300px] bg-neutral-900 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (trades.length < 5) {
    return (
      <div className="bg-surface border border-default rounded-2xl p-6 shadow-xl w-full h-[400px] flex flex-col items-center justify-center text-center">
        <i className="las la-dice text-6xl text-neutral-800 mb-4"></i>
        <h2 className="text-xl font-bold text-white tracking-tight">Monte Carlo Simulator</h2>
        <p className="text-sm text-muted mt-2">Log at least 5 trades to calculate your edge and run projections.</p>
      </div>
    );
  }

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: account?.currency || 'USD', minimumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="bg-surface border border-default rounded-2xl p-6 shadow-xl w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <i className="las la-dice text-[#a855f7]"></i> Monte Carlo Simulator
          </h2>
          <p className="text-sm text-secondary mt-1">Projecting next 50 trades over 100 simulations.</p>
        </div>
        
        <div className="bg-elevated border border-default px-5 py-3 rounded-xl text-right flex items-center gap-4">
          <div>
            <span className="block text-[10px] uppercase font-bold text-muted tracking-wider">Risk of Ruin</span>
            <span className="block text-[9px] text-secondary">(10% Drawdown)</span>
          </div>
          <span className={`text-3xl font-black ${riskOfRuin > 20 ? 'text-rose-500' : riskOfRuin > 5 ? 'text-amber-500' : 'text-emerald-400'}`}>
            {riskOfRuin.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
            <XAxis dataKey="trade" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} width={80} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#121212', borderColor: '#262626', color: '#fff', borderRadius: '8px' }}
              itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              formatter={(value: any) => formatMoney(Number(value))}
              labelStyle={{ color: '#737373', fontSize: '12px', marginBottom: '4px' }}
            />
            <Line type="monotone" dataKey="best" name="Best Case" stroke="#10b981" strokeWidth={1} dot={false} strokeDasharray="5 5" opacity={0.6} />
            <Line type="monotone" dataKey="worst" name="Worst Case" stroke="#ef4444" strokeWidth={1} dot={false} strokeDasharray="5 5" opacity={0.6} />
            <Line type="monotone" dataKey="median" name="Median Expectancy" stroke="#a855f7" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#a855f7' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
