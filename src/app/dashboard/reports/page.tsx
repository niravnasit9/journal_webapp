"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { TradeDoc, AccountDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import CustomSelect from "@/components/ui/CustomSelect";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";
import { DEMO_ACCOUNTS, DEMO_TRADES } from "@/lib/adminDemoData";
import { useUiStore } from "@/store/useUiStore";
import MarketSwitcher from "@/components/layout/MarketSwitcher";
import { useDemo } from "@/lib/demoContext";

export default function ReportsPage() {
  const { user, role } = useAuth();
  const { isDemoMode } = useDemo();
  const [accounts, setAccounts] = useState<AccountDoc[]>([]);
  const [trades, setTrades] = useState<TradeDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedAccountId, setSelectedAccountId] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const { activeWorkspace } = useUiStore();
  const isDomestic = activeWorkspace === "DOMESTIC";
  const currencySymbol = isDomestic ? "₹" : "$";
  
  useEffect(() => {
    if (user) fetchData();
  }, [user, role, isDemoMode, isDomestic]);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);

      if (role === "admin") {
        setAccounts(DEMO_ACCOUNTS);
        setTrades(DEMO_TRADES);
        setLoading(false);
        return;
      }

      const accQuery = query(collection(db, "accounts"), where("owner_uid", "==", user.uid));
      const accSnap = await getDocs(accQuery);
      const accDocs = accSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccountDoc));
      const workspaceAccounts = accDocs.filter(a => 
        (isDomestic && a.market_type === "DOMESTIC") || 
        (!isDomestic && a.market_type !== "DOMESTIC")
      );
      setAccounts(workspaceAccounts);
      
      let allTrades: TradeDoc[] = [];
      for (const acc of workspaceAccounts) {
        const tQuery = query(collection(db, "trades"), where("account_id", "==", acc.id));
        const tSnap = await getDocs(tQuery);
        const tDocs = tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradeDoc));
        allTrades = [...allTrades, ...tDocs];
      }
      allTrades.sort((a, b) => new Date(a.close_time).getTime() - new Date(b.close_time).getTime());
      setTrades(allTrades);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrades = trades.filter(t => {
    let match = true;
    if (selectedAccountId !== "ALL" && t.account_id !== selectedAccountId) match = false;
    
    if (startDate) {
      const s = new Date(startDate).getTime();
      const tTime = new Date(t.close_time).getTime();
      if (tTime < s) match = false;
    }
    
    if (endDate) {
      const e = new Date(endDate).getTime();
      // add 24 hours to end date to include trades on that day
      const endOfDay = e + (24 * 60 * 60 * 1000) - 1;
      const tTime = new Date(t.close_time).getTime();
      if (tTime > endOfDay) match = false;
    }
    
    return match;
  });

  const handleExportCSV = () => {
    if (filteredTrades.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      const headers = [
        "Trade ID", "Account ID", "Symbol", "Direction", "Lot Size", 
        "Open Price", "Close Price", "Open Time", "Close Time", 
        "Pips", "Profit/Loss", "Commission", "Strategy"
      ];
      
      const rows = filteredTrades.map(t => [
        t.id, t.account_id, t.symbol, t.direction, t.lot_size,
        t.open_price, t.close_price, new Date(t.open_time).toISOString(), new Date(t.close_time).toISOString(),
        t.pips, t.profit_loss, t.commission || 0, t.strategy_id || "N/A"
      ]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map(e => e.join(","))
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `trading_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Report downloaded successfully");
    } catch (e: any) {
      toast.error("Export failed: " + e.message);
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><LoadingSpinner className="w-10 h-10" /></div>;
  }

  const totalTrades = filteredTrades.length;
  const netPnL = filteredTrades.reduce((sum, t) => sum + (t.profit_loss - (t.commission || 0)), 0);
  const winRate = totalTrades > 0 ? (filteredTrades.filter(t => (t.profit_loss - (t.commission||0)) > 0).length / totalTrades) * 100 : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
            <i className="las la-file-alt text-3xl text-info"></i>
            {isDomestic ? 'Domestic' : 'Global'} Reports
          </h1>
          <p className="text-secondary text-sm mt-1">Export customized statements for taxes or funding verification.</p>
        </div>
        <MarketSwitcher />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <Card className="lg:col-span-1 p-5 shadow-sm border-default h-fit">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
            <i className="las la-filter text-lg text-secondary"></i>
            Report Parameters
          </h3>
          
          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-secondary uppercase tracking-widest mb-2">Account</label>
              <CustomSelect 
                options={[
                  { value: "ALL", label: `All ${isDomestic ? 'Domestic' : 'Global'} Accounts` },
                  ...accounts.map(acc => ({ value: acc.id, label: acc.label }))
                ]}
                value={selectedAccountId}
                onChange={setSelectedAccountId}
                icon="las la-wallet"
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-secondary uppercase tracking-widest mb-2">Start Date</label>
              <Input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                leftIcon={<i className="las la-calendar text-lg"></i>}
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-secondary uppercase tracking-widest mb-2">End Date</label>
              <Input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                leftIcon={<i className="las la-calendar-check text-lg"></i>}
              />
            </div>

            <Button 
              variant="primary" 
              className="w-full mt-4"
              onClick={handleExportCSV}
              leftIcon={<i className="las la-file-csv text-xl"></i>}
            >
              Export CSV
            </Button>
          </div>
        </Card>

        {/* Report Preview */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-default shadow-sm overflow-hidden">
            <CardHeader className="bg-elevated/50 border-b border-subtle">
              <CardTitle className="text-sm font-bold text-primary uppercase tracking-widest">Report Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-xl border border-subtle bg-surface">
                  <div className="text-xs text-secondary font-bold uppercase tracking-widest mb-1">Total Trades</div>
                  <div className="text-2xl font-bold text-primary">{totalTrades}</div>
                </div>
                <div className="p-4 rounded-xl border border-subtle bg-surface">
                  <div className="text-xs text-secondary font-bold uppercase tracking-widest mb-1">Net P/L</div>
                  <div className={`text-2xl font-bold ${netPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                    {netPnL >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(netPnL).toLocaleString(isDomestic ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-subtle bg-surface">
                  <div className="text-xs text-secondary font-bold uppercase tracking-widest mb-1">Win Rate</div>
                  <div className="text-2xl font-bold text-primary">{winRate.toFixed(1)}%</div>
                </div>
              </div>

              {filteredTrades.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-subtle rounded-xl text-secondary">
                  No data found for the selected parameters.
                </div>
              ) : (
                <div className="overflow-x-auto no-scrollbar border border-subtle rounded-xl">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="bg-elevated text-secondary text-[11px] font-bold uppercase tracking-widest border-b border-subtle">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Symbol</th>
                        <th className="px-4 py-3 text-right">P/L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle">
                      {filteredTrades.slice(0, 10).map(t => (
                        <tr key={t.id} className="hover:bg-elevated/50 transition-colors">
                          <td className="px-4 py-3 text-secondary">{new Date(t.close_time).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-bold text-primary">{t.symbol}</td>
                          <td className={`px-4 py-3 text-right font-bold ${t.profit_loss >= 0 ? 'text-success' : 'text-danger'}`}>
                            {t.profit_loss >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(t.profit_loss).toLocaleString(isDomestic ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredTrades.length > 10 && (
                    <div className="p-3 text-center text-xs font-bold text-secondary bg-elevated border-t border-subtle">
                      Showing 10 of {filteredTrades.length} trades. Export to see all.
                    </div>
                  )}
                </div>
              )}

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
