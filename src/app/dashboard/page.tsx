"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { useDemo } from "@/lib/demoContext";
import { useAccountData } from "@/hooks/useAccountData";
import { useTradeData } from "@/hooks/useTradeData";
import { useUiStore } from "@/store/useUiStore";
import { AccountDoc, TradeDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { PlanStatusCard } from "@/components/subscription/PlanStatusCard";
import MarketSwitcher from "@/components/layout/MarketSwitcher";
import dynamic from 'next/dynamic';

// Lazy loading heavy components (if any are extracted in the future, e.g., Charts)
// const DynamicRecentTradesTable = dynamic(() => import('@/components/dashboard/RecentTradesTable'), { ssr: false });

export default function UserDashboardCommandCenter() {
  const { user, role } = useAuth();
  const { isDemoMode } = useDemo();
  
  // 1. Consume Account Logic Layer
  const { accounts, loading: accLoading } = useAccountData(user?.uid, isDemoMode, role);
  
  // Get active workspace for filtering
  const { activeWorkspace } = useUiStore();
  const isDomestic = activeWorkspace === "DOMESTIC";
  const currencySymbol = isDomestic ? "₹" : "$";
  
  // Filter accounts by active workspace
  const activeAccounts = useMemo(() => {
    return accounts.filter((a: AccountDoc) => 
      (isDomestic && a.market_type === "DOMESTIC") || 
      (!isDomestic && a.market_type !== "DOMESTIC")
    );
  }, [accounts, isDomestic]);

  // 2. Consume Trade Logic Layer by passing mapped account IDs
  const accountIds = useMemo(() => activeAccounts.map((a: AccountDoc) => a.id), [activeAccounts]);
  const { trades: recentTrades, loading: tradeLoading } = useTradeData(accountIds);

  const loading = accLoading || tradeLoading;

  // Memoized Metrics Calculations to prevent re-renders
  const metrics = useMemo(() => {
    let totalInitialBalance = 0;
    activeAccounts.forEach((acc: AccountDoc) => {
      totalInitialBalance += (acc.initial_balance || 0);
    });

    const totalTradesCount = recentTrades.length;
    let totalPnL = 0;
    let winningTrades = 0;
    let todaysPnL = 0;
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    recentTrades.forEach((t: TradeDoc) => {
      const net = t.profit_loss - (t.commission || 0);
      totalPnL += net;
      if (net > 0) winningTrades++;
      
      if (new Date(t.close_time).getTime() >= todayStart.getTime()) {
        todaysPnL += net;
      }
    });

    const totalBalance = totalInitialBalance + totalPnL;
    const winRate = totalTradesCount > 0 ? (winningTrades / totalTradesCount) * 100 : 0;

    return { totalBalance, totalPnL, todaysPnL, winRate, totalTradesCount };
  }, [activeAccounts, recentTrades]);

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><LoadingSpinner className="w-10 h-10" /></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans animate-in fade-in">
      <PlanStatusCard />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-subtle pb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-3">
            <i className="las la-home text-3xl text-info"></i>
            Command Center
          </h1>
          <p className="text-secondary text-sm mt-1 font-medium">Welcome back, here's your {isDomestic ? 'domestic' : 'global'} trading overview.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto items-center">
          <MarketSwitcher />
          <Link href="/dashboard/accounts">
            <Button variant="secondary" leftIcon={<i className="las la-wallet text-lg"></i>}>
              Accounts
            </Button>
          </Link>
          <Link href="/dashboard/analytics">
            <Button variant="primary" leftIcon={<i className="las la-chart-bar text-lg"></i>}>
              Analytics
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-default shadow-sm hover:border-info transition-colors group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-info-bg border border-info/20 rounded-xl flex items-center justify-center text-info group-hover:bg-info group-hover:text-white transition-colors">
              <i className="las la-dollar-sign text-xl"></i>
            </div>
            <h3 className="text-xs font-bold text-secondary uppercase tracking-widest">{isDomestic ? 'Domestic' : 'Global'} Balance</h3>
          </div>
          <p className="text-3xl font-extrabold text-primary tracking-tight">
            {currencySymbol}{metrics.totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="text-xs font-medium text-secondary mt-2">Across {activeAccounts.length} active {isDomestic ? 'Domestic' : 'Global'} accounts</div>
        </Card>

        <Card className="p-6 border-default shadow-sm hover:border-success transition-colors group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-success-bg border border-success/20 rounded-xl flex items-center justify-center text-success group-hover:bg-success group-hover:text-white transition-colors">
              <i className="las la-chart-line text-xl"></i>
            </div>
            <h3 className="text-xs font-bold text-secondary uppercase tracking-widest">Net P/L</h3>
          </div>
          <p className={`text-3xl font-extrabold tracking-tight ${metrics.totalPnL >= 0 ? 'text-success' : 'text-danger'}`}>
            {metrics.totalPnL >= 0 ? '+' : ''}{currencySymbol}{metrics.totalPnL.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="text-xs font-medium text-secondary mt-2">All-time profit/loss</div>
        </Card>

        <Card className="p-6 border-default shadow-sm hover:border-primary transition-colors group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-elevated border border-default rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-inverse transition-colors">
              <i className="las la-sun text-xl"></i>
            </div>
            <h3 className="text-xs font-bold text-secondary uppercase tracking-widest">Today's P/L</h3>
          </div>
          <p className={`text-3xl font-extrabold tracking-tight ${metrics.todaysPnL >= 0 ? 'text-success' : 'text-danger'}`}>
            {metrics.todaysPnL >= 0 ? '+' : ''}{currencySymbol}{metrics.todaysPnL.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="text-xs font-medium text-secondary mt-2">Reset at midnight</div>
        </Card>

        <Card className="p-6 border-default shadow-sm hover:border-warning transition-colors group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-warning/10 border border-warning/20 rounded-xl flex items-center justify-center text-warning group-hover:bg-warning group-hover:text-white transition-colors">
              <i className="las la-bullseye text-xl"></i>
            </div>
            <h3 className="text-xs font-bold text-secondary uppercase tracking-widest">Win Rate</h3>
          </div>
          <p className="text-3xl font-extrabold text-primary tracking-tight">
            {metrics.winRate.toFixed(1)}%
          </p>
          <div className="text-xs font-medium text-secondary mt-2">From {metrics.totalTradesCount} total trades</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Trades Table */}
        <Card className="lg:col-span-2 overflow-hidden border-default shadow-sm">
          <CardHeader className="bg-elevated/50 border-b border-subtle py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <i className="las la-history text-lg"></i>
              Recent Trades
            </CardTitle>
            <Link href="/dashboard/trades" className="text-xs font-bold text-info hover:text-primary transition-colors uppercase tracking-widest">
              View All
            </Link>
          </CardHeader>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-surface text-secondary text-[11px] font-bold uppercase tracking-widest border-b border-subtle">
                  <th className="px-6 py-3">Symbol</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Close Time</th>
                  <th className="px-6 py-3 text-right">Net P/L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {recentTrades.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-secondary">
                      No trades recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentTrades.slice(0, 5).map((trade: TradeDoc) => (
                    <tr key={trade.id} className="hover:bg-elevated/50 transition-colors">
                      <td className="px-6 py-3 font-bold text-primary">{trade.symbol}</td>
                      <td className="px-6 py-3">
                        <Badge variant={trade.direction === 'BUY' ? 'info' : 'warning'} size="sm">
                          {trade.direction}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-secondary font-medium">
                        {new Date(trade.close_time).toLocaleString()}
                      </td>
                      <td className={`px-6 py-3 text-right font-bold ${trade.profit_loss >= 0 ? 'text-success' : 'text-danger'}`}>
                        {trade.profit_loss >= 0 ? '+' : ''}${trade.profit_loss.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quick Links & Tips */}
        <Card className="lg:col-span-1 border-default shadow-sm">
          <CardHeader className="bg-elevated/50 border-b border-subtle py-4">
            <CardTitle className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <i className="las la-bolt text-lg"></i>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <Link href="/dashboard/risk" className="group flex items-center justify-between p-3 rounded-lg border border-subtle hover:border-danger hover:bg-danger/5 transition-all">
              <div className="flex items-center gap-3">
                <i className="las la-shield-alt text-xl text-danger group-hover:scale-110 transition-transform"></i>
                <div className="font-bold text-primary text-sm">Risk Center</div>
              </div>
              <i className="las la-angle-right text-secondary"></i>
            </Link>
            
            <Link href="/dashboard/goals" className="group flex items-center justify-between p-3 rounded-lg border border-subtle hover:border-success hover:bg-success/5 transition-all">
              <div className="flex items-center gap-3">
                <i className="las la-bullseye text-xl text-success group-hover:scale-110 transition-transform"></i>
                <div className="font-bold text-primary text-sm">Trading Goals</div>
              </div>
              <i className="las la-angle-right text-secondary"></i>
            </Link>

            <Link href="/dashboard/reports" className="group flex items-center justify-between p-3 rounded-lg border border-subtle hover:border-info hover:bg-info/5 transition-all">
              <div className="flex items-center gap-3">
                <i className="las la-file-download text-xl text-info group-hover:scale-110 transition-transform"></i>
                <div className="font-bold text-primary text-sm">Export Reports</div>
              </div>
              <i className="las la-angle-right text-secondary"></i>
            </Link>

            <Link href="/dashboard/insights" className="group flex items-center justify-between p-3 rounded-lg border border-subtle hover:border-warning hover:bg-warning/5 transition-all">
              <div className="flex items-center gap-3">
                <i className="las la-lightbulb text-xl text-warning group-hover:scale-110 transition-transform"></i>
                <div className="font-bold text-primary text-sm">View Insights</div>
              </div>
              <i className="las la-angle-right text-secondary"></i>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
