"use client";

import { useState } from "react";
import { TradeDoc } from "@/lib/firebase/schema";

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

  const filteredTrades = trades.filter(trade => {
    const matchesSearch = trade.symbol.toLowerCase().includes(search.toLowerCase());
    let matchesDate = true;
    if (startDate && endDate) {
      matchesDate = trade.open_time >= startDate && trade.open_time <= endDate;
    }
    return matchesSearch && matchesDate;
  });

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-yellow-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col font-sans">
      {/* Table Header / Filters */}
      <div className="p-4 md:p-6 border-b border-yellow-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-gray-50 dark:bg-gray-950">
        <div className="flex justify-between items-center w-full md:w-auto">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Trade History</h2>
          
          {/* Mobile Filter Button */}
          <button 
            onClick={() => setIsFilterSheetOpen(true)}
            className="md:hidden flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#111827] text-gray-700 dark:text-slate-300 text-sm font-bold rounded-lg border border-yellow-200 dark:border-slate-800"
          >
            <i className="las la-filter"></i> Filters
          </button>
        </div>
        
        {/* Desktop Filters */}
        <div className="hidden md:flex flex-row gap-3 w-auto">
          {/* Search */}
          <div className="relative w-56">
            <i className="las la-search text-[16px] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"></i>
            <input 
              type="text" 
              placeholder="Search symbol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-400 dark:text-slate-500"
            />
          </div>
          
          {/* Date Range */}
          <div className="flex items-center gap-2 w-auto">
            <div className="relative w-40">
              <i className="las la-calendar text-[16px] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"></i>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-9 pr-2 py-2 bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-300 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 transition-all dark:[color-scheme:dark] [color-scheme:light]"
              />
            </div>
            <span className="text-gray-400 dark:text-slate-500 text-sm font-medium">to</span>
            <div className="relative w-40">
              <i className="las la-calendar text-[16px] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"></i>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-9 pr-2 py-2 bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-300 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 transition-all dark:[color-scheme:dark] [color-scheme:light]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-[#f8f9fa] dark:bg-[#0f1523] text-gray-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest border-b border-yellow-200 dark:border-slate-800">
              <th className="px-6 py-4">Open Time</th>
              <th className="px-6 py-4">Symbol</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Volume</th>
              <th className="px-6 py-4">Open Price</th>
              <th className="px-6 py-4 text-right">Profit/Loss</th>
              <th className="px-4 py-4 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredTrades.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <i className="las la-filter text-4xl mb-3 opacity-50"></i>
                    <p>No trades match your criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTrades.map((trade) => (
                <tr key={trade.id} className="border-b border-yellow-200 dark:border-slate-800/50 hover:bg-[#e5e7eb] dark:bg-slate-800/40 transition-colors group">
                  <td className="px-6 py-4 text-gray-700 dark:text-slate-300 font-medium">
                    {new Date(trade.open_time).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${trade.profit_loss >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {trade.symbol}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                      trade.direction === 'BUY' 
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                        : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    }`}>
                      {trade.direction}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-slate-300 font-medium">{trade.lot_size.toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-slate-400">{trade.open_price}</td>
                  <td className={`px-6 py-4 text-right font-bold ${trade.profit_loss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {trade.profit_loss >= 0 ? '+' : ''}${trade.profit_loss.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {onEditTrade && (
                      <button 
                        onClick={() => onEditTrade(trade)}
                        className="text-slate-600 hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-blue-500/10"
                        title="Edit Trade"
                      >
                        <i className="las la-pen text-[16px]"></i>
                      </button>
                    )}
                    {onDeleteTrade && (
                      <button 
                        onClick={() => onDeleteTrade(trade.id)}
                        className="text-slate-600 hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-rose-500/10"
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
          <div className="relative w-full bg-white dark:bg-[#111827] rounded-t-3xl border-t border-yellow-200 dark:border-slate-800 shadow-2xl p-6 pb-10 animate-in slide-in-from-bottom-full duration-300">
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Filter Trades</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-2">Search Symbol</label>
                <div className="relative w-full">
                  <i className="las la-search text-[16px] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"></i>
                  <input 
                    type="text" 
                    placeholder="Search symbol..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-300 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-400 dark:text-slate-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-2">Date Range</label>
                <div className="flex items-center gap-3 w-full">
                  <div className="relative flex-1">
                    <i className="las la-calendar text-[16px] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"></i>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-9 pr-2 py-3 bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-300 dark:border-slate-700 rounded-xl text-sm text-gray-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 transition-all dark:[color-scheme:dark] [color-scheme:light]"
                    />
                  </div>
                  <span className="text-gray-400 dark:text-slate-500 text-sm font-medium">to</span>
                  <div className="relative flex-1">
                    <i className="las la-calendar text-[16px] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"></i>
                    <input 
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-9 pr-2 py-3 bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-300 dark:border-slate-700 rounded-xl text-sm text-gray-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 transition-all dark:[color-scheme:dark] [color-scheme:light]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => setIsFilterSheetOpen(false)}
                  className="w-full py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl transition-all shadow-lg"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
