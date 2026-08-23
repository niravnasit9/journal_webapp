"use client";

import React, { useState, useMemo } from 'react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TradeDoc } from '@/lib/firebase/schema';

type ChartType = 'Area' | 'Line' | 'Bar';

export const InteractiveEquityCurve: React.FC<{ trades: TradeDoc[], currency: "USD" | "INR" }> = ({ trades, currency }) => {
  const [chartType, setChartType] = useState<ChartType>('Area');
  const [timeFilter, setTimeFilter] = useState<'All' | '30D' | '90D' | '1Y'>('All');

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(val);
  };

  const data = useMemo(() => {
    let runningBalance = 0;
    const sorted = [...trades].sort((a, b) => new Date(a.close_time).getTime() - new Date(b.close_time).getTime());
    
    let filtered = sorted;
    if (timeFilter !== 'All') {
      const now = new Date();
      let threshold = new Date();
      if (timeFilter === '30D') threshold.setDate(now.getDate() - 30);
      if (timeFilter === '90D') threshold.setDate(now.getDate() - 90);
      if (timeFilter === '1Y') threshold.setFullYear(now.getFullYear() - 1);
      
      filtered = sorted.filter(t => new Date(t.close_time) >= threshold);
    }

    const chartData = filtered.map(t => {
      const net = t.profit_loss - (t.commission || 0);
      runningBalance += net;
      return {
        date: new Date(t.close_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        netPnl: net,
        balance: runningBalance,
      };
    });

    if (chartData.length > 0) {
      chartData.unshift({
        date: 'Start',
        netPnl: 0,
        balance: 0,
      });
    }

    return chartData;
  }, [trades, timeFilter]);

  if (trades.length === 0) {
    return (
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-6 shadow-xl w-full h-[400px] flex flex-col items-center justify-center">
        <i className="las la-chart-area text-6xl text-neutral-800 mb-4"></i>
        <h2 className="text-xl font-bold text-white tracking-tight">Equity Curve</h2>
        <p className="text-sm text-neutral-500 mt-2">Log trades to visualize your growth.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#121212] border border-neutral-800 p-3 rounded-lg shadow-xl">
          <p className="text-xs text-neutral-400 mb-1">{label}</p>
          <p className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#a855f7]"></span>
            {formatMoney(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (chartType) {
      case 'Line':
        return (
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
            <XAxis dataKey="date" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
            <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="balance" stroke="#a855f7" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#a855f7' }} />
          </LineChart>
        );
      case 'Bar':
        return (
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
            <XAxis dataKey="date" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
            <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="balance" fill="#a855f7" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'Area':
      default:
        return (
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
            <XAxis dataKey="date" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
            <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="balance" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
          </AreaChart>
        );
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-6 shadow-xl w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Equity Curve</h2>
          <p className="text-sm text-neutral-400 mt-1">Cumulative net profit progression.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select 
            className="bg-[#121212] border border-neutral-800 text-neutral-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#a855f7]"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
          >
            <option value="All">All Time</option>
            <option value="30D">Last 30 Days</option>
            <option value="90D">Last 90 Days</option>
            <option value="1Y">Last Year</option>
          </select>
          
          <div className="flex items-center bg-[#121212] border border-neutral-800 rounded-lg p-1">
            {(['Area', 'Line', 'Bar'] as ChartType[]).map(type => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  chartType === type 
                    ? 'bg-[#a855f7] text-white shadow-lg' 
                    : 'text-neutral-500 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
