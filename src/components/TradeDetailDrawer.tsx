"use client";

import React from 'react';
import { TradeDoc } from '@/lib/firebase/schema';

interface TradeDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  trade: TradeDoc | null;
  currency: "USD" | "INR";
}

export const TradeDetailDrawer: React.FC<TradeDetailDrawerProps> = ({ isOpen, onClose, trade, currency }) => {
  if (!isOpen || !trade) return null;

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  const getExecutionColor = (score?: string) => {
    switch (score) {
      case "Perfect": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "Early Entry":
      case "Late Exit": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "FOMO": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      default: return "text-neutral-400 bg-neutral-800/50 border-neutral-700";
    }
  };

  const pnl = trade.profit_loss - (trade.commission || 0);
  const isWin = pnl > 0;
  
  // Calculate duration
  const openTime = new Date(trade.open_time).getTime();
  const closeTime = new Date(trade.close_time).getTime();
  const diffMs = closeTime - openTime;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const durationStr = diffHours > 0 ? `${diffHours}h ${diffMins % 60}m` : `${diffMins}m`;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 z-[110] w-full max-w-md bg-[#0a0a0a] border-l border-neutral-800 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800 bg-[#121212]/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest ${trade.direction === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {trade.direction}
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">{trade.symbol}</h2>
            </div>
            <p className="text-xs text-neutral-400 font-mono">{new Date(trade.open_time).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-500 hover:text-white bg-neutral-900 rounded-full hover:bg-neutral-800 transition-colors">
            <i className="las la-times text-xl"></i>
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
          
          {/* Hero PnL */}
          <div className="flex items-center justify-between bg-[#121212] border border-neutral-800 p-5 rounded-xl">
            <div>
              <span className="block text-[10px] uppercase font-bold text-neutral-500 tracking-wider mb-1">Net P&L</span>
              <span className={`text-3xl font-black ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isWin ? '+' : ''}{formatMoney(pnl)}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] uppercase font-bold text-neutral-500 tracking-wider mb-1">Duration</span>
              <span className="text-lg font-bold text-white">{durationStr}</span>
            </div>
          </div>

          {/* Core Metrics */}
          <div>
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <i className="las la-crosshairs"></i> Trade Anatomy
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#121212] border border-neutral-800 p-4 rounded-lg">
                <span className="block text-[10px] uppercase font-bold text-neutral-500 tracking-wider mb-1">Lot Size</span>
                <span className="text-sm font-bold text-white">{(trade.lot_size || trade.quantity || 0).toFixed(2)}</span>
              </div>
              <div className="bg-[#121212] border border-neutral-800 p-4 rounded-lg">
                <span className="block text-[10px] uppercase font-bold text-neutral-500 tracking-wider mb-1">Realized R:R</span>
                <span className="text-sm font-bold text-white">{trade.risk_reward_ratio ? `1 : ${trade.risk_reward_ratio}` : 'N/A'}</span>
              </div>
              <div className="bg-[#121212] border border-neutral-800 p-4 rounded-lg">
                <span className="block text-[10px] uppercase font-bold text-neutral-500 tracking-wider mb-1">Entry Price</span>
                <span className="text-sm font-mono text-neutral-300">{trade.open_price}</span>
              </div>
              <div className="bg-[#121212] border border-neutral-800 p-4 rounded-lg">
                <span className="block text-[10px] uppercase font-bold text-neutral-500 tracking-wider mb-1">Exit Price</span>
                <span className="text-sm font-mono text-neutral-300">{trade.close_price}</span>
              </div>
              <div className="bg-[#121212] border border-neutral-800 p-4 rounded-lg">
                <span className="block text-[10px] uppercase font-bold text-neutral-500 tracking-wider mb-1">Stop Loss</span>
                <span className="text-sm font-mono text-neutral-300">{trade.stop_loss_price || 'N/A'}</span>
              </div>
              <div className="bg-[#121212] border border-neutral-800 p-4 rounded-lg">
                <span className="block text-[10px] uppercase font-bold text-neutral-500 tracking-wider mb-1">Take Profit</span>
                <span className="text-sm font-mono text-neutral-300">{trade.take_profit_price || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Psychology & Execution */}
          <div>
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <i className="las la-brain"></i> Psychology & Execution
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-[#121212] border border-neutral-800 p-3 rounded-lg">
                <span className="text-sm font-semibold text-neutral-400">Execution Score</span>
                <span className={`px-2 py-1 rounded text-xs font-bold border ${getExecutionColor(trade.execution_score)}`}>
                  {trade.execution_score || 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between bg-[#121212] border border-neutral-800 p-3 rounded-lg">
                <span className="text-sm font-semibold text-neutral-400">Emotion</span>
                <span className="text-sm font-bold text-white">{trade.emotion || 'Neutral'}</span>
              </div>
              <div className="flex items-center justify-between bg-[#121212] border border-neutral-800 p-3 rounded-lg">
                <span className="text-sm font-semibold text-neutral-400">Setup Grade</span>
                <span className="text-sm font-bold text-white">{trade.setup_grade || 'None'}</span>
              </div>
            </div>
          </div>

          {/* Charts */}
          {(trade.entry_chart_url || trade.exit_chart_url) && (
            <div>
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <i className="las la-chart-area"></i> Chart Evidence
              </h3>
              <div className="space-y-4">
                {trade.entry_chart_url && (
                  <a href={trade.entry_chart_url} target="_blank" rel="noopener noreferrer" className="block bg-[#121212] border border-neutral-800 hover:border-blue-500/50 p-4 rounded-lg transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">Entry Chart</span>
                      <i className="las la-external-link-alt text-neutral-500 group-hover:text-blue-400"></i>
                    </div>
                    {trade.entry_chart_url.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                      <div className="w-full h-32 bg-neutral-900 rounded border border-neutral-800 overflow-hidden relative mt-3">
                         {/* eslint-disable-next-line @next/next/no-img-element */}
                         <img src={trade.entry_chart_url} alt="Entry Chart" className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500 truncate">{trade.entry_chart_url}</p>
                    )}
                  </a>
                )}
                {trade.exit_chart_url && (
                  <a href={trade.exit_chart_url} target="_blank" rel="noopener noreferrer" className="block bg-[#121212] border border-neutral-800 hover:border-blue-500/50 p-4 rounded-lg transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">Exit Chart</span>
                      <i className="las la-external-link-alt text-neutral-500 group-hover:text-blue-400"></i>
                    </div>
                    {trade.exit_chart_url.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                      <div className="w-full h-32 bg-neutral-900 rounded border border-neutral-800 overflow-hidden relative mt-3">
                         {/* eslint-disable-next-line @next/next/no-img-element */}
                         <img src={trade.exit_chart_url} alt="Exit Chart" className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500 truncate">{trade.exit_chart_url}</p>
                    )}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {trade.notes && trade.notes !== "Manual Entry" && (
            <div>
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <i className="las la-sticky-note"></i> Trade Notes
              </h3>
              <div className="bg-[#121212] border border-neutral-800 p-4 rounded-lg">
                <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">{trade.notes}</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};
