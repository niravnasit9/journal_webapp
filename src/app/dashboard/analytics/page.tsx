"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/lib/firebase/authContext";
import { AccountDoc, TradeDoc } from "@/lib/firebase/schema";
import { useDemo } from "@/lib/demoContext";
import { DEMO_ACCOUNTS, generateTradesForAccount } from "@/lib/adminDemoData";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { InteractiveEquityCurve } from "@/components/analytics/InteractiveEquityCurve";
import { AdvancedMetrics } from "@/components/analytics/AdvancedMetrics";
import { MaeMfeScatter } from "@/components/analytics/MaeMfeScatter";
import { MonteCarloSimulator } from "@/components/analytics/MonteCarloSimulator";
import { DrawdownProfile } from "@/components/analytics/DrawdownProfile";
import { SessionHeatmap } from "@/components/analytics/SessionHeatmap";
import { VolumeCorrelation } from "@/components/analytics/VolumeCorrelation";
import { useUiStore } from "@/store/useUiStore";
import MarketSwitcher from "@/components/layout/MarketSwitcher";

export default function AnalyticsOverview() {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const router = useRouter();

  const [accounts, setAccounts] = useState<AccountDoc[]>([]);
  const [allTrades, setAllTrades] = useState<TradeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("ALL");
  const { activeWorkspace } = useUiStore();
  const isDomestic = activeWorkspace === "DOMESTIC";
  const currencySymbol = isDomestic ? "₹" : "$";

  useEffect(() => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        if (isDemoMode) {
          setAccounts(DEMO_ACCOUNTS);
          const demoTrades: TradeDoc[] = [];
          for (const acc of DEMO_ACCOUNTS) {
            demoTrades.push(...generateTradesForAccount(acc.id, 0, 30, 0.55, 1.0));
          }
          setAllTrades(demoTrades);
          return;
        }

        // 1. Fetch Accounts
        const accQ = query(collection(db, "accounts"), where("owner_uid", "==", user.uid));
        const accSnap = await getDocs(accQ);
        const fetchedAccounts = accSnap.docs.map(d => ({ id: d.id, ...d.data() } as AccountDoc));
        setAccounts(fetchedAccounts);

        // 2. Fetch Trades for these accounts
        const fetchedTrades: TradeDoc[] = [];
        for (const acc of fetchedAccounts) {
          const tQ = query(collection(db, "trades"), where("account_id", "==", acc.id));
          const tSnap = await getDocs(tQ);
          fetchedTrades.push(...tSnap.docs.map(d => ({ id: d.id, ...d.data() } as TradeDoc)));
        }
        setAllTrades(fetchedTrades);

      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router, isDemoMode]);

  const workspaceTrades = useMemo(() => {
    return allTrades.filter(t => {
      const acc = accounts.find(a => a.id === t.account_id);
      if (!acc) return false;
      return (isDomestic && acc.market_type === "DOMESTIC") || (!isDomestic && acc.market_type !== "DOMESTIC");
    });
  }, [allTrades, accounts, isDomestic]);

  const activeTrades = useMemo(() => {
    if (selectedAccountId === "ALL") return workspaceTrades;
    return workspaceTrades.filter(t => t.account_id === selectedAccountId);
  }, [workspaceTrades, selectedAccountId]);

  const workspaceAccounts = useMemo(() => {
    return accounts.filter(a => 
      (isDomestic && a.market_type === "DOMESTIC") || 
      (!isDomestic && a.market_type !== "DOMESTIC")
    );
  }, [accounts, isDomestic]);

  const activeAccount = useMemo(() => {
    if (selectedAccountId !== "ALL") {
      return workspaceAccounts.find(a => a.id === selectedAccountId) || workspaceAccounts[0];
    }
    // Mock aggregated account for Monte Carlo base balance if "ALL" is selected
    const totalBalance = workspaceAccounts.reduce((sum, a) => sum + (a.initial_balance || 0), 0);
    return {
      id: "ALL",
      owner_uid: user?.uid || "",
      label: `All ${isDomestic ? 'Domestic' : 'Global'} Accounts`,
      broker: "Aggregated",
      account_type: "Aggregated",
      currency: isDomestic ? "INR" : "USD",
      initial_balance: totalBalance,
      current_balance: totalBalance,
      created_at: new Date()
    } as AccountDoc;
  }, [accounts, selectedAccountId, user]);

  const { totalPnl, winRate, profitFactor, totalTrades } = useMemo(() => {
    let wins = 0;
    let winProfit = 0;
    let losses = 0;
    let lossProfit = 0;
    let pnl = 0;

    activeTrades.forEach(t => {
      const net = t.profit_loss - (t.commission || 0);
      pnl += net;
      if (net > 0) {
        wins++;
        winProfit += net;
      } else {
        losses++;
        lossProfit += Math.abs(net);
      }
    });

    const total = wins + losses;
    const wr = total > 0 ? (wins / total) * 100 : 0;
    const pf = lossProfit > 0 ? winProfit / lossProfit : (winProfit > 0 ? 99 : 0);

    return {
      totalPnl: pnl,
      winRate: wr,
      profitFactor: pf,
      totalTrades: total
    };
  }, [activeTrades]);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat(isDomestic ? 'en-IN' : 'en-US', { 
      style: 'currency', 
      currency: isDomestic ? 'INR' : 'USD', 
      minimumFractionDigits: 2 
    }).format(Math.abs(val));
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><LoadingSpinner className="w-10 h-10" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in font-sans">
      
      {/* Header & Account Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <i className="las la-chart-bar text-[#a855f7]"></i> Analytics Overview
          </h1>
          <p className="text-secondary mt-1">Deep institutional-grade analysis of your {isDomestic ? 'domestic' : 'global'} trading edge.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <MarketSwitcher />
          <select 
            className="bg-elevated border border-default text-white font-medium rounded-xl px-4 py-3 outline-none focus:border-[#a855f7] min-w-[200px]"
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
          >
            <option value="ALL">All {isDomestic ? 'Domestic' : 'Global'} Accounts</option>
            {workspaceAccounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-surface border border-default p-5 rounded-2xl shadow-xl">
          <span className="block text-[10px] uppercase font-bold text-muted tracking-wider mb-2">Total P&L</span>
          <span className={`text-2xl md:text-3xl font-black ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
            {totalPnl >= 0 ? '+' : '-'}{formatMoney(totalPnl)}
          </span>
        </div>
        <div className="bg-surface border border-default p-5 rounded-2xl shadow-xl">
          <span className="block text-[10px] uppercase font-bold text-muted tracking-wider mb-2">Win Rate</span>
          <span className="text-2xl md:text-3xl font-black text-white">
            {winRate.toFixed(1)}%
          </span>
        </div>
        <div className="bg-surface border border-default p-5 rounded-2xl shadow-xl">
          <span className="block text-[10px] uppercase font-bold text-muted tracking-wider mb-2">Profit Factor</span>
          <span className={`text-2xl md:text-3xl font-black ${profitFactor >= 1.5 ? 'text-[#a855f7]' : 'text-white'}`}>
            {profitFactor.toFixed(2)}
          </span>
        </div>
        <div className="bg-surface border border-default p-5 rounded-2xl shadow-xl">
          <span className="block text-[10px] uppercase font-bold text-muted tracking-wider mb-2">Total Trades</span>
          <span className="text-2xl md:text-3xl font-black text-white">
            {totalTrades}
          </span>
        </div>
      </div>

      {/* Equity Curve & Advanced Metrics */}
      <div>
        <InteractiveEquityCurve trades={activeTrades} currency={isDomestic ? "INR" : "USD"} />
        <AdvancedMetrics trades={activeTrades} />
      </div>

      {/* Bottom Algorithmic Add-ons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DrawdownProfile trades={activeTrades} />
        <VolumeCorrelation trades={activeTrades} />
        <SessionHeatmap trades={activeTrades} />
        <MaeMfeScatter trades={activeTrades} />
        <MonteCarloSimulator trades={activeTrades} account={activeAccount} />
      </div>

    </div>
  );
}
