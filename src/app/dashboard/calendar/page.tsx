"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { TradeDoc } from "@/lib/firebase/schema";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useTierTheme } from "@/hooks/useTierTheme";

export default function GlobalCalendarPage() {
  const { user, tier } = useAuth();
  const theme = useTierTheme();
  const [trades, setTrades] = useState<TradeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (user) {
      fetchGlobalTrades();
    }
  }, [user]);

  const fetchGlobalTrades = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const accQuery = query(collection(db, "accounts"), where("owner_uid", "==", user.uid));
      const accSnap = await getDocs(accQuery);
      const accountIds = accSnap.docs.map(doc => doc.id);

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

  trades.forEach(trade => {
    const d = new Date(trade.close_time);
    if (d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()) {
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
    }
  });

  const monthlyWinRate = monthlyTotalTrades > 0 ? (monthlyWins / monthlyTotalTrades) * 100 : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto font-sans">
      
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
          <CalendarIcon className="w-6 h-6 text-yellow-500" />
          Global Calendar Heatmap
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Visualize your combined trading performance across all accounts day by day.</p>
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
              <p className="text-[11px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">Total PnL</p>
              <p className={`text-2xl font-extrabold tracking-tight ${monthlyTotalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {monthlyTotalPnL >= 0 ? '+' : ''}${monthlyTotalPnL.toFixed(2)}
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
                      {pnl > 0 ? '+' : ''}{pnl.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
