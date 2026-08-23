"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { TradeDoc, AccountDoc, UserDoc } from "@/lib/firebase/schema";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { formatTradeDate, getTradeDuration } from "@/lib/dateUtils";
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
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-3">
            <i className="las la-book-open text-3xl text-success"></i>
            Global Trades List
          </h1>
          <p className="text-secondary text-sm font-medium mt-1">View all trades executed across the platform.</p>
        </div>
        
        <div className="w-full sm:w-64 shrink-0">
          <Select 
            options={[
              { value: "ALL", label: "All Account Types" },
              ...uniqueTypes.map(type => ({ value: type, label: type }))
            ]}
            value={filterAccountType}
            onChange={(e) => setFilterAccountType(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-visible border-default">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm text-secondary">
            <thead className="bg-surface text-xs font-bold text-muted uppercase tracking-widest border-b border-subtle">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Account Type</th>
                <th className="px-6 py-4">Open Date & Time</th>
                <th className="px-6 py-4">Close Date & Time</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Symbol</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Setup / Emotion</th>
                <th className="px-6 py-4 text-right">Net P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted font-bold">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted font-bold">
                    No trades match the criteria.
                  </td>
                </tr>
              ) : (
                filteredTrades.map((trade) => {
                  const netPnL = trade.profit_loss - trade.commission;
                  return (
                    <tr key={trade.id} className="hover:bg-elevated transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-primary">{trade.userEmail}</p>
                        <p className="text-[10px] text-muted uppercase tracking-widest">{trade.accountLabel}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={trade.accountType.toLowerCase() === "real" ? "success" : "info"} size="sm" className="uppercase">
                          {trade.accountType}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-primary font-medium">{formatTradeDate(trade.open_time)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-primary font-medium">{formatTradeDate(trade.close_time)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-secondary font-medium">{getTradeDuration(trade.open_time, trade.close_time)}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-primary">
                        {trade.symbol}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge variant={trade.direction === 'BUY' ? "info" : "warning"} size="sm" className="uppercase">
                            {trade.direction}
                          </Badge>
                          <span className="text-xs font-medium text-secondary">{trade.lot_size} lots</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {trade.setup_grade && (
                            <Badge variant="neutral" size="sm">
                              {trade.setup_grade}
                            </Badge>
                          )}
                          {trade.emotion && (
                            <Badge variant="info" size="sm">
                              {trade.emotion}
                            </Badge>
                          )}
                          {!trade.setup_grade && !trade.emotion && (
                            <span className="text-xs text-muted">-</span>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-right font-black ${netPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                        {netPnL >= 0 ? '+' : ''}${netPnL.toFixed(2)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
