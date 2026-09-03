"use client";

import React, { useMemo } from 'react';
import { TradeDoc } from '@/lib/firebase/schema';
import { useAuth } from '@/lib/firebase/authContext';
import Link from 'next/link';

export const SessionHeatmap: React.FC<{ trades: TradeDoc[] }> = ({ trades }) => {
  const { tier } = useAuth();
  const isElite = tier === 'elite';

  const { heatmapData, bestSession } = useMemo(() => {
    if (!isElite || trades.length < 10) return { heatmapData: [], bestSession: null };

    // Initialize 24x5 grid (Mon-Fri)
    const days = [1, 2, 3, 4, 5]; // 0 is Sun, 6 is Sat. Ignore weekends for typical prop firm
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    const grid: Record<string, { wins: number, total: number, pnl: number }> = {};
    days.forEach(d => {
      hours.forEach(h => {
        grid[`${d}-${h}`] = { wins: 0, total: 0, pnl: 0 };
      });
    });

    trades.forEach(t => {
      const date = new Date(t.open_time);
      const d = date.getDay();
      const h = date.getHours();
      
      if (d >= 1 && d <= 5) {
        const net = t.profit_loss - (t.commission || 0);
        const key = `${d}-${h}`;
        if (grid[key]) {
          grid[key].total++;
          grid[key].pnl += net;
          if (net > 0) grid[key].wins++;
        }
      }
    });

    let bestKey = "";
    let bestPnl = -Infinity;

    const dataMatrix = hours.map(h => {
      const rowData = days.map(d => {
        const key = `${d}-${h}`;
        const cell = grid[key];
        if (cell.pnl > bestPnl && cell.total >= 2) {
          bestPnl = cell.pnl;
          bestKey = key;
        }
        return {
          day: d,
          hour: h,
          pnl: cell.pnl,
          winRate: cell.total > 0 ? cell.wins / cell.total : 0,
          total: cell.total
        };
      });
      return { hour: h, days: rowData };
    });

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let sessionSummary = null;
    if (bestKey && bestPnl > 0) {
      const [d, h] = bestKey.split('-').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      sessionSummary = `You make optimal profit on ${dayNames[d]}s at ${h12}:00 ${ampm}.`;
    }

    return { heatmapData: dataMatrix, bestSession: sessionSummary };
  }, [trades, isElite]);

  if (!isElite) {
    return (
      <div className="bg-[#0a0a0a] border border-default rounded-2xl p-6 shadow-xl w-full relative overflow-hidden h-[400px]">
        <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-md z-10 flex flex-col items-center justify-center text-center p-6">
          <div className="w-16 h-16 bg-[#121212] rounded-full flex items-center justify-center border border-default mb-4">
            <i className="las la-lock text-3xl text-secondary"></i>
          </div>
          <h3 className="text-xl font-black text-white mb-2">Algorithmic Session Heatmap Locked</h3>
          <p className="text-sm text-secondary font-medium mb-6 max-w-sm">
            Upgrade to Elite to auto-detect your most profitable trading hours and days using institutional heatmaps.
          </p>
          <Link href="/pricing" className="bg-[#a855f7] hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-bold transition-colors">
            Upgrade to Elite
          </Link>
        </div>
        <div className="opacity-20 pointer-events-none blur-sm w-full h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Session Heatmap</h2>
          </div>
          <div className="h-[250px] bg-neutral-900 rounded-lg grid grid-cols-5 gap-1 p-2">
             {Array.from({length: 20}).map((_, i) => <div key={i} className="bg-[#a855f7]/30 rounded"></div>)}
          </div>
        </div>
      </div>
    );
  }

  if (trades.length < 10) {
    return (
      <div className="bg-[#0a0a0a] border border-default rounded-2xl p-6 shadow-xl w-full h-[400px] flex flex-col items-center justify-center text-center">
        <i className="las la-th text-6xl text-neutral-800 mb-4"></i>
        <h2 className="text-xl font-bold text-white tracking-tight">Session Heatmap</h2>
        <p className="text-sm text-muted mt-2">Log at least 10 trades to map your most profitable time windows.</p>
      </div>
    );
  }

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  return (
    <div className="bg-[#0a0a0a] border border-default rounded-2xl p-6 shadow-xl w-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <i className="las la-th text-[#a855f7]"></i> Algorithmic Session Heatmap
        </h2>
        {bestSession && (
          <div className="mt-4 bg-[#a855f7]/10 border border-[#a855f7]/20 p-4 rounded-xl">
            <p className="text-sm text-white font-medium">
              <span className="text-[#a855f7] font-bold">Optimal Window Detected:</span> {bestSession}
            </p>
          </div>
        )}
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <div className="min-w-[500px]">
          <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr] gap-1 mb-2">
            <div></div>
            {dayLabels.map(d => (
              <div key={d} className="text-center text-xs font-bold text-muted uppercase">{d}</div>
            ))}
          </div>
          
          <div className="space-y-1">
            {heatmapData.map((row) => {
              // Only render hours that have trades globally (optional) or just 6am to 6pm
              if (row.hour < 6 || row.hour > 18) return null; // Filter to core market hours for cleanliness
              
              const ampm = row.hour >= 12 ? 'pm' : 'am';
              const h12 = row.hour % 12 || 12;
              
              return (
                <div key={row.hour} className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr] gap-1 h-8">
                  <div className="text-right pr-2 text-xs text-muted flex items-center justify-end">{`${h12}${ampm}`}</div>
                  {row.days.map((cell, idx) => {
                    let bgColor = 'bg-[#121212]';
                    if (cell.total > 0) {
                      if (cell.pnl > 0) {
                        bgColor = cell.pnl > 500 ? 'bg-emerald-500' : 'bg-emerald-500/50';
                      } else {
                        bgColor = cell.pnl < -500 ? 'bg-rose-500' : 'bg-rose-500/50';
                      }
                    }

                    return (
                      <div 
                        key={idx} 
                        className={`${bgColor} rounded-md relative group flex items-center justify-center transition-colors hover:ring-2 hover:ring-white`}
                      >
                        {cell.total > 0 && <span className="text-[10px] text-white/50 font-medium">{cell.total}</span>}
                        {cell.total > 0 && (
                          <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#121212] border border-default text-white text-xs p-2 rounded shadow-xl z-20 pointer-events-none whitespace-nowrap">
                            <p className="font-bold">P&L: ${cell.pnl.toFixed(2)}</p>
                            <p className="text-secondary">Win Rate: {(cell.winRate * 100).toFixed(0)}%</p>
                            <p className="text-secondary">Trades: {cell.total}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
