"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/lib/firebase/authContext";
import { AccountDoc, TradeDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import PnLChart from "@/components/PnLChart";
import TradeJournal from "@/components/TradeJournal";
import AddTradeModal from "@/components/AddTradeModal";
import EditTradeModal from "@/components/EditTradeModal";
import toast from "react-hot-toast";

type TabType = "Account Overview" | "Trading Overview" | "Trading History" | "Calendar";

export default function AccountDetailView() {
  const { id } = useParams();
  const accountId = id as string;
  const { user } = useAuth();
  const router = useRouter();

  const [account, setAccount] = useState<AccountDoc | null>(null);
  const [trades, setTrades] = useState<TradeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  const [activeTab, setActiveTab] = useState<TabType>("Account Overview");
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<TradeDoc | null>(null);
  const [tradeToDelete, setTradeToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      const accRef = doc(db, "accounts", accountId);
      const accSnap = await getDoc(accRef);
      if (accSnap.exists()) {
        setAccount({ id: accSnap.id, ...accSnap.data() } as AccountDoc);
      } else {
        console.error("No such account!");
        router.push("/dashboard");
        return;
      }

      const q = query(collection(db, "trades"), where("account_id", "==", accountId));
      const querySnapshot = await getDocs(q);
      const fetchedTrades = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradeDoc));
      
      fetchedTrades.sort((a, b) => new Date(b.close_time).getTime() - new Date(a.close_time).getTime());
      setTrades(fetchedTrades);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accountId]);

  const handleDeleteTrade = (tradeId: string) => {
    setTradeToDelete(tradeId);
  };

  const confirmDeleteTrade = async () => {
    if (!tradeToDelete) return;
    setIsDeleting(true);
    
    try {
      const { deleteManualTradeAction } = await import("@/app/actions/tradeActions");
      const res = await deleteManualTradeAction(tradeToDelete, accountId);
      
      if (res.success) {
        toast.success("Trade deleted successfully");
        fetchData();
      } else {
        toast.error("Failed to delete trade: " + res.error);
      }
    } catch (error: any) {
      toast.error("Error deleting trade: " + error.message);
    } finally {
      setIsDeleting(false);
      setTradeToDelete(null);
    }
  };

  const handleEditTrade = (trade: TradeDoc) => {
    setTradeToEdit(trade);
    setIsEditModalOpen(true);
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><LoadingSpinner className="w-10 h-10" /></div>;
  }
  if (!account) {
    return <div className="text-rose-500 p-8">Account not found</div>;
  }

  const initialBalance = account.initial_balance || 0;
  const totalTrades = trades.length;
  const overallPnL = trades.reduce((acc, trade) => acc + (trade.profit_loss - (trade.commission || 0)), 0);
  const currentBalance = initialBalance + overallPnL;
  
  let runningBalance = initialBalance;
  const chronologicalTrades = [...trades].sort((a, b) => new Date(a.close_time).getTime() - new Date(b.close_time).getTime());
  const equityData = chronologicalTrades.map(trade => {
    runningBalance += (trade.profit_loss - (trade.commission || 0));
    return {
      date: new Date(trade.close_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      balance: runningBalance,
      equity: runningBalance,
    };
  });
  
  if (equityData.length > 0) {
    equityData.unshift({
      date: 'Start',
      balance: initialBalance,
      equity: initialBalance
    });
  }

  // Advanced Statistics Calculations
  const winningTrades = trades.filter(t => (t.profit_loss - (t.commission || 0)) > 0);
  const losingTrades = trades.filter(t => (t.profit_loss - (t.commission || 0)) <= 0);
  
  const avgWinningTrade = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + (t.profit_loss - (t.commission || 0)), 0) / winningTrades.length : 0;
  const avgLosingTrade = losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + (t.profit_loss - (t.commission || 0)), 0) / losingTrades.length : 0;
  const avgTradePnL = totalTrades > 0 ? overallPnL / totalTrades : 0;

  const avgRR = totalTrades === 0 ? 0 : (avgLosingTrade !== 0 ? Math.abs(avgWinningTrade / avgLosingTrade) : (avgWinningTrade > 0 ? avgWinningTrade : 0));
  
  const grossProfit = winningTrades.reduce((sum, t) => sum + (t.profit_loss - (t.commission || 0)), 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.profit_loss - (t.commission || 0)), 0));
  const profitFactor = totalTrades === 0 ? 0 : (grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0));

  const totalCommissions = trades.reduce((sum, t) => sum + (t.commission || 0), 0);
  const totalVolume = trades.reduce((sum, t) => sum + (t.lot_size || 0), 0);

  // Group by day for daily stats
  const dailyPnL: Record<string, number> = {};
  trades.forEach(t => {
    const dateStr = new Date(t.close_time).toISOString().split('T')[0];
    dailyPnL[dateStr] = (dailyPnL[dateStr] || 0) + (t.profit_loss - (t.commission || 0));
  });
  
  const tradingDaysCount = Object.keys(dailyPnL).length;
  const avgDailyPnL = tradingDaysCount > 0 ? overallPnL / tradingDaysCount : 0;
  
  const winningDays = Object.values(dailyPnL).filter(pnl => pnl > 0);
  const losingDays = Object.values(dailyPnL).filter(pnl => pnl <= 0);
  
  const avgWinningDay = winningDays.length > 0 ? winningDays.reduce((a,b) => a+b, 0) / winningDays.length : 0;
  const avgLosingDay = losingDays.length > 0 ? losingDays.reduce((a,b) => a+b, 0) / losingDays.length : 0;

  const TABS: TabType[] = ["Account Overview", "Trading Overview", "Trading History", "Calendar"];

  // Helper component for stat rows
  const StatRow = ({ label, value, isCurrency = false, colorClass = "text-gray-900 dark:text-white" }: { label: string, value: string | number, isCurrency?: boolean, colorClass?: string }) => (
    <div className="flex justify-between items-center py-3 border-b border-yellow-200 dark:border-slate-800/50 last:border-0">
      <span className="text-gray-500 dark:text-slate-400 text-sm">{label}</span>
      <span className={`text-sm font-bold ${colorClass}`}>
        {isCurrency && typeof value === 'number' && value < 0 ? '-' : ''}
        {isCurrency ? (account.currency === "INR" ? "₹" : "$") : ''}
        {isCurrency ? Math.abs(Number(value)).toFixed(2) : value}
      </span>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#111827] p-6 rounded-2xl border border-yellow-200 dark:border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#e5e7eb] dark:bg-slate-800 flex items-center justify-center shrink-0 border border-yellow-300 dark:border-slate-700">
            <span className="text-gray-500 dark:text-slate-400 font-bold text-xl">{account.label[0]}</span>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              {account.label}
            </h1>
            <span className="inline-block mt-1 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {account.account_type}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-bold rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all"
          >
            <i className="las la-plus text-[16px]"></i>
            Add Trade
          </button>
          <AddTradeModal 
            isOpen={isAddModalOpen} 
            onClose={() => setIsAddModalOpen(false)} 
            accountId={accountId} 
            accountCurrency={account.currency as "USD" | "INR"}
            onAdded={fetchData} 
          />

          <EditTradeModal 
            isOpen={isEditModalOpen} 
            onClose={() => { setIsEditModalOpen(false); setTradeToEdit(null); }} 
            accountId={accountId}
            trade={tradeToEdit}
            accountCurrency={account.currency as "USD" | "INR"}
            onUpdated={fetchData} 
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-yellow-200 dark:border-slate-800 pb-4">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
              activeTab === tab 
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
                : 'bg-white dark:bg-[#111827] text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white border border-yellow-200 dark:border-slate-800 hover:border-yellow-300 dark:border-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
        
        <div className="ml-auto flex items-center gap-2">
          <button 
            onClick={() => setIsCredentialsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#111827] text-gray-700 dark:text-slate-300 text-sm font-bold rounded-full border border-yellow-200 dark:border-slate-800 hover:border-yellow-300 dark:border-slate-700 transition-colors"
          >
            <i className="las la-key text-[16px]"></i> Credentials
          </button>
        </div>
      </div>

      {/* Tab Content Rendering */}
      {activeTab === "Trading Overview" && (
        <div className="space-y-6">
          
          {/* Main Top Metrics (Net P&L, RR, Win Rate, Profit Factor) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-yellow-200 dark:border-slate-800 shadow-xl relative overflow-hidden group hover:border-yellow-300 dark:border-slate-700 transition-colors">
              <h3 className="text-xs text-gray-500 dark:text-slate-400 font-bold tracking-wide uppercase mb-3">Net P&L</h3>
              <p className={`text-3xl font-extrabold tracking-tight ${overallPnL >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                {overallPnL >= 0 ? '+' : ''}{account.currency === "INR" ? "₹" : "$"}{Math.abs(overallPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-yellow-200 dark:border-slate-800 shadow-xl relative overflow-hidden group hover:border-yellow-300 dark:border-slate-700 transition-colors">
              <h3 className="text-xs text-gray-500 dark:text-slate-400 font-bold tracking-wide uppercase mb-3">Average Realized R:R</h3>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {totalTrades === 0 ? "--" : avgRR.toFixed(2)}
              </p>
              <div className="w-full bg-[#e5e7eb] dark:bg-slate-800 h-1.5 rounded-full mt-4">
                <div className={`h-1.5 rounded-full ${totalTrades === 0 ? 'bg-slate-700 w-0' : (avgRR >= 1 ? 'bg-emerald-400 w-2/3' : 'bg-rose-500 w-1/3')}`}></div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-yellow-200 dark:border-slate-800 shadow-xl relative overflow-hidden group hover:border-yellow-300 dark:border-slate-700 transition-colors">
              <h3 className="text-xs text-gray-500 dark:text-slate-400 font-bold tracking-wide uppercase mb-3">Win Rate</h3>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {totalTrades > 0 ? ((winningTrades.length / totalTrades) * 100).toFixed(0) : "--"}%
              </p>
            </div>

            <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-yellow-200 dark:border-slate-800 shadow-xl relative overflow-hidden group hover:border-yellow-300 dark:border-slate-700 transition-colors">
              <h3 className="text-xs text-gray-500 dark:text-slate-400 font-bold tracking-wide uppercase mb-3">Profit Factor</h3>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {totalTrades === 0 ? "--" : profitFactor.toFixed(2)}
              </p>
            </div>
          </div>

          {/* GFT 4-Column Detailed Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            
            {/* P&L Statistics */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-yellow-200 dark:border-slate-800 p-6 shadow-xl">
              <h3 className="text-gray-900 dark:text-white font-bold mb-4">P&L Statistics</h3>
              <div className="space-y-1">
                <StatRow label="Avg Daily P&L" value={avgDailyPnL} isCurrency colorClass={avgDailyPnL >= 0 ? "text-emerald-400" : "text-rose-500"} />
                <StatRow label="Avg Trade P&L" value={avgTradePnL} isCurrency colorClass={avgTradePnL >= 0 ? "text-emerald-400" : "text-rose-500"} />
                <StatRow label="Avg Winning Trade" value={avgWinningTrade} isCurrency colorClass="text-emerald-400" />
                <StatRow label="Avg Losing Trade" value={avgLosingTrade} isCurrency colorClass="text-rose-500" />
                <StatRow label="Avg Winning Day" value={avgWinningDay} isCurrency colorClass="text-emerald-400" />
                <StatRow label="Avg Losing Day" value={avgLosingDay} isCurrency colorClass="text-rose-500" />
              </div>
            </div>

            {/* Trading Activity */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-yellow-200 dark:border-slate-800 p-6 shadow-xl">
              <h3 className="text-gray-900 dark:text-white font-bold mb-4">Trading Activity</h3>
              <div className="space-y-1">
                <StatRow label="Total Trades" value={totalTrades} />
                <StatRow label="Winning Trades" value={winningTrades.length} colorClass="text-emerald-400" />
                <StatRow label="Losing Trades" value={losingTrades.length} colorClass="text-rose-500" />
                <StatRow label="Open Trades" value={0} />
                <StatRow label="Trading Days" value={tradingDaysCount} />
                <StatRow label="Avg Daily Volume" value={tradingDaysCount > 0 ? (totalVolume / tradingDaysCount).toFixed(2) : "0"} />
              </div>
            </div>

            {/* Streaks & Patterns */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-yellow-200 dark:border-slate-800 p-6 shadow-xl">
              <h3 className="text-gray-900 dark:text-white font-bold mb-4">Streaks & Patterns</h3>
              <div className="space-y-1">
                <StatRow label="Max Win Streak" value={0} colorClass="text-emerald-400" />
                <StatRow label="Max Loss Streak" value={0} colorClass="text-rose-500" />
                <StatRow label="Max Winning Days" value={0} colorClass="text-emerald-400" />
                <StatRow label="Max Losing Days" value={0} colorClass="text-rose-500" />
              </div>
            </div>

            {/* Costs & Fees */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-yellow-200 dark:border-slate-800 p-6 shadow-xl">
              <h3 className="text-gray-900 dark:text-white font-bold mb-4">Costs & Fees</h3>
              <div className="space-y-1">
                <StatRow label="Total Commissions" value={-totalCommissions} isCurrency colorClass="text-rose-500" />
                <StatRow label="Total Swap" value={0} isCurrency colorClass="text-rose-500" />
              </div>
            </div>

          </div>

          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-yellow-200 dark:border-slate-800 p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Daily Net Cumulative P&L</h2>
            <PnLChart data={equityData} />
          </div>
        </div>
      )}

      {activeTab === "Trading History" && (
        <TradeJournal trades={trades} onDeleteTrade={handleDeleteTrade} onEditTrade={handleEditTrade} />
      )}

      {/* Calendar Tab */}
      {activeTab === "Calendar" && (
        <div className="bg-white dark:bg-[#111318] rounded-[24px] border border-yellow-200 dark:border-slate-800 p-8 shadow-2xl mt-6">
          
          {/* Header & Monthly Stats */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-yellow-200 dark:border-slate-800/50 pb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))} className="p-2.5 bg-white dark:bg-[#1f2229] hover:bg-slate-700 rounded-xl text-gray-700 dark:text-slate-300 transition-colors shadow-sm">
                <i className="las la-angle-left text-xl"></i>
              </button>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white w-48 text-center">
                {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))} className="p-2.5 bg-white dark:bg-[#1f2229] hover:bg-slate-700 rounded-xl text-gray-700 dark:text-slate-300 transition-colors shadow-sm">
                <i className="las la-angle-right text-xl"></i>
              </button>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[11px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">Monthly PnL</p>
                <p className={`text-2xl font-extrabold tracking-tight ${Object.entries(dailyPnL).filter(([dateStr]) => {
                  const [y, m] = dateStr.split('-');
                  return parseInt(y) === calendarDate.getFullYear() && parseInt(m) - 1 === calendarDate.getMonth();
                }).reduce((sum, [_, pnl]) => sum + pnl, 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {Object.entries(dailyPnL).filter(([dateStr]) => {
                  const [y, m] = dateStr.split('-');
                  return parseInt(y) === calendarDate.getFullYear() && parseInt(m) - 1 === calendarDate.getMonth();
                }).reduce((sum, [_, pnl]) => sum + pnl, 0) >= 0 ? '+' : '-'}
                  ${Math.abs(Object.entries(dailyPnL).filter(([dateStr]) => {
                  const [y, m] = dateStr.split('-');
                  return parseInt(y) === calendarDate.getFullYear() && parseInt(m) - 1 === calendarDate.getMonth();
                }).reduce((sum, [_, pnl]) => sum + pnl, 0)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-3 md:gap-5">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">{day}</div>
            ))}
            
            {Array.from({ length: new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="h-28 bg-[#fafafa] dark:bg-[#0a0f1c]/30 rounded-[16px] border border-yellow-200 dark:border-slate-800/20"></div>
            ))}

            {Array.from({ length: new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
              const day = i + 1;
              // Format date string to match dailyPnL keys (YYYY-MM-DD)
              const dateStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const pnl = dailyPnL[dateStr];
              
              let bgClass = "bg-gray-50/50 dark:bg-[#111318] border-gray-200 dark:border-slate-800/50";
              let textClass = "text-gray-400 dark:text-slate-600";

              if (pnl !== undefined) {
                if (pnl > 0) {
                  bgClass = "bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]";
                  textClass = "text-emerald-400";
                } else if (pnl < 0) {
                  bgClass = "bg-rose-950/20 border-rose-500/40 hover:border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.05)] hover:shadow-[0_0_20px_rgba(244,63,94,0.1)]";
                  textClass = "text-rose-400";
                }
              }

              return (
                <div key={day} className={`h-28 rounded-[16px] border p-3 flex flex-col justify-between transition-all group ${bgClass}`}>
                  <div className="flex justify-between items-start">
                    <span className={`text-sm font-bold ${pnl !== undefined ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-500'}`}>{day}</span>
                  </div>
                  
                  {pnl !== undefined && (
                    <div className="flex flex-col items-end">
                      <span className={`text-base md:text-lg font-black tracking-tight ${textClass}`}>
                        {pnl > 0 ? '+' : ''}{pnl.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Account Overview Tab */}
      {activeTab === "Account Overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-yellow-200 dark:border-slate-800 p-6 shadow-xl flex flex-col justify-center items-center text-center">
               <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
                <i className="las la-wallet text-4xl text-blue-500"></i>
               </div>
               <h3 className="text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Total Equity</h3>
               <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                 {account.currency === "INR" ? "₹" : "$"}{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </p>
               <div className="mt-4 px-4 py-1.5 bg-[#fafafa] dark:bg-[#0a0f1c] rounded-full border border-yellow-200 dark:border-slate-800 text-sm font-bold text-gray-700 dark:text-slate-300">
                 Started at {account.currency === "INR" ? "₹" : "$"}{initialBalance.toLocaleString()}
               </div>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-yellow-200 dark:border-slate-800 p-6 shadow-xl flex flex-col justify-center items-center text-center">
               <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4 border border-yellow-500/20">
                <i className="las la-chart-line text-4xl text-yellow-500"></i>
               </div>
               <h3 className="text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Total Return</h3>
               <p className={`text-4xl font-black tracking-tight ${overallPnL >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                 {overallPnL >= 0 ? '+' : ''}{((overallPnL / initialBalance) * 100).toFixed(2)}%
               </p>
               <div className="mt-4 px-4 py-1.5 bg-[#fafafa] dark:bg-[#0a0f1c] rounded-full border border-yellow-200 dark:border-slate-800 text-sm font-bold text-gray-700 dark:text-slate-300">
                 {overallPnL >= 0 ? '+' : ''}{account.currency === "INR" ? "₹" : "$"}{Math.abs(overallPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Profit
               </div>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-yellow-200 dark:border-slate-800 p-6 shadow-xl flex flex-col justify-center items-center text-center">
               <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/20">
                <i className="las la-chart-pie text-4xl text-purple-500"></i>
               </div>
               <h3 className="text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Trade Frequency</h3>
               <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                 {totalTrades} <span className="text-xl text-gray-400 dark:text-slate-500">trades</span>
               </p>
               <div className="mt-4 px-4 py-1.5 bg-[#fafafa] dark:bg-[#0a0f1c] rounded-full border border-yellow-200 dark:border-slate-800 text-sm font-bold text-gray-700 dark:text-slate-300">
                 {tradingDaysCount} Active Days
               </div>
            </div>

          </div>

          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-yellow-200 dark:border-slate-800 p-6 shadow-xl">
             <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-6">Recent Activity</h2>
             <TradeJournal trades={trades.slice(0, 5)} onDeleteTrade={handleDeleteTrade} onEditTrade={handleEditTrade} />
          </div>
        </div>
      )}

      <AddTradeModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        accountId={accountId} 
        accountCurrency={account.currency as "USD" | "INR"}
        onAdded={fetchData} 
      />

      <EditTradeModal 
        isOpen={isEditModalOpen} 
        onClose={() => { setIsEditModalOpen(false); setTradeToEdit(null); }} 
        accountId={accountId}
        trade={tradeToEdit}
        accountCurrency={account.currency as "USD" | "INR"}
        onUpdated={fetchData} 
      />

      {tradeToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#f0f0f0] dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => !isDeleting && setTradeToDelete(null)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#111827] border border-yellow-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                <i className="las la-trash-alt text-4xl text-rose-500"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Trade?</h2>
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">Are you sure you want to delete this trade? This action cannot be undone.</p>
              
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setTradeToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-xl bg-[#e5e7eb] dark:bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={confirmDeleteTrade}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-600/50 text-gray-900 dark:text-white text-sm font-bold rounded-xl transition shadow-[0_0_15px_rgba(225,29,72,0.2)]"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {isCredentialsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#f0f0f0]/90 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setIsCredentialsModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-[#111827] border border-yellow-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
            <div className="p-6 border-b border-yellow-200 dark:border-slate-800/50 flex justify-between items-center bg-gray-50 dark:bg-gray-950">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <i className="las la-key text-yellow-500 text-2xl"></i> Account Credentials
              </h2>
              <button 
                onClick={() => setIsCredentialsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#e5e7eb] dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <i className="las la-times"></i>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-1.5">MetaTrader 5 Login</label>
                <div className="w-full bg-gray-50 dark:bg-[#0a0f1c] border border-yellow-300 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-mono font-bold flex justify-between items-center group">
                  <span>{account.mt5_login || "Not provided"}</span>
                  {account.mt5_login && (
                    <button onClick={() => { navigator.clipboard.writeText(account.mt5_login!); toast.success("Copied!"); }} className="text-gray-400 dark:text-slate-500 hover:text-blue-500 transition-colors">
                      <i className="las la-copy text-lg"></i>
                    </button>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-1.5">MetaTrader 5 Server</label>
                <div className="w-full bg-gray-50 dark:bg-[#0a0f1c] border border-yellow-300 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-mono font-bold flex justify-between items-center group">
                  <span>{account.mt5_server || "Not provided"}</span>
                  {account.mt5_server && (
                    <button onClick={() => { navigator.clipboard.writeText(account.mt5_server!); toast.success("Copied!"); }} className="text-gray-400 dark:text-slate-500 hover:text-blue-500 transition-colors">
                      <i className="las la-copy text-lg"></i>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-1.5">Investor Password</label>
                <div className="w-full bg-gray-50 dark:bg-[#0a0f1c] border border-yellow-300 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-mono font-bold flex justify-between items-center group">
                  <span>{account.investor_password ? "••••••••" : "Not provided"}</span>
                  {account.investor_password && (
                    <button onClick={() => { navigator.clipboard.writeText(account.investor_password!); toast.success("Copied!"); }} className="text-gray-400 dark:text-slate-500 hover:text-blue-500 transition-colors">
                      <i className="las la-copy text-lg"></i>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="pt-4 flex justify-end">
                <button 
                  onClick={() => setIsCredentialsModalOpen(false)}
                  className="px-6 py-2.5 bg-[#e5e7eb] dark:bg-slate-800 hover:bg-slate-700 text-gray-700 dark:text-white font-bold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
