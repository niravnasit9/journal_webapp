"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { TradeDoc } from "@/lib/firebase/schema";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useTierTheme } from "@/hooks/useTierTheme";
import { DEMO_TRADES, DEMO_ACCOUNTS } from "@/lib/adminDemoData";
import { useUiStore } from "@/store/useUiStore";
import MarketSwitcher from "@/components/layout/MarketSwitcher";
import { AccountDoc } from "@/lib/firebase/schema";
import { useRef, memo } from "react";

const CustomEconomicNews = () => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { activeWorkspace } = useUiStore();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/news?market=${activeWorkspace}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to load news");
        }
        
        setNews(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNews();
  }, [activeWorkspace]);

  const getImpactIcon = (impact: string) => {
    const imp = impact?.toLowerCase() || "";
    if (imp === "high") return <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" title="High Impact" />;
    if (imp === "medium") return <div className="w-3 h-3 rounded-full bg-yellow-500" title="Medium Impact" />;
    return <div className="w-3 h-3 rounded-full bg-emerald-500" title="Low Impact" />;
  };

  if (loading) {
    return <div className="w-full h-[300px] rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#111318] flex items-center justify-center mt-6">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (error) {
    return <div className="w-full rounded-2xl border border-red-500/20 bg-red-500/5 mt-6 p-6 text-center">
      <p className="text-red-400 font-bold mb-2">Could not load economic calendar</p>
      <p className="text-sm text-neutral-400">{error}</p>
      <p className="text-xs text-neutral-500 mt-4">Make sure the FMP API Key is set in Admin Settings.</p>
    </div>;
  }

  if (news.length === 0) {
    return <div className="w-full rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#111318] mt-6 p-12 text-center">
      <p className="text-neutral-400">No upcoming news events found for this market.</p>
    </div>;
  }

  return (
    <div className="w-full rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#111318] mt-6 overflow-hidden">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 text-xs font-bold uppercase tracking-widest border-b border-gray-200 dark:border-white/5">
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Country / Cur</th>
              <th className="px-6 py-4">Event</th>
              <th className="px-6 py-4">Impact</th>
              <th className="px-6 py-4 text-right">Actual</th>
              <th className="px-6 py-4 text-right">Estimate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-white/5">
            {news.map((n, i) => (
              <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-mono text-xs">
                  {new Date(n.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-6 py-4 font-bold flex items-center gap-2">
                  <span className="text-xs bg-neutral-200 dark:bg-neutral-800 px-2 py-1 rounded">{n.country}</span>
                  <span>{n.currency}</span>
                </td>
                <td className="px-6 py-4 font-medium max-w-[200px] truncate" title={n.event}>{n.event}</td>
                <td className="px-6 py-4">{getImpactIcon(n.impact)}</td>
                <td className="px-6 py-4 text-right font-mono">{n.actual || "-"}</td>
                <td className="px-6 py-4 text-right font-mono text-neutral-400">{n.estimate || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function CalendarPage() {
  const { user, tier, role } = useAuth();
  const theme = useTierTheme();
  const [trades, setTrades] = useState<TradeDoc[]>([]);
  const [accounts, setAccounts] = useState<AccountDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { activeWorkspace } = useUiStore();
  const isDomestic = activeWorkspace === "DOMESTIC";
  const currencySymbol = isDomestic ? "₹" : "$";

  useEffect(() => {
    if (user) {
      fetchGlobalTrades();
    }
  }, [user, role]);

  const fetchGlobalTrades = async () => {
    if (!user) return;
    try {
      setLoading(true);

      if (role === "admin") {
        setTrades(DEMO_TRADES);
        setAccounts(DEMO_ACCOUNTS);
        setLoading(false);
        return;
      }

      const accQuery = query(collection(db, "accounts"), where("owner_uid", "==", user.uid));
      const accSnap = await getDocs(accQuery);
      const accList = accSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccountDoc));
      setAccounts(accList);
      const accountIds = accList.map(a => a.id);

      if (accountIds.length === 0) {
        setTrades([]);
        setLoading(false);
        return;
      }

      let allTrades: TradeDoc[] = [];
      for (const accId of accountIds) {
        const tQuery = query(collection(db, "trades"), where("account_id", "==", accId));
        const tSnap = await getDocs(tQuery);
        const tDocs = tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradeDoc));
        allTrades = [...allTrades, ...tDocs];
      }
      setTrades(allTrades);
    } catch (error) {
      console.error("Error fetching global trades:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calendar Logic
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const maxMonthsBack = tier === 'elite' || tier === 'pro' ? Infinity : tier === 'starter' ? 3 : 1;
  const today = new Date();
  const monthsDiff = (today.getFullYear() - currentDate.getFullYear()) * 12 + (today.getMonth() - currentDate.getMonth());
  const canGoBack = monthsDiff < maxMonthsBack;

  const prevMonth = () => {
    if (canGoBack) {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      import("react-hot-toast").then(mod => mod.toast.error(`Your ${tier || 'Free'} plan only supports ${maxMonthsBack} month(s) of historical data.`));
    }
  };
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Calculate daily PnL & Stats
  const dailyData: { [day: number]: { pnl: number, trades: number, wins: number } } = {};
  let monthlyTotalPnL = 0;
  let monthlyTotalTrades = 0;
  let monthlyWins = 0;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const filteredTrades = trades.filter(t => {
    const account = accounts.find(a => a.id === t.account_id);
    if (!account) return false;
    const isAccDomestic = account.market_type === "DOMESTIC";
    if (isDomestic && !isAccDomestic) return false;
    if (!isDomestic && isAccDomestic) return false;
    
    const tradeDate = new Date(t.close_time);
    return tradeDate.getFullYear() === year && tradeDate.getMonth() === month;
  });

  filteredTrades.forEach(trade => {
    const d = new Date(trade.close_time);
    const day = d.getDate();
    const net = trade.profit_loss - trade.commission;
    
    if (!dailyData[day]) dailyData[day] = { pnl: 0, trades: 0, wins: 0 };
    
    dailyData[day].pnl += net;
    dailyData[day].trades += 1;
    monthlyTotalTrades += 1;
    monthlyTotalPnL += net;
    
    if (net > 0) {
      dailyData[day].wins += 1;
      monthlyWins += 1;
    }
  });

  const monthlyWinRate = monthlyTotalTrades > 0 ? (monthlyWins / monthlyTotalTrades) * 100 : 0;

return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto font-sans">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-8 h-8 text-warning" />
            Heatmap & News
          </h1>
          <p className="text-secondary text-sm mt-1">Review your trading performance calendar and upcoming macroeconomic events.</p>
        </div>
        <div className="w-full md:w-auto">
          <MarketSwitcher />
        </div>
      </div>

      <div className={`rounded-[24px] border p-8 shadow-2xl transition-all ${theme.card}`}>
        
        {/* Header & Monthly Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-gray-200 dark:border-white/5 pb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={prevMonth} 
              className={`p-2.5 rounded-xl transition-colors shadow-sm ${!canGoBack ? 'opacity-50 bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed' : 'bg-white dark:bg-[#1f2229] hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-white/5'}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white w-48 text-center">{monthName}</h2>
            <button onClick={nextMonth} className="p-2.5 bg-white dark:bg-[#1f2229] hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-white/5 rounded-xl text-gray-700 dark:text-slate-300 transition-colors shadow-sm">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Monthly P/L</p>
              <p className={`text-xl font-black ${monthlyTotalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {monthlyTotalPnL >= 0 ? '+' : ''}{currencySymbol}{Math.abs(monthlyTotalPnL).toLocaleString(isDomestic ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-px h-10 bg-[#e5e7eb] dark:bg-slate-800"></div>
            <div className="text-right">
              <p className="text-[11px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">Win Rate</p>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{monthlyWinRate.toFixed(1)}%</p>
            </div>
            <div className="w-px h-10 bg-[#e5e7eb] dark:bg-slate-800"></div>
            <div className="text-right">
              <p className="text-[11px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">Trades</p>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{monthlyTotalTrades}</p>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-3 md:gap-5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">{day}</div>
          ))}
          
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-28 bg-gray-50/50 dark:bg-white/[0.02] rounded-[16px] border border-gray-100 dark:border-white/5"></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const data = dailyData[day];
            const pnl = data?.pnl;
            
            let bgClass = "bg-gray-50/50 dark:bg-white/[0.02] border-gray-100 dark:border-white/5";
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
                  {data && (
                    <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 bg-[#fafafa] dark:bg-[#0a0f1c]/50 px-2 py-0.5 rounded-full">
                      {data.trades} {data.trades === 1 ? 'Trade' : 'Trades'}
                    </span>
                  )}
                </div>
                
                {pnl !== undefined && (
                  <div className="flex flex-col items-end">
                    <span className={`text-base md:text-lg font-black tracking-tight ${textClass}`}>
                      {pnl > 0 ? '+' : ''}{currencySymbol}{Math.abs(pnl).toLocaleString(isDomestic ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Economic Calendar Section */}
      {/* Custom Economic News API Component */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-primary tracking-tight flex items-center gap-2 mb-2">
          <i className="las la-globe text-2xl text-blue-500"></i>
          {isDomestic ? 'Indian' : 'Global'} Economic Events
        </h2>
        <p className="text-secondary text-sm mb-4">Live macroeconomic data (Upcoming Only)</p>
        <CustomEconomicNews />
      </div>
    </div>
  );
}
