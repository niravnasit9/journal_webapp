"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { AccountDoc, TradeDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

export default function UserDashboardCommandCenter() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AccountDoc[]>([]);
  const [recentTrades, setRecentTrades] = useState<TradeDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      const accQuery = query(collection(db, "accounts"), where("owner_uid", "==", user.uid));
      const accSnap = await getDocs(accQuery);
      const accDocs = accSnap.docs.map(d => ({ id: d.id, ...d.data() } as AccountDoc));
      setAccounts(accDocs);

      let allTrades: TradeDoc[] = [];
      for (const acc of accDocs) {
        const tQuery = query(collection(db, "trades"), where("account_id", "==", acc.id));
        const tSnap = await getDocs(tQuery);
        const tDocs = tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradeDoc));
        allTrades = [...allTrades, ...tDocs];
      }
      
      // Sort trades by close time descending
      allTrades.sort((a, b) => new Date(b.close_time).getTime() - new Date(a.close_time).getTime());
      setRecentTrades(allTrades);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><LoadingSpinner className="w-10 h-10" /></div>;
  }

  // Calculate Metrics
  let totalBalance = 0;
  let totalInitialBalance = 0;
  accounts.forEach(acc => {
    totalInitialBalance += (acc.initial_balance || 0);
  });

  const totalTradesCount = recentTrades.length;
  let totalPnL = 0;
  let winningTrades = 0;
  let todaysPnL = 0;
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  recentTrades.forEach(t => {
    const net = t.profit_loss - (t.commission || 0);
    totalPnL += net;
    if (net > 0) winningTrades++;
    
    if (new Date(t.close_time).getTime() >= todayStart.getTime()) {
      todaysPnL += net;
    }
  });

  totalBalance = totalInitialBalance + totalPnL;
  const winRate = totalTradesCount > 0 ? (winningTrades / totalTradesCount) * 100 : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-subtle pb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-3">
            <i className="las la-home text-3xl text-info"></i>
            Command Center
          </h1>
          <p className="text-secondary text-sm mt-1 font-medium">Welcome back, here's your global trading overview.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Link href="/dashboard/accounts">
            <Button variant="secondary" leftIcon={<i className="las la-wallet text-lg"></i>}>
              Accounts
            </Button>
          </Link>
          <Link href="/dashboard/performance">
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
            <h3 className="text-xs font-bold text-secondary uppercase tracking-widest">Global Balance</h3>
          </div>
          <p className="text-3xl font-extrabold text-primary tracking-tight">
            ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="text-xs font-medium text-secondary mt-2">Across {accounts.length} active accounts</div>
        </Card>

        <Card className="p-6 border-default shadow-sm hover:border-success transition-colors group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-success-bg border border-success/20 rounded-xl flex items-center justify-center text-success group-hover:bg-success group-hover:text-white transition-colors">
              <i className="las la-chart-line text-xl"></i>
            </div>
            <h3 className="text-xs font-bold text-secondary uppercase tracking-widest">Net P/L</h3>
          </div>
          <p className={`text-3xl font-extrabold tracking-tight ${totalPnL >= 0 ? 'text-success' : 'text-danger'}`}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
          <p className={`text-3xl font-extrabold tracking-tight ${todaysPnL >= 0 ? 'text-success' : 'text-danger'}`}>
            {todaysPnL >= 0 ? '+' : ''}${todaysPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="text-xs font-medium text-secondary mt-2">Reset at midnight UTC</div>
        </Card>

        <Card className="p-6 border-default shadow-sm hover:border-warning transition-colors group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-warning/10 border border-warning/20 rounded-xl flex items-center justify-center text-warning group-hover:bg-warning group-hover:text-white transition-colors">
              <i className="las la-bullseye text-xl"></i>
            </div>
            <h3 className="text-xs font-bold text-secondary uppercase tracking-widest">Win Rate</h3>
          </div>
          <p className="text-3xl font-extrabold text-primary tracking-tight">
            {winRate.toFixed(1)}%
          </p>
          <div className="text-xs font-medium text-secondary mt-2">From {totalTradesCount} total trades</div>
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
                  recentTrades.slice(0, 5).map(trade => (
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
