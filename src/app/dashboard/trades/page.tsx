"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { useTierTheme } from "@/hooks/useTierTheme";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { AccountDoc, TradeDoc } from "@/lib/firebase/schema";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { DEMO_ACCOUNTS, DEMO_TRADES } from "@/lib/adminDemoData";
import { formatTradeDate, getTradeDuration } from "@/lib/dateUtils";

export default function GlobalTradesPage() {
  const { user, tier, role } = useAuth();
  const theme = useTierTheme();
  const [trades, setTrades] = useState<TradeDoc[]>([]);
  const [accounts, setAccounts] = useState<AccountDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("ALL");

  useEffect(() => {
    if (user) {
      fetchGlobalTrades();
    }
  }, [user, role]);

  const fetchGlobalTrades = async () => {
    if (!user) return;
    try {
      setLoading(true);

      if (role === "admin") {
        setAccounts(DEMO_ACCOUNTS);
        setTrades(DEMO_TRADES);
        setLoading(false);
        return;
      }

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

  const isProOrElite = tier === 'pro' || tier === 'elite';

  const handleExportCSV = () => {
    if (!isProOrElite) {
      import("react-hot-toast").then(mod => mod.toast.error("Exporting data is a Pro & Elite feature. Please upgrade your plan!"));
      return;
    }
    
    // Basic CSV generation
    if (filteredTrades.length === 0) {
      import("react-hot-toast").then(mod => mod.toast.error("No trades to export."));
      return;
    }

    const headers = ["Account", "Symbol", "Open Time", "Close Time", "Type", "Lots", "Open Price", "Close Price", "Profit/Loss", "Commission"];
    const csvContent = [
      headers.join(","),
      ...filteredTrades.map(t => {
        const accName = accounts.find(a => a.id === t.account_id)?.label || "Unknown";
        return `"${accName}","${t.symbol}","${new Date(t.open_time).toISOString()}","${new Date(t.close_time).toISOString()}","${t.direction}",${t.lot_size},${t.open_price},${t.close_price},${t.profit_loss},${t.commission}`;
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `trading_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in font-sans">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
            <i className={`las la-book-open text-3xl ${theme.icon}`}></i>
            Global Trade Journal
          </h1>
          <p className="text-secondary text-sm mt-1">View and analyze all your trades across every connected account.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div title={!isProOrElite ? "Exporting is available on Pro/Elite tiers" : "Export your trade history"}>
            <Button 
              variant="outline"
              onClick={handleExportCSV}
              className={!isProOrElite ? "opacity-70 cursor-not-allowed pointer-events-none" : ""}
              leftIcon={<i className={`las ${isProOrElite ? 'la-download' : 'la-lock'} text-lg`}></i>}
            >
              Export CSV
            </Button>
          </div>
          
          <div className="w-full md:w-64">
            <Input 
              placeholder="Search symbols (e.g. XAUUSD)" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<i className="las la-search text-lg"></i>}
            />
          </div>
          
          <div className="w-full md:w-48">
            <Select
              options={[
                { value: "ALL", label: "All Accounts" },
                ...accounts.map(acc => ({ value: acc.id, label: acc.label }))
              ]}
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-elevated text-xs uppercase text-secondary font-bold tracking-wider border-b border-subtle">
              <tr>
                <th className="px-6 py-4">Account</th>
                <th className="px-6 py-4">Open Date & Time</th>
                <th className="px-6 py-4">Close Date & Time</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Symbol</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Lots</th>
                <th className="px-6 py-4 text-right">Open / Close</th>
                <th className="px-6 py-4 text-right">Net PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12"><LoadingSpinner /></td>
                </tr>
              ) : filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-secondary font-medium">No trades found.</td>
                </tr>
              ) : (
                filteredTrades.map((trade) => {
                  const isProfit = trade.profit_loss > 0;
                  const account = accounts.find(a => a.id === trade.account_id);
                  return (
                    <tr key={trade.id} className="hover:bg-elevated transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${account?.account_type === 'real' ? 'bg-success' : 'bg-info'}`}></div>
                          <span className="text-primary font-semibold text-xs">{account?.label || "Unknown"}</span>
                        </div>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-primary tracking-tight">{trade.symbol}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={trade.direction === 'BUY' ? 'info' : 'danger'} size="sm">
                          <i className={trade.direction === 'BUY' ? "las la-arrow-up mr-1" : "las la-arrow-down mr-1"}></i>
                          {trade.direction}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-primary font-semibold">
                        {trade.lot_size.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-mono">
                        <div className="text-primary font-semibold">{trade.open_price.toFixed(5)}</div>
                        <div className="text-xs text-muted">→ {trade.close_price.toFixed(5)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-base font-bold tracking-tight ${isProfit ? 'text-success' : 'text-danger'}`}>
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
      </Card>
    </div>
  );
}
