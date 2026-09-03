"use client";

import { useUiStore } from "@/store/useUiStore";
import { TradeDoc } from "@/lib/firebase/schema";
import { format } from "date-fns";

interface TradingPsychologyProps {
  trades: TradeDoc[];
}

export default function TradingPsychology({ trades }: TradingPsychologyProps) {
  const { activeWorkspace } = useUiStore();
  const isDomestic = activeWorkspace === "DOMESTIC";

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MM/dd/yyyy HH:mm:ss");
    } catch {
      return dateStr;
    }
  };

  const getHeader = (t: TradeDoc) => {
    if (isDomestic) {
      const asset = t.domestic_segment === "FNO_OPTIONS" ? `${t.symbol} ${t.strike_price} ${t.option_type}` : t.symbol;
      const direction = t.direction === "BUY" ? "Long" : "Short";
      return `${asset} • ${direction} • ${t.quantity} Qty`;
    } else {
      const direction = t.direction === "BUY" ? "Long" : "Short";
      return `${t.symbol} • ${direction} • ${t.lot_size} Lots`;
    }
  };

  return (
    <div className="space-y-6">
      {trades.map(t => (
        <div key={t.id} className="premium-card p-6 relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full ${(isDomestic ? (t.net_pnl || 0) : t.profit_loss) >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-default ml-2">
            <div>
              <h3 className="font-bold text-primary text-lg tracking-tight">{getHeader(t)}</h3>
              <p className="text-xs text-muted font-mono mt-1 flex items-center gap-2">
                <i className="las la-clock"></i> {formatDate(t.open_time)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted">Realized PnL</p>
              <p className={`text-xl font-bold font-mono ${(isDomestic ? (t.net_pnl || 0) : t.profit_loss) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {(isDomestic ? (t.net_pnl || 0) : t.profit_loss) >= 0 ? '+' : ''}{isDomestic ? '₹' : '$'}{Math.abs(isDomestic ? (t.net_pnl || 0) : t.profit_loss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ml-2">
            <div className="col-span-2 space-y-4">
              <div>
                <p className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Trade Notes</p>
                <div className="premium-inner-box p-4 text-sm text-neutral-300 min-h-[100px] leading-relaxed">
                  {t.notes || "No notes recorded for this trade."}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Psychology Flags</p>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    t.emotion === 'Confident' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    t.emotion === 'FOMO' || t.emotion === 'Revenge' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    'bg-neutral-800 text-secondary border-strong'
                  }`}>
                    {t.emotion || "Neutral"}
                  </span>
                  {t.mistake_tags?.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs font-bold border bg-rose-500/10 text-rose-400 border-rose-500/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {trades.length === 0 && (
        <div className="premium-card p-12 text-center border-dashed border-2 border-default">
          <i className="las la-book-open text-4xl text-secondary mb-3"></i>
          <p className="text-muted font-bold">No journal entries found.</p>
        </div>
      )}
    </div>
  );
}
