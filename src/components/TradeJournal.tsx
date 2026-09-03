"use client";

import { useState, useMemo } from "react";
import { TradeDoc } from "@/lib/firebase/schema";
import { useAuth } from "@/lib/firebase/authContext";
import { useTierTheme } from "@/hooks/useTierTheme";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { TradeDetailDrawer } from "@/components/TradeDetailDrawer";

interface TradeJournalProps {
  trades: TradeDoc[];
  onDeleteTrade?: (tradeId: string) => void;
  onEditTrade?: (trade: TradeDoc) => void;
  currency?: "USD" | "INR";
}

export default function TradeJournal({ trades, onDeleteTrade, onEditTrade, currency = "USD" }: TradeJournalProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [showMfeFlaws, setShowMfeFlaws] = useState(false);

  // New Filters
  const [filterDirection, setFilterDirection] = useState<"ALL" | "BUY" | "SELL">("ALL");
  const [filterExecution, setFilterExecution] = useState<string>("ALL");
  const [filterSetup, setFilterSetup] = useState<string>("ALL");

  // Drawer state
  const [selectedTrade, setSelectedTrade] = useState<TradeDoc | null>(null);

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

    const headers = ["Symbol", "Open Time", "Close Time", "Direction", "Lot Size", "Open Price", "Close Price", "Profit/Loss", "Commission", "Execution", "Emotion", "Setup"];
    const csvContent = [
      headers.join(","),
      ...filteredTrades.map(t => {
        return `"${t.symbol}","${new Date(t.open_time).toISOString()}","${new Date(t.close_time).toISOString()}","${t.direction}",${t.lot_size},${t.open_price},${t.close_price},${t.profit_loss},${t.commission},"${t.execution_score || ''}","${t.emotion || ''}","${t.setup_grade || ''}"`;
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

  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      const matchesSearch = trade.symbol.toLowerCase().includes(search.toLowerCase());
      let matchesDate = true;
      if (startDate && endDate) {
        matchesDate = trade.open_time >= startDate && trade.open_time <= endDate;
      }
      
      let matchesMfeFlaw = true;
      if (showMfeFlaws) {
        const pnl = trade.profit_loss - (trade.commission || 0);
        matchesMfeFlaw = (trade.mfe_usd !== undefined && trade.mfe_usd > 0) && (pnl < 0);
      }

      const matchesDirection = filterDirection === "ALL" || trade.direction === filterDirection;
      const matchesExecution = filterExecution === "ALL" || (trade.execution_score || "None") === filterExecution;
      const matchesSetup = filterSetup === "ALL" || (trade.setup_grade || "None") === filterSetup;

      return matchesSearch && matchesDate && matchesMfeFlaw && matchesDirection && matchesExecution && matchesSetup;
    });
  }, [trades, search, startDate, endDate, showMfeFlaws, filterDirection, filterExecution, filterSetup]);

  const hasMfeData = trades.some(t => t.mfe_usd !== undefined);

  // Quick Stats
  const quickStats = useMemo(() => {
    let totalPnl = 0;
    let totalVolume = 0;
    let totalCommission = 0;
    let longs = 0;
    let shorts = 0;
    filteredTrades.forEach(t => {
      const tLotSize = t.lot_size || t.quantity || 0;
      totalPnl += (t.profit_loss - (t.commission || 0));
      totalVolume += tLotSize;
      totalCommission += (t.commission || 0);
      if (t.direction === 'BUY') longs++;
      if (t.direction === 'SELL') shorts++;
    });
    return {
      totalPnl,
      totalTrades: filteredTrades.length,
      totalVolume,
      totalCommission,
      longs,
      shorts,
      longShortRatio: shorts > 0 ? (longs / shorts).toFixed(2) : (longs > 0 ? "100% L" : "0")
    };
  }, [filteredTrades]);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  const filterSelectClass = "bg-[#121212] border border-default text-neutral-300 text-xs rounded-lg px-2 py-1.5 focus:border-blue-500 outline-none";

  return (
    <>
      <Card className="flex flex-col font-sans overflow-hidden bg-[#0a0a0a] border-default">
        
        {/* Quick Stats Ribbon */}
        <div className="bg-[#121212] border-b border-default p-4 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <span className="block text-[10px] uppercase font-bold text-muted tracking-wider mb-1">Filtered P&L</span>
            <span className={`text-lg font-black ${quickStats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {quickStats.totalPnl >= 0 ? '+' : ''}{formatMoney(quickStats.totalPnl)}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-muted tracking-wider mb-1">Total Trades</span>
            <span className="text-lg font-bold text-white">{quickStats.totalTrades}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-muted tracking-wider mb-1">Total Volume</span>
            <span className="text-lg font-bold text-white">{quickStats.totalVolume.toFixed(2)}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-muted tracking-wider mb-1">L / S Ratio</span>
            <span className="text-lg font-bold text-white">{quickStats.longs} : {quickStats.shorts}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-muted tracking-wider mb-1">Commissions</span>
            <span className="text-lg font-bold text-white">{formatMoney(quickStats.totalCommission)}</span>
          </div>
        </div>

        {/* Table Header / Filters */}
        <div className="p-4 md:p-6 border-b border-default flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-[#0a0a0a]">
          <div className="flex justify-between items-center w-full xl:w-auto">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <i className="las la-history text-blue-500"></i> Trade History
            </h2>
            
            <Button 
              variant="secondary"
              size="sm"
              onClick={() => setIsFilterSheetOpen(true)}
              className="xl:hidden"
              leftIcon={<i className="las la-filter"></i>}
            >
              Filters
            </Button>
          </div>
          
          {/* Desktop Filters */}
          <div className="hidden xl:flex flex-row gap-3 w-auto items-center flex-wrap">
            
            {/* Multi-Filters */}
            <div className="flex items-center gap-2 bg-[#121212] p-1.5 rounded-xl border border-default">
              <select className={filterSelectClass} value={filterDirection} onChange={e => setFilterDirection(e.target.value as any)}>
                <option value="ALL">All Dirs</option>
                <option value="BUY">LONG</option>
                <option value="SELL">SHORT</option>
              </select>
              <select className={filterSelectClass} value={filterExecution} onChange={e => setFilterExecution(e.target.value)}>
                <option value="ALL">All Exec</option>
                <option value="Perfect">Perfect</option>
                <option value="Early Entry">Early Entry</option>
                <option value="Late Exit">Late Exit</option>
                <option value="FOMO">FOMO</option>
                <option value="None">None</option>
              </select>
              <select className={filterSelectClass} value={filterSetup} onChange={e => setFilterSetup(e.target.value)}>
                <option value="ALL">All Setups</option>
                <option value="A+">A+</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="None">None</option>
              </select>
            </div>

            <div title={
              !hasMfeData ? "MFE/MAE filtering requires a connected broker API." 
              : !isProOrElite ? "MFE Flaw Analyzer is a Pro/Elite feature" 
              : "Show trades that were in profit but closed for a loss"
            }>
              <Button 
                variant={showMfeFlaws ? "primary" : "outline"}
                onClick={() => setShowMfeFlaws(!showMfeFlaws)}
                className={!hasMfeData || !isProOrElite ? "opacity-70 cursor-not-allowed pointer-events-none" : ""}
                leftIcon={<i className={`las ${!hasMfeData || !isProOrElite ? 'la-lock' : 'la-eye'} text-lg`}></i>}
              >
                MFE Flaws
              </Button>
            </div>
            
            <div title={!isProOrElite ? "Exporting is available on Pro/Elite tiers" : "Export your trade history"}>
              <Button 
                variant="outline"
                onClick={handleExportCSV}
                className={!isProOrElite ? "opacity-70 cursor-not-allowed pointer-events-none" : ""}
                leftIcon={<i className={`las ${isProOrElite ? 'la-download' : 'la-lock'} text-lg`}></i>}
              >
                Export
              </Button>
            </div>
            
            <div className="w-48">
              <Input 
                placeholder="Search symbol..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<i className="las la-search text-lg"></i>}
              />
            </div>
            
            <div className="flex items-center gap-2 w-auto">
              <div className="w-36">
                <Input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  leftIcon={<i className="las la-calendar text-lg"></i>}
                />
              </div>
              <span className="text-muted text-sm font-medium">to</span>
              <div className="w-36">
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
              <tr className="bg-[#121212] text-muted text-[10px] font-bold uppercase tracking-widest border-b border-default">
                <th className="px-6 py-4">Open Time</th>
                <th className="px-6 py-4">Symbol</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Volume</th>
                <th className="px-6 py-4">Open Price</th>
                <th className="px-6 py-4 text-right">Net P&L</th>
                <th className="px-4 py-4 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="text-sm bg-[#0a0a0a]">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <i className="las la-filter text-4xl mb-3 opacity-50 text-secondary"></i>
                      <p>No trades match your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTrades.map((trade) => (
                  <tr 
                    key={trade.id} 
                    className="border-b border-default/50 hover:bg-[#121212] transition-colors group cursor-pointer"
                    onClick={() => setSelectedTrade(trade)}
                  >
                    <td className="px-6 py-4 text-secondary font-medium">
                      {new Date(trade.open_time).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${trade.profit_loss >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {trade.symbol}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={trade.direction === 'BUY' ? 'info' : 'warning'} size="sm">
                        {trade.direction}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-secondary font-medium">{(trade.lot_size || trade.quantity || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-muted font-mono">{trade.open_price}</td>
                    <td className={`px-6 py-4 text-right font-bold ${trade.profit_loss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {trade.profit_loss >= 0 ? '+' : ''}{formatMoney(trade.profit_loss - (trade.commission || 0))}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        {onEditTrade && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onEditTrade(trade); }}
                            className="text-muted hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-blue-500/10 mx-1"
                            title="Edit Trade"
                          >
                            <i className="las la-pen text-[16px]"></i>
                          </button>
                        )}
                        {onDeleteTrade && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteTrade(trade.id); }}
                            className="text-muted hover:text-rose-400 transition-colors p-2 rounded-lg hover:bg-rose-500/10 mx-1"
                            title="Delete Trade"
                          >
                            <i className="las la-trash-alt text-[16px]"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Filter Bottom Sheet */}
        {isFilterSheetOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center xl:hidden bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div 
              className="absolute inset-0"
              onClick={() => setIsFilterSheetOpen(false)}
            />
            <div className={`relative w-full border-t border-default rounded-t-3xl shadow-2xl p-6 pb-10 bg-[#0a0a0a] animate-in slide-in-from-bottom-full duration-300 transition-all`}>
              <div className="w-12 h-1.5 bg-neutral-800 rounded-full mx-auto mb-6"></div>
              
              <h3 className="text-xl font-bold text-white mb-6">Filter Trades</h3>
              
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

      <TradeDetailDrawer
        isOpen={selectedTrade !== null}
        onClose={() => setSelectedTrade(null)}
        trade={selectedTrade}
        currency={currency}
      />
    </>
  );
}
