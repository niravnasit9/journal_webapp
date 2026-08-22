"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { UserDoc } from "@/lib/firebase/schema";
import CustomSelect from "@/components/ui/CustomSelect";

export default function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    eliteUsers: 0,
    proUsers: 0,
    starterUsers: 0,
    freeUsers: 0,
    totalStrategies: 0,
    totalTrades: 0,
    totalAccounts: 0,
  });
  const [recentUsers, setRecentUsers] = useState<UserDoc[]>([]);
  const [allUsers, setAllUsers] = useState<UserDoc[]>([]);
  const [tierFilter, setTierFilter] = useState("ALL");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Fetch users
      const usersSnap = await getDocs(collection(db, "users"));
      const users = usersSnap.docs.map(d => d.data() as UserDoc);
      
      // Fetch strategies, trades, and accounts
      const stratSnap = await getDocs(collection(db, "strategies"));
      const tradeSnap = await getDocs(collection(db, "trades"));
      const accSnap = await getDocs(collection(db, "accounts"));

      setStats({
        totalUsers: users.length,
        eliteUsers: users.filter(u => u.subscription_tier === "elite").length,
        proUsers: users.filter(u => u.subscription_tier === "pro").length,
        starterUsers: users.filter(u => u.subscription_tier === "starter").length,
        freeUsers: users.filter(u => !u.subscription_tier || u.subscription_tier === "free").length,
        totalStrategies: stratSnap.size,
        totalTrades: tradeSnap.size,
        totalAccounts: accSnap.size,
      });

      // Get all users sorted by date
      const sortedUsers = [...users].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setAllUsers(sortedUsers);
    } catch (e) {
      console.error("Failed to fetch admin stats", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (tierFilter === "ALL") return allUsers;
    return allUsers.filter(u => (u.subscription_tier || "free") === tierFilter);
  }, [allUsers, tierFilter]);

  const estimatedMRR = useMemo(() => {
    return (stats.eliteUsers * 99) + (stats.proUsers * 49) + (stats.starterUsers * 19);
  }, [stats]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <LoadingSpinner className="w-12 h-12 border-[3px]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <i className="las la-chart-pie text-4xl text-blue-500"></i>
            Platform Overview
          </h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium mt-2">
            Real-time analytics and user distribution.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white dark:bg-[#111318] p-2 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
          <span className="text-sm font-bold text-gray-500 dark:text-slate-400 pl-3">Filter Table:</span>
          <div className="w-40">
            <CustomSelect 
              options={[
                { value: "ALL", label: "All Tiers" },
                { value: "elite", label: "Elite Only" },
                { value: "pro", label: "Pro Only" },
                { value: "starter", label: "Starter Only" },
                { value: "free", label: "Free Only" }
              ]}
              value={tierFilter}
              onChange={setTierFilter}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Users */}
        <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
              <i className="las la-users text-xl"></i>
            </div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Total Users</h3>
          </div>
          <p className="text-4xl font-black text-gray-900 dark:text-white">{stats.totalUsers}</p>
        </div>

        {/* Elite Users */}
        <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-purple-200 dark:border-[#523e6b] shadow-[0_0_15px_rgba(168,85,247,0.1)] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-fuchsia-500/5 to-purple-500/5 animate-gradient-x pointer-events-none"></div>
          <div className="relative z-10 flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-500">
              <i className="las la-crown text-xl animate-pulse"></i>
            </div>
            <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Elite Subscriptions</h3>
          </div>
          <p className="relative z-10 text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 animate-gradient-x">{stats.eliteUsers}</p>
        </div>

        {/* Pro Users */}
        <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-yellow-200 dark:border-[#333022] shadow-[0_0_10px_rgba(234,179,8,0.1)] flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center text-yellow-500">
              <i className="las la-star text-xl"></i>
            </div>
            <h3 className="text-sm font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-widest">Pro Subscriptions</h3>
          </div>
          <p className="text-4xl font-black text-yellow-600 dark:text-yellow-500">{stats.proUsers}</p>
        </div>

        {/* Strategies Created */}
        <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-emerald-200 dark:border-[#1c3026] shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <i className="las la-book text-xl"></i>
            </div>
            <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Total Playbooks</h3>
          </div>
          <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{stats.totalStrategies}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Connected Accounts */}
        <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-blue-200 dark:border-[#1a2838] shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
              <i className="las la-server text-xl"></i>
            </div>
            <h3 className="text-sm font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest">Connected Accounts</h3>
          </div>
          <p className="text-4xl font-black text-blue-600 dark:text-blue-400">{stats.totalAccounts}</p>
        </div>

        {/* Total Trades */}
        <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-orange-200 dark:border-[#33221c] shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500">
              <i className="las la-exchange-alt text-xl"></i>
            </div>
            <h3 className="text-sm font-bold text-orange-600 dark:text-orange-500 uppercase tracking-widest">Total Trades Logged</h3>
          </div>
          <p className="text-4xl font-black text-orange-600 dark:text-orange-400">{stats.totalTrades}</p>
        </div>

        {/* Estimated MRR */}
        <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-emerald-200 dark:border-[#1c3026] shadow-sm flex flex-col justify-between lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <i className="las la-dollar-sign text-xl"></i>
            </div>
            <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Estimated MRR</h3>
          </div>
          <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">${estimatedMRR.toLocaleString()}<span className="text-lg text-emerald-600/50">/mo</span></p>
        </div>
      </div>

      {/* Complex Analytics Section */}
      <div className="mt-8">
        
        {/* Recent Registrations Table */}
        <div className="w-full bg-white dark:bg-[#111318] rounded-3xl border border-gray-200 dark:border-white/5 shadow-xl overflow-hidden flex flex-col">
          <div className="p-6 md:p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <i className="las la-user-clock text-2xl text-blue-500"></i>
              Recent Registrations
            </h2>
            <span className="px-3 py-1 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg">Top 10</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#fafafa] dark:bg-[#0a0f1c] text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Tier</th>
                  <th className="px-6 py-4 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500 dark:text-slate-400">
                      No users found in this tier.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.slice(0, 10).map(u => (
                    <tr key={u.uid} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0 border border-gray-200 dark:border-white/10">
                            {u.photo_url ? (
                              <img src={u.photo_url} alt="Profile" className="w-full h-full rounded-lg object-cover" />
                            ) : (
                              <i className="las la-user text-gray-400"></i>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{u.name || "Unknown"}</p>
                            <p className="text-[10px] text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {u.subscription_tier === "elite" ? (
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-500 font-black uppercase tracking-widest text-[10px]">ELITE</span>
                        ) : u.subscription_tier === "pro" ? (
                          <span className="text-yellow-600 dark:text-yellow-500 font-black uppercase tracking-widest text-[10px]">PRO</span>
                        ) : u.subscription_tier === "starter" ? (
                          <span className="text-blue-600 dark:text-blue-500 font-black uppercase tracking-widest text-[10px]">STARTER</span>
                        ) : (
                          <span className="text-gray-500 font-black uppercase tracking-widest text-[10px]">FREE</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-500 dark:text-slate-400 text-xs">
                        {new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
    </div>
  );
}
