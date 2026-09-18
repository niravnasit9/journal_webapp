"use client";

import React, { useState, useMemo } from 'react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TradeDoc } from '@/lib/firebase/schema';

type ChartType = 'Area' | 'Line' | 'Bar';

export const InteractiveEquityCurve: React.FC<{ trades: TradeDoc[], currency: "USD" | "INR", isDomestic?: boolean }> = ({ trades, currency, isDomestic }) => {
  const [chartType, setChartType] = useState<ChartType>('Area');
  const [timeFilter, setTimeFilter] = useState<'All' | '30D' | '90D' | '1Y'>('All');
  const [aggregation, setAggregation] = useState<'Trade' | 'Day'>('Trade');

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

    const chartData: any[] = [];

    if (aggregation === 'Trade') {
      filtered.forEach(t => {
        const net = isDomestic ? ((t as any).net_pnl || 0) : (t.profit_loss - (t.commission || 0));
        runningBalance += net;
        chartData.push({
          date: new Date(t.close_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          fullDate: new Date(t.close_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          netPnl: net,
          balance: runningBalance,
          symbol: t.symbol,
          direction: t.direction,
          strikePrice: (t as any).strike_price,
          optionType: (t as any).option_type,
          isTrade: true
        });
      });
    } else {
      const dailyMap: Record<string, { netPnl: number, count: number, dateStr: string }> = {};
      filtered.forEach(t => {
        const net = isDomestic ? ((t as any).net_pnl || 0) : (t.profit_loss - (t.commission || 0));
        const dateStr = new Date(t.close_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (!dailyMap[dateStr]) dailyMap[dateStr] = { netPnl: 0, count: 0, dateStr };
        dailyMap[dateStr].netPnl += net;
        dailyMap[dateStr].count += 1;
      });
      
      Object.values(dailyMap).forEach(day => {
        runningBalance += day.netPnl;
        chartData.push({
          date: day.dateStr,
          fullDate: day.dateStr,
          netPnl: day.netPnl,
          balance: runningBalance,
          tradesCount: day.count,
          isTrade: false
        });
      });
    }

    if (chartData.length > 0) {
      chartData.unshift({
        date: 'Start',
        fullDate: 'Start',
        netPnl: 0,
        balance: 0,
      });
    }

    return chartData;
  }, [trades, timeFilter, aggregation, isDomestic]);

  if (trades.length === 0) {
    return (
      <div className="bg-surface border border-default rounded-2xl p-6 shadow-xl w-full h-[400px] flex flex-col items-center justify-center">
        <i className="las la-chart-area text-6xl text-neutral-800 mb-4"></i>
        <h2 className="text-xl font-bold text-primary tracking-tight">Equity Curve</h2>
        <p className="text-sm text-muted mt-2">Log trades to visualize your growth.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (data.date === 'Start') return null;

      return (
        <div className="bg-elevated border border-default p-4 rounded-lg shadow-2xl min-w-[180px]">
          <p className="text-xs font-bold text-secondary mb-3 pb-2 border-b border-default">{data.fullDate}</p>
          
          {data.isTrade ? (
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-muted">Trade</span>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${data.direction === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : data.direction === 'SELL' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                {data.direction || 'TRADE'} {data.symbol || 'Instrument'} {data.strikePrice ? `${data.strikePrice} ${data.optionType || ''}` : ''}
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-muted">Total Trades</span>
              <span className="text-xs font-bold text-primary">{data.tradesCount}</span>
            </div>
          )}

          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-muted">Net P/L</span>
            <span className={`text-sm font-black ${data.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              {data.netPnl >= 0 ? '+' : ''}{formatMoney(data.netPnl)}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 mt-2 border-t border-default">
            <span className="text-xs font-medium text-muted">Cumulative</span>
            <span className="text-sm font-black text-[#a855f7]">
              {formatMoney(data.balance)}
            </span>
          </div>
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
            <XAxis dataKey="fullDate" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} tickFormatter={(val) => val ? val.split(',')[0] : ''} />
            <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="balance" stroke="#a855f7" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#a855f7' }} />
          </LineChart>
        );
      case 'Bar':
        return (
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
            <XAxis dataKey="fullDate" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} tickFormatter={(val) => val ? val.split(',')[0] : ''} />
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
            <XAxis dataKey="fullDate" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} tickFormatter={(val) => val ? val.split(',')[0] : ''} />
            <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="balance" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
          </AreaChart>
        );
    }
  };

  return (
    <div className="bg-surface border border-default rounded-2xl p-4 md:p-6 shadow-xl w-full min-w-0 overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary tracking-tight">Equity Curve</h2>
          <p className="text-sm text-secondary mt-1">Cumulative net profit progression.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select 
            className="bg-elevated border border-default text-neutral-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#a855f7]"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
          >
            <option value="All">All Time</option>
            <option value="30D">Last 30 Days</option>
            <option value="90D">Last 90 Days</option>
            <option value="1Y">Last Year</option>
          </select>

          <select 
            className="bg-elevated border border-default text-neutral-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#a855f7]"
            value={aggregation}
            onChange={(e) => setAggregation(e.target.value as any)}
          >
            <option value="Trade">Trade-wise</option>
            <option value="Day">Day-wise</option>
          </select>
          
          <div className="flex items-center bg-elevated border border-default rounded-lg p-1">
            {(['Area', 'Line', 'Bar'] as ChartType[]).map(type => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  chartType === type 
                    ? 'bg-[#a855f7] text-white shadow-lg' 
                    : 'text-muted hover:text-white'
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
