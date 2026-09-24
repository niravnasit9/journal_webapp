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
import TradeInsightsEngine from "@/components/dashboard/TradeInsightsEngine";
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
      const net = isDomestic ? ((t as any).net_pnl || 0) : (t.profit_loss - (t.commission || 0));
      totalPnL += net;
      if (net > 0) winningTrades++;

      if (new Date(t.close_time).getTime() >= todayStart.getTime()) {
        todaysPnL += net;
      }
    });

    const totalBalance = totalInitialBalance + totalPnL;
    const winRate = totalTradesCount > 0 ? (winningTrades / totalTradesCount) * 100 : 0;

    return { totalBalance, totalPnL, todaysPnL, winRate, totalTradesCount };
  }, [activeAccounts, recentTrades, isDomestic]);

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><LoadingSpinner className="w-10 h-10" /></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans animate-in fade-in w-full overflow-x-hidden">
      <PlanStatusCard />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-subtle pb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-3">
            <i className="las la-home text-3xl text-info"></i>
            Command Center
          </h1>
          <p className="text-secondary text-sm mt-1 font-medium">Welcome back, here's your {isDomestic ? 'domestic' : 'global'} trading overview.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
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

      <TradeInsightsEngine trades={recentTrades} isDomestic={isDomestic} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Balance Card */}
        <div className="premium-card p-6 border-t-2 border-t-blue-500 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <h3 className="text-xs font-bold text-muted uppercase tracking-widest">{isDomestic ? 'Domestic' : 'Global'} Balance</h3>
            <p className="text-3xl font-black text-white mt-2 drop-shadow-md truncate" title={`${currencySymbol}${metrics.totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>
              {currencySymbol}{metrics.totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="text-xs font-bold text-muted mt-2 border-t border-default pt-2">Across {activeAccounts.length} active accounts</div>
          </div>
        </div>

        {/* Net P/L Card */}
        <div className={`premium-card p-6 border-t-2 relative overflow-hidden group ${metrics.totalPnL >= 0 ? 'border-t-emerald-500' : 'border-t-rose-500'}`}>
          <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${metrics.totalPnL >= 0 ? 'from-emerald-500/10 to-transparent' : 'from-rose-500/10 to-transparent'}`}></div>
          <div className="relative z-10">
            <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Net P/L</h3>
            <p className={`text-3xl font-black mt-2 drop-shadow-md truncate ${metrics.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} title={`${metrics.totalPnL >= 0 ? '+' : ''}${currencySymbol}${metrics.totalPnL.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>
              {metrics.totalPnL >= 0 ? '+' : ''}{currencySymbol}{metrics.totalPnL.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="text-xs font-bold text-muted mt-2 border-t border-default pt-2">All-time profit/loss</div>
          </div>
        </div>

        {/* Today's P/L Card */}
        <div className={`premium-card p-6 border-t-2 relative overflow-hidden group ${metrics.todaysPnL >= 0 ? 'border-t-emerald-500' : 'border-t-rose-500'}`}>
          <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${metrics.todaysPnL >= 0 ? 'from-emerald-500/10 to-transparent' : 'from-rose-500/10 to-transparent'}`}></div>
          <div className="relative z-10">
            <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Today's P/L</h3>
            <p className={`text-3xl font-black mt-2 drop-shadow-md truncate ${metrics.todaysPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} title={`${metrics.todaysPnL >= 0 ? '+' : ''}${currencySymbol}${metrics.todaysPnL.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>
              {metrics.todaysPnL >= 0 ? '+' : ''}{currencySymbol}{metrics.todaysPnL.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="text-xs font-bold text-muted mt-2 border-t border-default pt-2">Reset at midnight</div>
          </div>
        </div>

        {/* Win Rate Card */}
        <div className="premium-card p-6 border-t-2 border-t-purple-500 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Win Rate</h3>
            <p className="text-3xl font-black text-purple-400 mt-2 drop-shadow-md">
              {metrics.winRate.toFixed(1)}%
            </p>
            <div className="text-xs font-bold text-muted mt-2 border-t border-default pt-2">From {metrics.totalTradesCount} total trades</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Recent Trades Table */}
        <Card className="lg:col-span-2 overflow-hidden border-default shadow-sm min-w-0">
          <CardHeader className="bg-elevated/50 border-b border-subtle py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <i className="las la-history text-lg"></i>
              Recent Trades
            </CardTitle>
            <Link href="/dashboard/trades" className="text-xs font-bold text-info hover:text-primary transition-colors uppercase tracking-widest">
              View All
            </Link>
          </CardHeader>
          <div className="overflow-x-auto pb-2">
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
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 flex items-center justify-center mb-4 ring-1 ring-blue-500/20">
                          <i className="las la-file-invoice text-3xl"></i>
                        </div>
                        <h4 className="text-primary font-bold text-lg mb-1">No trades recorded yet</h4>
                        <p className="text-secondary text-sm mb-6">Connect your brokerage account or upload a CSV to see your trading data here.</p>
                        <Link href="/dashboard/accounts">
                          <Button variant="primary" size="sm" className="shadow-lg shadow-blue-500/20">
                            Connect Account
                          </Button>
                        </Link>
                      </div>
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
                        {trade.profit_loss >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(trade.profit_loss).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quick Links & Tips */}
        <Card className="lg:col-span-1 border-default shadow-sm min-w-0">
          <CardHeader className="bg-elevated/50 border-b border-subtle py-4">
            <CardTitle className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <i className="las la-bolt text-lg"></i>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <Link href="/dashboard/risk" className="group flex items-center justify-between p-3 rounded-lg border border-subtle hover:border-danger hover:bg-danger/5 transition-all hover:shadow-[0_4_12px_rgba(220,38,38,0.1)]">
              <div className="flex items-center gap-3">
                <i className="las la-shield-alt text-xl text-danger group-hover:scale-110 transition-transform duration-300"></i>
                <div className="font-bold text-primary text-sm group-hover:text-danger transition-colors">Risk Center</div>
              </div>
              <i className="las la-angle-right text-secondary group-hover:translate-x-1 group-hover:text-danger transition-all duration-300"></i>
            </Link>
            <Link href="/dashboard/goals" className="group flex items-center justify-between p-3 rounded-lg border border-subtle hover:border-success hover:bg-success/5 transition-all hover:shadow-[0_4_12px_rgba(22,163,74,0.1)]">
              <div className="flex items-center gap-3">
                <i className="las la-bullseye text-xl text-success group-hover:scale-110 transition-transform duration-300"></i>
                <div className="font-bold text-primary text-sm group-hover:text-success transition-colors">Trading Goals</div>
              </div>
              <i className="las la-angle-right text-secondary group-hover:translate-x-1 group-hover:text-success transition-all duration-300"></i>
            </Link>
            <Link href="/dashboard/reports" className="group flex items-center justify-between p-3 rounded-lg border border-subtle hover:border-info hover:bg-info/5 transition-all hover:shadow-[0_4_12px_rgba(37,99,235,0.1)]">
              <div className="flex items-center gap-3">
                <i className="las la-file-download text-xl text-info group-hover:scale-110 transition-transform duration-300"></i>
                <div className="font-bold text-primary text-sm group-hover:text-info transition-colors">Export Reports</div>
              </div>
              <i className="las la-angle-right text-secondary group-hover:translate-x-1 group-hover:text-info transition-all duration-300"></i>
            </Link>
            <Link href="/dashboard/insights" className="group flex items-center justify-between p-3 rounded-lg border border-subtle hover:border-warning hover:bg-warning/5 transition-all hover:shadow-[0_4_12px_rgba(234,88,12,0.1)]">
              <div className="flex items-center gap-3">
                <i className="las la-lightbulb text-xl text-warning group-hover:scale-110 transition-transform duration-300"></i>
                <div className="font-bold text-primary text-sm group-hover:text-warning transition-colors">View Insights</div>
              </div>
              <i className="las la-angle-right text-secondary group-hover:translate-x-1 group-hover:text-warning transition-all duration-300"></i>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
