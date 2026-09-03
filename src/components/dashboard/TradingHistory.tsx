"use client";

import { useUiStore } from "@/store/useUiStore";
import { TradeDoc } from "@/lib/firebase/schema";
import { format } from "date-fns";

interface TradingHistoryProps {
  trades: TradeDoc[];
}

export default function TradingHistory({ trades }: TradingHistoryProps) {
  const { activeWorkspace } = useUiStore();
  const isDomestic = activeWorkspace === "DOMESTIC";

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: isDomestic ? 'INR' : 'USD'
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MM/dd/yyyy HH:mm:ss");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="premium-card p-0 overflow-hidden">
      <div className="bg-[#121212] border-b border-neutral-800 p-5">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest">Trading Ledger</h2>
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-[#1a1a1a] text-neutral-500 text-[10px] font-bold uppercase tracking-widest border-b border-neutral-800">
              <th className="px-6 py-4">Entry Time</th>
              <th className="px-6 py-4">Exit Time</th>
              {isDomestic ? (
                <>
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4">Direction</th>
                  <th className="px-6 py-4">Qty</th>
                  <th className="px-6 py-4 text-right">Taxes</th>
                  <th className="px-6 py-4 text-right">Net PnL</th>
                </>
              ) : (
                <>
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4">Direction</th>
                  <th className="px-6 py-4">Lots</th>
                  <th className="px-6 py-4">Pips</th>
                  <th className="px-6 py-4 text-right">Gross PnL</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {trades.map(t => (
              <tr key={t.id} className="hover:bg-[#121212]/50 transition-colors">
                <td className="px-6 py-4 text-neutral-400 font-mono text-xs">{formatDate(t.open_time)}</td>
                <td className="px-6 py-4 text-neutral-400 font-mono text-xs">{formatDate(t.close_time)}</td>
                {isDomestic ? (
                  <>
                    <td className="px-6 py-4 font-bold text-white">
                      {t.domestic_segment === "FNO_OPTIONS" ? `${t.symbol} ${t.strike_price} ${t.option_type}` : t.symbol}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${t.direction === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                        {t.direction}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-300 font-mono">{t.quantity || 0}</td>
                    <td className="px-6 py-4 text-right text-rose-400 font-mono text-xs">{formatCurrency(t.total_taxes || 0)}</td>
                    <td className="px-6 py-4 text-right font-bold font-mono">
                      <span className={(t.net_pnl || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {formatCurrency(t.net_pnl || 0)}
                      </span>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 font-bold text-white">{t.symbol}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${t.direction === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                        {t.direction}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-300 font-mono">{t.lot_size || 0}</td>
                    <td className="px-6 py-4 text-neutral-300 font-mono">{t.pips || 0}</td>
                    <td className="px-6 py-4 text-right font-bold font-mono">
                      <span className={(t.profit_loss || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {formatCurrency(t.profit_loss || 0)}
                      </span>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {trades.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-neutral-500 font-bold">No trades found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
