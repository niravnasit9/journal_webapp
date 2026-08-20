"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { TradeDoc, AccountDoc, UserDoc } from "@/lib/firebase/schema";
import Link from "next/link";
import CustomSelect from "@/components/ui/CustomSelect";
import toast from "react-hot-toast";

interface TradeWithDetails extends TradeDoc {
  userEmail: string;
  accountType: string;
  accountLabel: string;
}

export default function AdminTradesPage() {
  const [trades, setTrades] = useState<TradeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAccountType, setFilterAccountType] = useState<string>("ALL");
  const [uniqueTypes, setUniqueTypes] = useState<string[]>([]);

  useEffect(() => {
    fetchAllTrades();
  }, []);

  const fetchAllTrades = async () => {
    try {
      setLoading(true);
      // 1. Fetch all users
      const usersSnap = await getDocs(query(collection(db, "users")));
      const userMap: Record<string, string> = {};
      usersSnap.docs.forEach(d => {
        userMap[d.id] = (d.data() as UserDoc).email;
      });

      // 2. Fetch all accounts
      const accSnap = await getDocs(query(collection(db, "accounts")));
      const accMap: Record<string, { label: string, type: string, owner: string }> = {};
      const types = new Set<string>();
      
      accSnap.docs.forEach(d => {
        const data = d.data() as AccountDoc;
        accMap[d.id] = { label: data.label, type: data.account_type, owner: data.owner_uid };
        types.add(data.account_type);
      });

      // 3. Fetch all trades
      const tradesSnap = await getDocs(query(collection(db, "trades")));
      const tradeList: TradeWithDetails[] = [];

      tradesSnap.docs.forEach(d => {
        const data = d.data() as TradeDoc;
        const accInfo = accMap[data.account_id] || { label: "Unknown", type: "Unknown", owner: "Unknown" };
        const userEmail = userMap[accInfo.owner] || "Unknown User";
        
        tradeList.push({
          ...data,
          id: d.id,
          userEmail,
          accountType: accInfo.type,
          accountLabel: accInfo.label
        });
      });

      // Sort by close_time descending
      tradeList.sort((a, b) => new Date(b.close_time).getTime() - new Date(a.close_time).getTime());

      setUniqueTypes(Array.from(types));
      setTrades(tradeList);
    } catch (error) {
      console.error("Error fetching trades", error);
      toast.error("Failed to fetch global trades.");
    } finally {
      setLoading(false);
    }
  };

  const filteredTrades = filterAccountType === "ALL" 
    ? trades 
    : trades.filter(t => t.accountType === filterAccountType);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <i className="las la-book-open text-3xl text-emerald-500"></i>
            Global Trades List
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm font-medium mt-1">View all trades executed across the platform.</p>
        </div>
        
        <div className="relative w-full sm:w-64 shrink-0">
          <CustomSelect 
            options={[
              { value: "ALL", label: "All Account Types" },
              ...uniqueTypes.map(type => ({ value: type, label: type }))
            ]}
            value={filterAccountType}
            onChange={setFilterAccountType}
            icon="las la-filter"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#111318] border border-yellow-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700 dark:text-slate-300">
            <thead className="bg-[#fafafa] dark:bg-[#0a0f1c] text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest border-b border-yellow-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Account Type</th>
                <th className="px-6 py-4">Symbol</th>
                <th className="px-6 py-4">Direction</th>
                <th className="px-6 py-4">Volume</th>
                <th className="px-6 py-4 text-right">Net P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400 dark:text-slate-500 font-bold">
                    Loading trades...
                  </td>
                </tr>
              ) : filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400 dark:text-slate-500 font-bold">
                    No trades match the criteria.
                  </td>
                </tr>
              ) : (
                filteredTrades.map((trade) => {
                  const netPnL = trade.profit_loss - trade.commission;
                  return (
                    <tr key={trade.id} className="hover:bg-gray-100 dark:hover:bg-[#16181d] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900 dark:text-white">{trade.userEmail}</p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest">{trade.accountLabel}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                          trade.accountType.toLowerCase() === "real" 
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                            : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                        }`}>
                          {trade.accountType}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                        {trade.symbol}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${trade.direction === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {trade.direction}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {trade.lot_size} lots
                      </td>
                      <td className={`px-6 py-4 text-right font-black ${netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {netPnL >= 0 ? '+' : ''}${netPnL.toFixed(2)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
