"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/authContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function AdminDashboardOverview() {
  const { role } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAccounts: 0,
    totalTrades: 0,
    activeFirms: 0
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const usersSnap = await getDocs(collection(db, "users"));
      const accountsSnap = await getDocs(collection(db, "accounts"));
      const tradesSnap = await getDocs(collection(db, "trades"));
      const firmsSnap = await getDocs(collection(db, "prop_firms"));

      setStats({
        totalUsers: usersSnap.docs.length,
        totalAccounts: accountsSnap.docs.length,
        totalTrades: tradesSnap.docs.length,
        activeFirms: firmsSnap.docs.filter(d => d.data().is_active).length
      });

      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      users.sort((a: any, b: any) => {
        const tA = a.created_at?.toMillis ? a.created_at.toMillis() : (a.created_at || 0);
        const tB = b.created_at?.toMillis ? b.created_at.toMillis() : (b.created_at || 0);
        return tB - tA;
      });
      setRecentUsers(users.slice(0, 5));

    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  if (role !== 'admin') {
    return null;
  }

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><LoadingSpinner className="w-10 h-10 border-info" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-subtle pb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-3">
            <i className="las la-tachometer-alt text-3xl text-info"></i>
            Admin Overview
          </h1>
          <p className="text-secondary text-sm font-medium mt-1">Global command center for ProfitPulse.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Link href="/admin/analytics">
            <Button variant="primary" leftIcon={<i className="las la-chart-pie text-lg"></i>}>
              Deep Analytics
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-default shadow-sm hover:border-info transition-colors group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-info-bg border border-info/20 rounded-xl flex items-center justify-center text-info group-hover:bg-info group-hover:text-white transition-colors">
              <i className="las la-users text-2xl"></i>
            </div>
            <h3 className="text-xs font-bold text-secondary uppercase tracking-widest">Total Users</h3>
          </div>
          <p className="text-3xl font-extrabold text-primary tracking-tight">
            {stats.totalUsers}
          </p>
        </Card>

        <Card className="p-6 border-default shadow-sm hover:border-success transition-colors group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-success-bg border border-success/20 rounded-xl flex items-center justify-center text-success group-hover:bg-success group-hover:text-white transition-colors">
              <i className="las la-wallet text-2xl"></i>
            </div>
            <h3 className="text-xs font-bold text-secondary uppercase tracking-widest">Accounts</h3>
          </div>
          <p className="text-3xl font-extrabold text-primary tracking-tight">
            {stats.totalAccounts}
          </p>
        </Card>

        <Card className="p-6 border-default shadow-sm hover:border-primary transition-colors group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-elevated border border-default rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-inverse transition-colors">
              <i className="las la-book-open text-2xl"></i>
            </div>
            <h3 className="text-xs font-bold text-secondary uppercase tracking-widest">Trades Logged</h3>
          </div>
          <p className="text-3xl font-extrabold text-primary tracking-tight">
            {stats.totalTrades}
          </p>
        </Card>

        <Card className="p-6 border-default shadow-sm hover:border-warning transition-colors group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-warning/10 border border-warning/20 rounded-xl flex items-center justify-center text-warning group-hover:bg-warning group-hover:text-white transition-colors">
              <i className="las la-building text-2xl"></i>
            </div>
            <h3 className="text-xs font-bold text-secondary uppercase tracking-widest">Prop Firms</h3>
          </div>
          <p className="text-3xl font-extrabold text-primary tracking-tight">
            {stats.activeFirms}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Registrations */}
        <Card className="lg:col-span-2 overflow-hidden border-default shadow-sm">
          <CardHeader className="bg-elevated/50 border-b border-subtle py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <i className="las la-user-plus text-lg text-secondary"></i>
              New Users
            </CardTitle>
            <Link href="/admin/users" className="text-xs font-bold text-info hover:text-primary transition-colors uppercase tracking-widest">
              View All
            </Link>
          </CardHeader>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-surface text-secondary text-[11px] font-bold uppercase tracking-widest border-b border-subtle">
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Tier</th>
                  <th className="px-6 py-3 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-secondary">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  recentUsers.map((u: any) => (
                    <tr key={u.id} className="hover:bg-elevated/50 transition-colors">
                      <td className="px-6 py-3 font-bold text-primary">
                        <div className="flex items-center gap-3">
                           <div className="w-6 h-6 rounded bg-surface border border-default flex items-center justify-center text-[10px] font-black text-primary">
                            {u.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                          {u.email}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-1 bg-surface border border-default rounded text-[10px] font-black text-secondary uppercase tracking-widest">
                          {u.subscription_tier || 'Free'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-secondary font-medium">
                        {u.created_at ? new Date(u.created_at.toDate ? u.created_at.toDate().getTime() : u.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quick Admin Actions */}
        <Card className="lg:col-span-1 border-default shadow-sm">
          <CardHeader className="bg-elevated/50 border-b border-subtle py-4">
            <CardTitle className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <i className="las la-cog text-lg text-secondary"></i>
              System Management
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <Link href="/admin/prop-firms" className="group flex items-center justify-between p-3 rounded-lg border border-subtle hover:border-info hover:bg-info/5 transition-all">
              <div className="flex items-center gap-3">
                <i className="las la-building text-xl text-info group-hover:scale-110 transition-transform"></i>
                <div className="font-bold text-primary text-sm">Prop Firms</div>
              </div>
              <i className="las la-angle-right text-secondary"></i>
            </Link>
            
            <Link href="/admin/audit-logs" className="group flex items-center justify-between p-3 rounded-lg border border-subtle hover:border-warning hover:bg-warning/5 transition-all">
              <div className="flex items-center gap-3">
                <i className="las la-history text-xl text-warning group-hover:scale-110 transition-transform"></i>
                <div className="font-bold text-primary text-sm">Audit Logs</div>
              </div>
              <i className="las la-angle-right text-secondary"></i>
            </Link>

            <Link href="/admin/system-health" className="group flex items-center justify-between p-3 rounded-lg border border-subtle hover:border-success hover:bg-success/5 transition-all">
              <div className="flex items-center gap-3">
                <i className="las la-heartbeat text-xl text-success group-hover:scale-110 transition-transform"></i>
                <div className="font-bold text-primary text-sm">System Health</div>
              </div>
              <i className="las la-angle-right text-secondary"></i>
            </Link>

            <Link href="/admin/subscriptions" className="group flex items-center justify-between p-3 rounded-lg border border-subtle hover:border-primary hover:bg-primary/5 transition-all">
              <div className="flex items-center gap-3">
                <i className="las la-star text-xl text-primary group-hover:scale-110 transition-transform"></i>
                <div className="font-bold text-primary text-sm">Subscriptions</div>
              </div>
              <i className="las la-angle-right text-secondary"></i>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
