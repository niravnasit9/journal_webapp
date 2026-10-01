import { useState } from "react";
import { useUiStore } from "@/store/useUiStore";
import { TradeDoc } from "@/lib/firebase/schema";

interface TradingOverviewProps {
  trades: TradeDoc[];
}

export default function TradingOverview({ trades }: TradingOverviewProps) {
  const { activeWorkspace } = useUiStore();
  const isDomestic = activeWorkspace === "DOMESTIC";

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: isDomestic ? 'INR' : 'USD'
    }).format(val);
  };

  const [includeIpo, setIncludeIpo] = useState(false);
  const filteredTrades = includeIpo ? trades : trades.filter(t => (t as any).domestic_segment !== "IPO");

  const totalTrades = filteredTrades.length;
  let wins = 0;
  let losses = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let largestWin = 0;
  let largestLoss = 0;
  let longWins = 0, longLosses = 0;
  let shortWins = 0, shortLosses = 0;

  filteredTrades.forEach(t => {
    const pnl = isDomestic ? (t.net_pnl || ((t as any).domestic_segment === 'IPO' ? t.profit_loss : 0) || 0) : (t.profit_loss || 0);
    
    let isShort = t.direction === "SELL";
    if (isDomestic && (t as any).option_type) {
      if ((t as any).option_type === "PE") {
        isShort = t.direction === "BUY" || !t.direction; // Default to BUY if missing
      } else if ((t as any).option_type === "CE") {
        isShort = t.direction === "SELL";
      }
    }

    if (pnl > 0) {
      wins++;
      grossProfit += pnl;
      if (pnl > largestWin) largestWin = pnl;
      if (isShort) shortWins++;
      else longWins++;
    } else if (pnl < 0) {
      losses++;
      grossLoss += Math.abs(pnl);
      if (Math.abs(pnl) > largestLoss) largestLoss = Math.abs(pnl);
      if (isShort) shortLosses++;
      else longLosses++;
    }
  });

  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const avgWin = wins > 0 ? grossProfit / wins : 0;
  const avgLoss = losses > 0 ? grossLoss / losses : 0;
  const rewardToRisk = avgLoss > 0 ? (avgWin / avgLoss) : 0;
  
  const longTotal = longWins + longLosses;
  const shortTotal = shortWins + shortLosses;
  const longWinRate = longTotal > 0 ? (longWins / longTotal) * 100 : 0;
  const shortWinRate = shortTotal > 0 ? (shortWins / shortTotal) * 100 : 0;

  const totalVolume = filteredTrades.reduce((sum, t) => sum + (isDomestic ? (Number((t as any).units) || Number((t as any).quantity) || 0) : (Number((t as any).lot_size) || 0)), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Trading Overview</h2>
        <button 
          onClick={() => setIncludeIpo(!includeIpo)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
            includeIpo 
              ? 'bg-blue-500/10 border-blue-500/50 text-blue-500' 
              : 'bg-elevated border-default text-secondary hover:text-primary hover:border-primary/30'
          }`}
          title="Toggle Combined IPO + Trading"
        >
          <i className={`las ${includeIpo ? 'la-compress-arrows-alt' : 'la-expand-arrows-alt'} text-lg`}></i>
          {includeIpo ? 'Combined View' : 'Trading Only'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Core Metrics */}
        <div className="premium-card p-5 group relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-xs text-muted uppercase font-bold tracking-widest mb-1">Average Win</p>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(avgWin)}</p>
        </div>
        <div className="premium-card p-5 group relative overflow-hidden">
          <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-xs text-muted uppercase font-bold tracking-widest mb-1">Average Loss</p>
          <p className="text-xl font-bold text-rose-400">-{formatCurrency(avgLoss)}</p>
        </div>
        <div className="premium-card p-5 group relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-xs text-muted uppercase font-bold tracking-widest mb-1">Largest Win</p>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(largestWin)}</p>
        </div>
        <div className="premium-card p-5 group relative overflow-hidden">
          <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-xs text-muted uppercase font-bold tracking-widest mb-1">Largest Loss</p>
          <p className="text-xl font-bold text-rose-400">-{formatCurrency(largestLoss)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* RRR & Volume */}
        <div className="premium-card p-6 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
            <i className="las la-balance-scale-right text-3xl"></i>
          </div>
          <p className="text-sm font-bold text-muted uppercase tracking-widest">Reward to Risk</p>
          <p className="text-4xl font-black text-slate-900 dark:text-white mt-2 drop-shadow-md">{rewardToRisk.toFixed(2)}</p>
          <p className="text-xs text-slate-500 dark:text-white/50 mt-2">Avg Win vs Avg Loss</p>
        </div>

        <div className="premium-card p-6 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
            <i className="las la-layer-group text-3xl"></i>
          </div>
          <p className="text-sm font-bold text-muted uppercase tracking-widest">{isDomestic ? "Total Volume (Qty)" : "Total Lots Traded"}</p>
          <p className="text-4xl font-black text-slate-900 dark:text-white mt-2 drop-shadow-md">{totalVolume.toLocaleString()}</p>
        </div>

        {/* Long vs Short */}
        <div className="premium-card p-6 flex flex-col justify-center">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-6">Direction Edge</h3>
          
          <div className="mb-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Longs</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{longWinRate.toFixed(1)}% <span className="text-[10px] text-muted">win</span></span>
            </div>
            <div className="h-2 w-full bg-surface/50 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${longWinRate}%` }}></div>
            </div>
            <p className="text-[10px] text-muted mt-1 text-right">{longTotal} trades</p>
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Shorts</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{shortWinRate.toFixed(1)}% <span className="text-[10px] text-muted">win</span></span>
            </div>
            <div className="h-2 w-full bg-surface/50 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: `${shortWinRate}%` }}></div>
            </div>
            <p className="text-[10px] text-muted mt-1 text-right">{shortTotal} trades</p>
          </div>
        </div>
      </div>

      {/* Tax Breakdown */}
      {isDomestic && (
        <div className="premium-card border-t-2 border-t-orange-500 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent"></div>
          <h3 className="relative z-10 text-sm font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2 mb-6">
            <i className="las la-receipt text-lg"></i> Statutory Tax Deductions
          </h3>
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface/50 p-4 rounded-xl border border-white/5">
              <p className="text-[10px] text-muted uppercase font-bold tracking-widest mb-1">Total Brokerage</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">₹{filteredTrades.reduce((s, t) => s + (t.tax_breakdown?.brokerage || 0), 0).toLocaleString()}</p>
            </div>
            <div className="bg-surface/50 p-4 rounded-xl border border-white/5">
              <p className="text-[10px] text-muted uppercase font-bold tracking-widest mb-1">Total STT</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">₹{filteredTrades.reduce((s, t) => s + (t.tax_breakdown?.stt || 0), 0).toLocaleString()}</p>
            </div>
            <div className="bg-surface/50 p-4 rounded-xl border border-white/5">
              <p className="text-[10px] text-muted uppercase font-bold tracking-widest mb-1">Total GST</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">₹{filteredTrades.reduce((s, t) => s + (t.tax_breakdown?.gst || 0), 0).toLocaleString()}</p>
            </div>
            <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/20">
              <p className="text-[10px] text-rose-400 uppercase font-bold tracking-widest mb-1">Total Tax Drag</p>
              <p className="text-lg font-bold text-rose-400">₹{filteredTrades.reduce((s, t) => s + (t.total_taxes || 0), 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
