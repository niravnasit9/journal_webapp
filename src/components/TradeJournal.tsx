"use client";

import { useState } from "react";
import { TradeDoc } from "@/lib/firebase/schema";
import { useAuth } from "@/lib/firebase/authContext";
import { useTierTheme } from "@/hooks/useTierTheme";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

interface TradeJournalProps {
  trades: TradeDoc[];
  onDeleteTrade?: (tradeId: string) => void;
  onEditTrade?: (trade: TradeDoc) => void;
}

export default function TradeJournal({ trades, onDeleteTrade, onEditTrade }: TradeJournalProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const { tier } = useAuth();
  const theme = useTierTheme();

  const isProOrElite = tier === 'pro' || tier === 'elite';

  const handleExportCSV = () => {
    if (!isProOrElite) {
      import("react-hot-toast").then(mod => mod.toast.error("Exporting data is a Pro & Elite feature. Please upgrade your plan!"));
      return;
    }
    
    if (filteredTrades.length === 0) {
      import("react-hot-toast").then(mod => mod.toast.error("No trades to export."));
      return;
    }

    const headers = ["Symbol", "Open Time", "Close Time", "Direction", "Lot Size", "Open Price", "Close Price", "Profit/Loss", "Commission"];
    const csvContent = [
      headers.join(","),
      ...filteredTrades.map(t => {
        return `"${t.symbol}","${new Date(t.open_time).toISOString()}","${new Date(t.close_time).toISOString()}","${t.direction}",${t.lot_size},${t.open_price},${t.close_price},${t.profit_loss},${t.commission}`;
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `account_trading_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTrades = trades.filter(trade => {
    const matchesSearch = trade.symbol.toLowerCase().includes(search.toLowerCase());
    let matchesDate = true;
    if (startDate && endDate) {
      matchesDate = trade.open_time >= startDate && trade.open_time <= endDate;
    }
    return matchesSearch && matchesDate;
  });

  return (
    <Card className="flex flex-col font-sans overflow-hidden">
      {/* Table Header / Filters */}
      <div className="p-4 md:p-6 border-b border-subtle flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-elevated">
        <div className="flex justify-between items-center w-full md:w-auto">
          <h2 className="text-lg font-bold text-primary tracking-tight">Trade History</h2>
          
          <Button 
            variant="secondary"
            size="sm"
            onClick={() => setIsFilterSheetOpen(true)}
            className="md:hidden"
            leftIcon={<i className="las la-filter"></i>}
          >
            Filters
          </Button>
        </div>
        
        {/* Desktop Filters */}
        <div className="hidden md:flex flex-row gap-3 w-auto items-center">
          
          <Button 
            variant="outline"
            onClick={handleExportCSV}
            className={!isProOrElite ? "opacity-70 cursor-not-allowed" : ""}
            leftIcon={<i className={`las ${isProOrElite ? 'la-download' : 'la-lock'} text-lg`}></i>}
          >
            Export
          </Button>
          
          <div className="w-56">
            <Input 
              placeholder="Search symbol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<i className="las la-search text-lg"></i>}
            />
          </div>
          
          <div className="flex items-center gap-2 w-auto">
            <div className="w-40">
              <Input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                leftIcon={<i className="las la-calendar text-lg"></i>}
              />
            </div>
            <span className="text-secondary text-sm font-medium">to</span>
            <div className="w-40">
              <Input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                leftIcon={<i className="las la-calendar text-lg"></i>}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-surface text-secondary text-[11px] font-bold uppercase tracking-widest border-b border-subtle">
              <th className="px-6 py-4">Open Time</th>
              <th className="px-6 py-4">Symbol</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Volume</th>
              <th className="px-6 py-4">Open Price</th>
              <th className="px-6 py-4 text-right">Profit/Loss</th>
              <th className="px-4 py-4 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="text-sm bg-surface">
            {filteredTrades.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-secondary">
                  <div className="flex flex-col items-center justify-center">
                    <i className="las la-filter text-4xl mb-3 opacity-50 text-muted"></i>
                    <p>No trades match your criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTrades.map((trade) => (
                <tr key={trade.id} className="border-b border-subtle hover:bg-elevated transition-colors group">
                  <td className="px-6 py-4 text-secondary font-medium">
                    {new Date(trade.open_time).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${trade.profit_loss >= 0 ? 'bg-success' : 'bg-danger'}`} />
                      {trade.symbol}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={trade.direction === 'BUY' ? 'info' : 'warning'} size="sm">
                      {trade.direction}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-secondary font-medium">{trade.lot_size.toFixed(2)}</td>
                  <td className="px-6 py-4 text-muted">{trade.open_price}</td>
                  <td className={`px-6 py-4 text-right font-bold ${trade.profit_loss >= 0 ? 'text-success' : 'text-danger'}`}>
                    {trade.profit_loss >= 0 ? '+' : ''}${trade.profit_loss.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {onEditTrade && (
                      <button 
                        onClick={() => onEditTrade(trade)}
                        className="text-muted hover:text-info transition-colors p-2 rounded-lg hover:bg-info-bg mx-1"
                        title="Edit Trade"
                      >
                        <i className="las la-pen text-[16px]"></i>
                      </button>
                    )}
                    {onDeleteTrade && (
                      <button 
                        onClick={() => onDeleteTrade(trade.id)}
                        className="text-muted hover:text-danger transition-colors p-2 rounded-lg hover:bg-danger-bg mx-1"
                        title="Delete Trade"
                      >
                        <i className="las la-trash-alt text-[16px]"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      {isFilterSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div 
            className="absolute inset-0"
            onClick={() => setIsFilterSheetOpen(false)}
          />
          <div className={`relative w-full border-t border-subtle rounded-t-3xl shadow-2xl p-6 pb-10 bg-surface animate-in slide-in-from-bottom-full duration-300 transition-all`}>
            <div className="w-12 h-1.5 bg-strong rounded-full mx-auto mb-6"></div>
            
            <h3 className="text-xl font-bold text-primary mb-6">Filter Trades</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Search Symbol</label>
                <Input 
                  placeholder="Search symbol..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftIcon={<i className="las la-search text-lg"></i>}
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Date Range</label>
                <div className="flex flex-col gap-3 w-full">
                  <Input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    leftIcon={<i className="las la-calendar text-lg"></i>}
                  />
                  <div className="text-center text-muted font-medium text-sm">to</div>
                  <Input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    leftIcon={<i className="las la-calendar text-lg"></i>}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  variant="primary"
                  className="w-full"
                  onClick={() => setIsFilterSheetOpen(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
