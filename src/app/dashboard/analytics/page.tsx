"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { AccountDoc, TradeDoc } from "@/lib/firebase/schema";
import CustomSelect from "@/components/ui/CustomSelect";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';

export default function GlobalAnalyticsPage() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<TradeDoc[]>([]);
  const [accounts, setAccounts] = useState<AccountDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState("ALL");
  const [chartType, setChartType] = useState<"area" | "line" | "bar">("area");

  useEffect(() => {
    if (user) fetchGlobalTrades();
  }, [user]);

  const fetchGlobalTrades = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const accQuery = query(collection(db, "accounts"), where("owner_uid", "==", user.uid));
      const accSnap = await getDocs(accQuery);
      const accDocs = accSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccountDoc));
      setAccounts(accDocs);

      if (accDocs.length === 0) {
        setTrades([]);
        setLoading(false);
        return;
      }

      let allTrades: TradeDoc[] = [];
      for (const acc of accDocs) {
        const tQuery = query(collection(db, "trades"), where("account_id", "==", acc.id));
        const tSnap = await getDocs(tQuery);
        const tDocs = tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradeDoc));
        allTrades = [...allTrades, ...tDocs];
      }
      
      allTrades.sort((a, b) => new Date(a.close_time).getTime() - new Date(b.close_time).getTime());
      setTrades(allTrades);
    } catch (error) {
      console.error("Error fetching global trades:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter Trades by Account
  const filteredTrades = selectedAccountId === "ALL" 
    ? trades 
    : trades.filter(t => t.account_id === selectedAccountId);

  // Calculate Metrics
  const totalTrades = filteredTrades.length;
  const winningTrades = filteredTrades.filter(t => (t.profit_loss - t.commission) > 0);
  const losingTrades = filteredTrades.filter(t => (t.profit_loss - t.commission) <= 0);
  
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
  
  const grossProfit = winningTrades.reduce((sum, t) => sum + (t.profit_loss - t.commission), 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.profit_loss - t.commission), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0);
  const netPnL = grossProfit - grossLoss;

  // Chart Data
  let runningPnL = 0;
  const chartData = filteredTrades.map((t, idx) => {
    const tradePnL = t.profit_loss - t.commission;
    runningPnL += tradePnL;
    return {
      tradeNumber: idx + 1,
      pnl: runningPnL,
      tradePnL: tradePnL, // For bar chart
      isProfitable: runningPnL >= 0,
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto font-sans">
      
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
          <i className="las la-chart-bar text-3xl text-yellow-500"></i>
          Analytics Overview
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Advanced statistics and performance metrics.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-yellow-200 dark:border-slate-800">
          <div className="flex items-center gap-3 text-gray-500 dark:text-slate-400 font-bold text-sm mb-2 uppercase tracking-wider">
            <i className="las la-chart-pie text-[16px] text-blue-500"></i> Total PnL
          </div>
          <p className={`text-3xl font-extrabold ${netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${netPnL.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-yellow-200 dark:border-slate-800">
          <div className="flex items-center gap-3 text-gray-500 dark:text-slate-400 font-bold text-sm mb-2 uppercase tracking-wider">
            <i className="las la-bullseye text-[16px] text-emerald-500"></i> Win Rate
          </div>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{winRate.toFixed(1)}%</p>
        </div>

        <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-yellow-200 dark:border-slate-800">
          <div className="flex items-center gap-3 text-gray-500 dark:text-slate-400 font-bold text-sm mb-2 uppercase tracking-wider">
            <i className="las la-chart-line text-[16px] text-yellow-500"></i> Profit Factor
          </div>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{profitFactor.toFixed(2)}</p>
        </div>

        <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-yellow-200 dark:border-slate-800">
          <div className="flex items-center gap-3 text-gray-500 dark:text-slate-400 font-bold text-sm mb-2 uppercase tracking-wider">
            <i className="las la-book-open text-[16px] text-purple-500"></i> Total Trades
          </div>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{totalTrades}</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-[#111318] border border-yellow-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider">Equity Curve</h3>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-48">
              <CustomSelect 
                options={[
                  { value: "ALL", label: "All Accounts" },
                  ...accounts.map(acc => ({ value: acc.id, label: acc.label }))
                ]}
                value={selectedAccountId}
                onChange={setSelectedAccountId}
                icon="las la-wallet"
              />
            </div>
            <div className="flex bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-200 dark:border-slate-800 rounded-lg p-1">
              {(["area", "line", "bar"] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${chartType === type ? 'bg-yellow-500 text-black' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:text-white'}`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-[250px] md:h-[400px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2229" vertical={false} />
                  <XAxis 
                    dataKey="tradeNumber" 
                    stroke="#475569" 
                    tick={{fill: '#475569', fontSize: 10}}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#475569" 
                    tick={{fill: '#475569', fontSize: 10}}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f1115', borderColor: '#1f2229', borderRadius: '8px', color: '#fff', fontWeight: 'bold' }}
                    itemStyle={{ color: '#eab308' }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Trade PnL'] as any}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <ReferenceLine y={0} stroke="#334155" strokeDasharray="3 3" />
                  <Bar dataKey="tradePnL">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.tradePnL >= 0 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              ) : chartType === 'area' ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2229" vertical={false} />
                  <XAxis 
                    dataKey="tradeNumber" 
                    stroke="#475569" 
                    tick={{fill: '#475569', fontSize: 10}}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#475569" 
                    tick={{fill: '#475569', fontSize: 10}}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f1115', borderColor: '#1f2229', borderRadius: '8px', color: '#fff', fontWeight: 'bold' }}
                    itemStyle={{ color: '#eab308' }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Net PnL'] as any}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <ReferenceLine y={0} stroke="#334155" strokeDasharray="3 3" />
                  <Area 
                    type="monotone" 
                    dataKey="pnl" 
                    stroke="#eab308" 
                    fillOpacity={1} 
                    fill="url(#colorPnL)"
                    strokeWidth={3}
                  />
                </AreaChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2229" vertical={false} />
                  <XAxis 
                    dataKey="tradeNumber" 
                    stroke="#475569" 
                    tick={{fill: '#475569', fontSize: 10}}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#475569" 
                    tick={{fill: '#475569', fontSize: 10}}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f1115', borderColor: '#1f2229', borderRadius: '8px', color: '#fff', fontWeight: 'bold' }}
                    itemStyle={{ color: '#eab308' }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Net PnL'] as any}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <ReferenceLine y={0} stroke="#334155" strokeDasharray="3 3" />
                  <Line 
                    type="monotone" 
                    dataKey="pnl" 
                    stroke="#eab308" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: '#eab308', stroke: '#0f1115', strokeWidth: 2 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 font-bold border-2 border-dashed border-yellow-200 dark:border-slate-800 rounded-xl">
              <i className="las la-chart-area text-4xl mb-2 text-slate-700"></i>
              Not enough data to plot equity curve.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
