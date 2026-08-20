"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function AdminDashboardOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAccounts: 0,
    totalTrades: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const fetchGlobalStats = async () => {
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const accountsSnap = await getDocs(collection(db, "accounts"));
      const tradesSnap = await getDocs(collection(db, "trades"));

      setStats({
        totalUsers: usersSnap.docs.length,
        totalAccounts: accountsSnap.docs.length,
        totalTrades: tradesSnap.docs.length
      });
    } catch (error) {
      console.error("Failed to fetch global stats", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <i className="las la-tachometer-alt text-3xl text-indigo-500"></i>
            Admin Overview
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm font-medium mt-1">Platform-wide statistics and metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-yellow-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
              <i className="las la-users text-2xl text-blue-500"></i>
            </div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Total Users</h3>
          </div>
          <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            {loading ? "..." : stats.totalUsers}
          </p>
        </div>

        <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-yellow-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center">
              <i className="las la-wallet text-2xl text-purple-500"></i>
            </div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Total Accounts</h3>
          </div>
          <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            {loading ? "..." : stats.totalAccounts}
          </p>
        </div>

        <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-yellow-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
              <i className="las la-book-open text-2xl text-emerald-500"></i>
            </div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Total Trades</h3>
          </div>
          <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            {loading ? "..." : stats.totalTrades}
          </p>
        </div>
      </div>
    </div>
  );
}
