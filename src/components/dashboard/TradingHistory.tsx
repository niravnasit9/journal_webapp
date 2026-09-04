"use client";

import { useUiStore } from "@/store/useUiStore";
import { TradeDoc } from "@/lib/firebase/schema";
import { format } from "date-fns";

interface TradingHistoryProps {
  trades: TradeDoc[];
  onEditTrade?: (trade: TradeDoc) => void;
  onDeleteTrade?: (tradeId: string) => void;
}

export default function TradingHistory({ trades, onEditTrade, onDeleteTrade }: TradingHistoryProps) {
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
      <div className="bg-elevated border-b border-default p-5">
        <h2 className="text-sm font-bold text-primary uppercase tracking-widest">Trading Ledger</h2>
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-elevated text-muted text-[10px] font-bold uppercase tracking-widest border-b border-default">
              <th className="px-6 py-4">Entry Time</th>
              <th className="px-6 py-4">Exit Time</th>
              {isDomestic ? (
                <>
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4">Qty</th>
                  <th className="px-6 py-4 text-right">Gross PnL</th>
                  <th className="px-6 py-4 text-right">Taxes</th>
                  <th className="px-6 py-4 text-right">Net PnL</th>
                </>
              ) : (
                <>
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4">Lots</th>
                  <th className="px-6 py-4">Pips</th>
                  <th className="px-6 py-4 text-right">Gross PnL</th>
                </>
              )}
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-default">
            {trades.map(t => (
              <tr key={t.id} className="hover:bg-elevated/50 transition-colors group">
                <td className="px-6 py-4 text-secondary font-mono text-xs">{formatDate(t.open_time)}</td>
                <td className="px-6 py-4 text-secondary font-mono text-xs">{formatDate(t.close_time)}</td>
                {isDomestic ? (
                  <>
                    <td className="px-6 py-4 font-bold text-primary">
                      {t.domestic_segment === "FNO_OPTIONS" ? `${t.symbol} ${t.strike_price} ${t.option_type}` : t.symbol}
                    </td>
                    <td className="px-6 py-4 text-secondary font-mono">{t.quantity || 0}</td>
                    <td className="px-6 py-4 text-right font-mono text-xs">
                      <span className={(t.profit_loss || t.gross_pnl || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {formatCurrency(t.profit_loss || t.gross_pnl || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-rose-400 font-mono text-xs">{formatCurrency(t.total_taxes || 0)}</td>
                    <td className="px-6 py-4 text-right font-bold font-mono">
                      <span className={(t.net_pnl || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {formatCurrency(t.net_pnl || 0)}
                      </span>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 font-bold text-primary">{t.symbol}</td>
                    <td className="px-6 py-4 text-secondary font-mono">{t.lot_size || 0}</td>
                    <td className="px-6 py-4 text-secondary font-mono">{t.pips || 0}</td>
                    <td className="px-6 py-4 text-right font-bold font-mono">
                      <span className={(t.profit_loss || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {formatCurrency(t.profit_loss || 0)}
                      </span>
                    </td>
                  </>
                )}
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                    {onEditTrade && (
                      <button 
                        onClick={() => onEditTrade(t)}
                        className="text-muted hover:text-blue-400 transition-colors p-1.5 rounded-lg hover:bg-blue-500/10"
                        title="Edit Trade"
                      >
                        <i className="las la-pen text-[16px]"></i>
                      </button>
                    )}
                    {onDeleteTrade && (
                      <button 
                        onClick={() => onDeleteTrade(t.id)}
                        className="text-muted hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-rose-500/10"
                        title="Delete Trade"
                      >
                        <i className="las la-trash-alt text-[16px]"></i>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {trades.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-muted font-bold">No trades found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
