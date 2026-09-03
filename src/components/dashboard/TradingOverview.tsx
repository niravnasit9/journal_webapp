"use client";

import { useUiStore } from "@/store/useUiStore";
import { TradeDoc } from "@/lib/firebase/schema";

interface TradingOverviewProps {
  trades: TradeDoc[];
}

export default function TradingOverview({ trades }: TradingOverviewProps) {
  const { activeWorkspace } = useUiStore();
  const isDomestic = activeWorkspace === "DOMESTIC";

  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? (trades.filter(t => (isDomestic ? (t.net_pnl || 0) : t.profit_loss) > 0).length / totalTrades) * 100 : 0;
  const totalVolume = trades.reduce((sum, t) => sum + (isDomestic ? (t.quantity || 0) : (t.lot_size || 0)), 0);
  const totalPoints = trades.reduce((sum, t) => sum + (t.pips || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="premium-inner-box p-4">
          <p className="text-xs text-muted uppercase font-bold">Win Rate</p>
          <p className="text-xl font-bold text-primary mt-1">{winRate.toFixed(1)}%</p>
        </div>
        <div className="premium-inner-box p-4">
          <p className="text-xs text-muted uppercase font-bold">Total Trades</p>
          <p className="text-xl font-bold text-primary mt-1">{totalTrades}</p>
        </div>
        <div className="premium-inner-box p-4">
          <p className="text-xs text-muted uppercase font-bold">{isDomestic ? "Total Quantity" : "Total Lots"}</p>
          <p className="text-xl font-bold text-primary mt-1">{totalVolume.toLocaleString()}</p>
        </div>
        <div className="premium-inner-box p-4">
          <p className="text-xs text-muted uppercase font-bold">{isDomestic ? "Total Points" : "Total Pips"}</p>
          <p className="text-xl font-bold text-primary mt-1">{totalPoints.toLocaleString()}</p>
        </div>
      </div>

      {isDomestic && (
        <div className="premium-inner-box border border-orange-500/20 bg-orange-500/5 p-5">
          <h3 className="text-sm font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <i className="las la-receipt text-lg"></i> Statutory Tax Deductions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#1a1a1a] p-3 rounded-lg border border-default">
              <p className="text-[10px] text-muted uppercase font-bold mb-1">Total Brokerage</p>
              <p className="text-sm font-bold text-primary">₹{trades.reduce((s, t) => s + (t.tax_breakdown?.brokerage || 0), 0).toLocaleString()}</p>
            </div>
            <div className="bg-[#1a1a1a] p-3 rounded-lg border border-default">
              <p className="text-[10px] text-muted uppercase font-bold mb-1">Total STT</p>
              <p className="text-sm font-bold text-primary">₹{trades.reduce((s, t) => s + (t.tax_breakdown?.stt || 0), 0).toLocaleString()}</p>
            </div>
            <div className="bg-[#1a1a1a] p-3 rounded-lg border border-default">
              <p className="text-[10px] text-muted uppercase font-bold mb-1">Total GST</p>
              <p className="text-sm font-bold text-primary">₹{trades.reduce((s, t) => s + (t.tax_breakdown?.gst || 0), 0).toLocaleString()}</p>
            </div>
            <div className="bg-[#1a1a1a] p-3 rounded-lg border border-rose-500/20">
              <p className="text-[10px] text-rose-400 uppercase font-bold mb-1">Total Tax Drag</p>
              <p className="text-sm font-bold text-rose-400">₹{trades.reduce((s, t) => s + (t.total_taxes || 0), 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
