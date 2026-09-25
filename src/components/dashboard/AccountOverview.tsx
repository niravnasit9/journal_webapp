"use client";

import { useUiStore } from "@/store/useUiStore";
import { AccountDoc, TradeDoc } from "@/lib/firebase/schema";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface AccountOverviewProps {
  account: AccountDoc;
  trades: TradeDoc[];
}

export default function AccountOverview({ account, trades }: AccountOverviewProps) {
  const { activeWorkspace } = useUiStore();
  const isDomestic = activeWorkspace === "DOMESTIC";

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: isDomestic ? 'INR' : 'USD'
    }).format(val);
  };

  // Ensure trades are sorted chronologically for equity curve
  const chronoTrades = [...trades].sort((a, b) => new Date(a.close_time).getTime() - new Date(b.close_time).getTime());

  let currentEquity = account.initial_balance;
  let peakEquity = account.initial_balance;
  let maxDrawdownValue = 0;
  let maxDrawdownPct = 0;

  let totalWins = 0;
  let totalLosses = 0;
  let grossProfit = 0;
  let grossLoss = 0;

  const equityCurve = [{ tradeIndex: 0, label: 'Start', equity: account.initial_balance }];

  chronoTrades.forEach((t, i) => {
    const pnl = isDomestic ? (t.net_pnl || 0) : (t.profit_loss || 0);
    currentEquity += pnl;

    if (pnl > 0) {
      totalWins++;
      grossProfit += pnl;
    } else if (pnl < 0) {
      totalLosses++;
      grossLoss += Math.abs(pnl);
    }

    if (currentEquity > peakEquity) {
      peakEquity = currentEquity;
    }

    const drawdown = peakEquity - currentEquity;
    const drawdownPct = peakEquity > 0 ? (drawdown / peakEquity) * 100 : 0;

    if (drawdown > maxDrawdownValue) maxDrawdownValue = drawdown;
    if (drawdownPct > maxDrawdownPct) maxDrawdownPct = drawdownPct;

    equityCurve.push({
      tradeIndex: i + 1,
      label: new Date(t.close_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      equity: currentEquity
    });
  });

  const totalTrades = totalWins + totalLosses;
  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : (grossProfit > 0 ? 999 : 0);
  const netPnl = currentEquity - account.initial_balance;
  const netPnlPct = account.initial_balance > 0 ? (netPnl / account.initial_balance) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Starting Balance & Current Equity */}
        <div className="lg:col-span-2 premium-card p-6 flex flex-col justify-between border-t-2 border-t-blue-500 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-widest">Starting Balance</p>
              <p className="text-xl font-bold text-slate-600 dark:text-white/70 mt-1">{formatCurrency(account.initial_balance)}</p>
            </div>
            <div className="hidden sm:block h-10 w-[1px] bg-slate-200 dark:bg-white/10 mx-4"></div>
            <div className="sm:text-right">
              <p className="text-xs font-bold text-muted uppercase tracking-widest">Current Equity</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 drop-shadow-md">{formatCurrency(currentEquity)}</p>
            </div>
          </div>
        </div>

        {/* Net PnL */}
        <div className={`premium-card p-6 border-t-2 relative overflow-hidden group ${netPnl >= 0 ? 'border-t-emerald-500' : 'border-t-rose-500'}`}>
          <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${netPnl >= 0 ? 'from-emerald-500/10 to-transparent' : 'from-rose-500/10 to-transparent'}`}></div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-muted uppercase tracking-widest">Net Return</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className={`text-2xl sm:text-3xl font-black drop-shadow-md ${netPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {netPnl > 0 ? '+' : ''}{formatCurrency(netPnl)}
              </p>
            </div>
            <div className="mt-2 inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-surface/50 border border-white/5">
              <i className={`las ${netPnl >= 0 ? 'la-arrow-up text-emerald-600 dark:text-emerald-400' : 'la-arrow-down text-rose-600 dark:text-rose-400'} mr-1`}></i>
              <span className={netPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{Math.abs(netPnlPct).toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="premium-card p-6 border-t-2 border-t-orange-500 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-muted uppercase tracking-widest">Max Drawdown</p>
            <p className="text-2xl sm:text-3xl font-black text-orange-600 dark:text-orange-400 mt-2 drop-shadow-md">
              -{formatCurrency(maxDrawdownValue)}
            </p>
            <div className="mt-2 inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-surface/50 border border-white/5">
              <span className="text-orange-600 dark:text-orange-400">-{maxDrawdownPct.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Equity Curve & Secondary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 premium-card p-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-6">Equity Curve</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                <XAxis dataKey="tradeIndex" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} minTickGap={10} tickFormatter={(val) => val === 0 ? 'Start' : `T${val}`} />
                <YAxis 
                  stroke="var(--text-muted)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                  formatter={(value: any) => [formatCurrency(Number(value || 0)), 'Equity']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0].payload;
                      return data.tradeIndex === 0 ? 'Start' : `Trade #${data.tradeIndex} (${data.label})`;
                    }
                    return label;
                  }}
                  labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="equity" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorEquity)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Extra Stats */}
        <div className="grid grid-rows-3 gap-4">
          <div className="premium-card p-5 flex items-center justify-between group relative overflow-hidden">
             <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="relative z-10">
               <p className="text-xs font-bold text-muted uppercase tracking-widest">Win Rate</p>
               <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{winRate.toFixed(1)}%</p>
             </div>
             <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center relative z-10 text-blue-400">
               <i className="las la-trophy text-2xl"></i>
             </div>
          </div>
          
          <div className="premium-card p-5 flex items-center justify-between group relative overflow-hidden">
             <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="relative z-10">
               <p className="text-xs font-bold text-muted uppercase tracking-widest">Profit Factor</p>
               <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{profitFactor.toFixed(2)}</p>
             </div>
             <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center relative z-10 text-purple-400">
               <i className="las la-balance-scale text-2xl"></i>
             </div>
          </div>

          <div className="premium-card p-5 flex items-center justify-between group relative overflow-hidden">
             <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="relative z-10">
               <p className="text-xs font-bold text-muted uppercase tracking-widest">Total Trades</p>
               <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalTrades}</p>
             </div>
             <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center relative z-10 text-emerald-400">
               <i className="las la-exchange-alt text-2xl"></i>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
