"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { AccountDoc, TradeDoc } from "@/lib/firebase/schema";
import CustomSelect from "@/components/ui/CustomSelect";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function GlobalTradesPage() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<TradeDoc[]>([]);
  const [accounts, setAccounts] = useState<AccountDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("ALL");

  useEffect(() => {
    if (user) {
      fetchGlobalTrades();
    }
  }, [user]);

  const fetchGlobalTrades = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch all accounts for user
      const accQuery = query(collection(db, "accounts"), where("owner_uid", "==", user.uid));
      const accSnap = await getDocs(accQuery);
      const accDocs = accSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccountDoc));
      setAccounts(accDocs);

      if (accDocs.length === 0) {
        setTrades([]);
        setLoading(false);
        return;
      }

      // Fetch trades for these accounts
      let allTrades: TradeDoc[] = [];
      for (const acc of accDocs) {
        const tQuery = query(collection(db, "trades"), where("account_id", "==", acc.id));
        const tSnap = await getDocs(tQuery);
        const tDocs = tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradeDoc));
        allTrades = [...allTrades, ...tDocs];
      }
      
      // Sort by close_time descending
      allTrades.sort((a, b) => new Date(b.close_time).getTime() - new Date(a.close_time).getTime());
      setTrades(allTrades);
    } catch (error) {
      console.error("Error fetching global trades:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrades = trades.filter(t => {
    const matchesSearch = t.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAccount = selectedAccountId === "ALL" || t.account_id === selectedAccountId;
    return matchesSearch && matchesAccount;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto font-sans">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <i className="las la-book-open text-3xl text-yellow-500"></i>
            Global Trade Journal
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">View and analyze all your trades across every connected account.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <i className="las la-search text-[16px] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"></i>
            <input 
              type="text" 
              placeholder="Search symbols (e.g. XAUUSD)" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-[#111318] border border-yellow-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 text-sm transition-all"
            />
          </div>
          
          <div className="relative flex-1 md:w-48">
            <CustomSelect
              options={[
                { value: "ALL", label: "All Accounts" },
                ...accounts.map(acc => ({ value: acc.id, label: acc.label }))
              ]}
              value={selectedAccountId}
              onChange={setSelectedAccountId}
              icon="las la-wallet"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111318] border border-yellow-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#fafafa] dark:bg-[#0a0f1c] text-xs uppercase text-gray-400 dark:text-slate-500 font-extrabold tracking-wider border-b border-yellow-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Account</th>
                <th className="px-6 py-4">Open Time</th>
                <th className="px-6 py-4">Symbol</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Lots</th>
                <th className="px-6 py-4 text-right">Open / Close</th>
                <th className="px-6 py-4 text-right">Net PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12"><LoadingSpinner /></td>
                </tr>
              ) : filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500 font-medium">No trades found.</td>
                </tr>
              ) : (
                filteredTrades.map((trade) => {
                  const isProfit = trade.profit_loss > 0;
                  const account = accounts.find(a => a.id === trade.account_id);
                  return (
                    <tr key={trade.id} className="hover:bg-white dark:bg-[#1f2229]/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${account?.account_type === 'real' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                          <span className="text-gray-700 dark:text-slate-300 font-bold text-xs">{account?.label || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900 dark:text-white font-medium">{new Date(trade.open_time).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400 dark:text-slate-500">{new Date(trade.open_time).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-gray-900 dark:text-white tracking-tight">{trade.symbol}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          trade.direction === 'BUY' ? 'bg-blue-500/10 text-blue-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          <i className={trade.direction === 'BUY' ? "las la-arrow-up" : "las la-arrow-down"}></i>
                          {trade.direction}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-gray-700 dark:text-slate-300 font-bold">
                        {trade.lot_size.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-mono">
                        <div className="text-gray-700 dark:text-slate-300 font-bold">{trade.open_price.toFixed(5)}</div>
                        <div className="text-xs text-gray-400 dark:text-slate-500">→ {trade.close_price.toFixed(5)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-base font-extrabold tracking-tight ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProfit ? '+' : ''}{trade.profit_loss.toFixed(2)}
                        </span>
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
