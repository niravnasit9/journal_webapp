"use client";

import { useState, useEffect, useMemo } from "react";
import { addManualTradeAction } from "@/app/actions/tradeActions";
import toast from "react-hot-toast";
import { calculatePnL } from "@/utils/pnlCalculator";
import { calculateDomesticTaxes, DomesticSegment } from "@/utils/brokerageMath";
import { useAuth } from "@/lib/firebase/authContext";
import { PremiumDateTimePicker } from "@/components/ui/PremiumDateTimePicker";
import { useUiStore } from "@/store/useUiStore";

const SYMBOL_PRESETS = ["XAUUSD", "BTCUSD", "XAGUSD", "USOIL"];

export default function AddTradeModal({ 
  accountId, 
  accountCurrency = "USD",
  isOpen, 
  onClose, 
  onAdded 
}: { 
  accountId: string, 
  accountCurrency?: "USD" | "INR",
  isOpen: boolean, 
  onClose: () => void, 
  onAdded: () => void 
}) {
  const [loading, setLoading] = useState(false);
  const [usdInrRate] = useState(83.50);
  const { tier } = useAuth();
  const { activeWorkspace } = useUiStore();
  const isDomestic = activeWorkspace === "DOMESTIC";
  const isProOrElite = tier === 'pro' || tier === 'elite';
  
  // Symbol selection states
  const [symbolMode, setSymbolMode] = useState<"preset" | "other">("preset");
  const [selectedPreset, setSelectedPreset] = useState("XAUUSD");
  const [customSymbol, setCustomSymbol] = useState("");

  const [formData, setFormData] = useState({
    direction: "BUY" as "BUY" | "SELL",
    lot_size: "",
    open_price: "",
    close_price: "",
    stop_loss_price: "",
    take_profit_price: "",
    profit_loss: "",
    commission: "",
    emotion: "Neutral" as any,
    setup_grade: "B" as any,
    execution_score: "None" as any,
    entry_chart_url: "",
    exit_chart_url: "",
    open_time: new Date().toISOString(),
    close_time: new Date().toISOString(),
    // Domestic specific
    domestic_segment: "FNO_OPTIONS" as DomesticSegment,
    option_type: "CE" as "CE" | "PE",
    strike_price: "",
    quantity: "",
    total_taxes: "",
    net_pnl: "",
    tax_breakdown: {} as any
  });

  const currentSymbol = symbolMode === "preset" ? selectedPreset : customSymbol;

  const handleDateChange = (field: 'open_time' | 'close_time', date: Date | null) => {
    if (!date) return;
    setFormData(prev => ({ ...prev, [field]: date.toISOString() }));
  };

  // GLOBAL P&L CALC
  useEffect(() => {
    if (!isDomestic && currentSymbol && formData.open_price && formData.close_price && formData.lot_size) {
      const pnl = calculatePnL({
        symbol: currentSymbol,
        direction: formData.direction,
        lotSize: Number(formData.lot_size),
        openPrice: Number(formData.open_price),
        closePrice: Number(formData.close_price),
        accountCurrency,
        usdInrRate
      });
      if (!isNaN(pnl)) {
        setFormData(prev => ({ ...prev, profit_loss: pnl.toFixed(2) }));
      }
    }
  }, [!isDomestic, currentSymbol, formData.direction, formData.open_price, formData.close_price, formData.lot_size]);

  // DOMESTIC P&L & TAX CALC
  useEffect(() => {
    if (isDomestic && formData.open_price && formData.close_price && formData.quantity) {
      let buyPrice: number;
      let sellPrice: number;
      
      if (formData.domestic_segment === "FNO_OPTIONS") {
        // Option buyers use direction to mean sentiment (CE=BUY, PE=SELL)
        // But execution is always buy to open, sell to close
        buyPrice = Number(formData.open_price);
        sellPrice = Number(formData.close_price);
      } else {
        buyPrice = formData.direction === "BUY" ? Number(formData.open_price) : Number(formData.close_price);
        sellPrice = formData.direction === "BUY" ? Number(formData.close_price) : Number(formData.open_price);
      }
      
      const taxResult = calculateDomesticTaxes(
        formData.domestic_segment,
        buyPrice,
        sellPrice,
        Number(formData.quantity)
      );

      setFormData(prev => ({
        ...prev,
        profit_loss: taxResult.grossPnl.toString(), // gross
        net_pnl: taxResult.netPnl.toString(),
        total_taxes: taxResult.totalTaxes.toString(),
        tax_breakdown: taxResult.breakdown
      }));
    }
  }, [isDomestic, formData.domestic_segment, formData.direction, formData.open_price, formData.close_price, formData.quantity]);


  const riskRewardRatio = useMemo(() => {
    const op = Number(formData.open_price);
    const sl = Number(formData.stop_loss_price);
    const tp = Number(formData.take_profit_price);

    if (isNaN(op) || isNaN(sl) || isNaN(tp) || op === sl) return null;
    
    const risk = Math.abs(op - sl);
    const reward = Math.abs(tp - op);
    
    return risk > 0 ? reward / risk : null;
  }, [formData.open_price, formData.stop_loss_price, formData.take_profit_price]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        account_id: accountId,
        symbol: currentSymbol,
        direction: formData.direction,
        open_price: Number(formData.open_price),
        close_price: Number(formData.close_price),
        open_time: formData.open_time,
        close_time: formData.close_time,
        profit_loss: Number(formData.profit_loss),
        commission: Number(formData.commission) || 0,
        stop_loss_price: formData.stop_loss_price ? Number(formData.stop_loss_price) : undefined,
        take_profit_price: formData.take_profit_price ? Number(formData.take_profit_price) : undefined,
        risk_reward_ratio: riskRewardRatio,
        emotion: formData.emotion,
        setup_grade: formData.setup_grade,
        execution_score: formData.execution_score,
        entry_chart_url: formData.entry_chart_url || "",
        exit_chart_url: formData.exit_chart_url || "",
      };

      if (isDomestic) {
        payload.domestic_segment = formData.domestic_segment;
        payload.quantity = Number(formData.quantity);
        payload.total_taxes = Number(formData.total_taxes);
        payload.net_pnl = Number(formData.net_pnl);
        payload.tax_breakdown = formData.tax_breakdown;
        payload.gross_pnl = Number(formData.profit_loss);
        if (formData.domestic_segment === "FNO_OPTIONS") {
          payload.strike_price = Number(formData.strike_price);
          payload.option_type = formData.option_type;
        }
      } else {
        payload.lot_size = Number(formData.lot_size);
        payload.pips = Math.abs(Number(formData.close_price) - Number(formData.open_price)) * 10000;
      }

      // Remove undefined values
      const cleanPayload = Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== undefined));

      const res = await addManualTradeAction(accountId, cleanPayload as any);
      if (res.success) {
        toast.success("Trade recorded successfully");
        onAdded();
        onClose();
      } else {
        toast.error(res.error || "Failed to add trade");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="premium-card w-full max-w-4xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors">
          <i className="las la-times text-2xl"></i>
        </button>
        <h2 className="text-xl font-bold text-primary mb-6">
          Log {isDomestic ? 'Domestic' : 'Global'} Trade
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-secondary uppercase tracking-widest border-b border-default pb-2">Execution Details</h3>
              
              {isDomestic ? (
                <>
                  <div>
                    <label className="label-premium block mb-2">Segment</label>
                    <select 
                      className="input-premium w-full"
                      value={formData.domestic_segment}
                      onChange={e => setFormData({...formData, domestic_segment: e.target.value as DomesticSegment})}
                    >
                      <option value="FNO_OPTIONS">F&O Options</option>
                      <option value="FNO_FUTURES">F&O Futures</option>
                      <option value="EQUITY_INTRADAY">Equity Intraday</option>
                      <option value="EQUITY_DELIVERY">Equity Delivery</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-premium block mb-2">Asset Symbol</label>
                      <input type="text" className="input-premium w-full uppercase" value={customSymbol} onChange={e => {setSymbolMode("other"); setCustomSymbol(e.target.value.toUpperCase());}} placeholder="e.g. RELIANCE" required />
                    </div>
                    {formData.domestic_segment === "FNO_OPTIONS" && (
                      <div>
                        <label className="label-premium block mb-2">Strike & Type</label>
                        <div className="flex gap-2">
                          <input type="number" className="input-premium w-2/3" placeholder="Strike" value={formData.strike_price} onChange={e => setFormData({...formData, strike_price: e.target.value})} required />
                          <select className="input-premium w-1/3 p-1" value={formData.option_type} onChange={e => {
                            const type = e.target.value as "CE"|"PE";
                            setFormData({
                              ...formData, 
                              option_type: type,
                              direction: type === "CE" ? "BUY" : "SELL"
                            });
                          }}>
                            <option value="CE">CE</option>
                            <option value="PE">PE</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-premium block mb-2">Direction</label>
                      <select className="input-premium w-full" value={formData.direction} onChange={e => setFormData({...formData, direction: e.target.value as "BUY"|"SELL"})}>
                        <option value="BUY">Long / Buy</option>
                        <option value="SELL">Short / Sell</option>
                      </select>
                    </div>
                    <div>
                      <label className="label-premium block mb-2">Quantity</label>
                      <input type="number" step="1" className="input-premium w-full" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="label-premium block mb-2">Asset Symbol</label>
                    <div className="flex gap-2 mb-2">
                      <button type="button" onClick={() => setSymbolMode("preset")} className={`flex-1 py-1 text-xs rounded-lg border ${symbolMode === 'preset' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 font-bold' : 'bg-transparent border-default text-muted'}`}>Presets</button>
                      <button type="button" onClick={() => setSymbolMode("other")} className={`flex-1 py-1 text-xs rounded-lg border ${symbolMode === 'other' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 font-bold' : 'bg-transparent border-default text-muted'}`}>Custom</button>
                    </div>
                    {symbolMode === "preset" ? (
                      <select className="input-premium w-full" value={selectedPreset} onChange={e => setSelectedPreset(e.target.value)}>
                        {SYMBOL_PRESETS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input type="text" className="input-premium w-full uppercase" value={customSymbol} onChange={e => setCustomSymbol(e.target.value.toUpperCase())} placeholder="e.g. GBPJPY" required />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-premium block mb-2">Direction</label>
                      <select className="input-premium w-full" value={formData.direction} onChange={e => setFormData({...formData, direction: e.target.value as "BUY"|"SELL"})}>
                        <option value="BUY">Long / Buy</option>
                        <option value="SELL">Short / Sell</option>
                      </select>
                    </div>
                    <div>
                      <label className="label-premium block mb-2">Lot Size</label>
                      <input type="number" step="0.01" className="input-premium w-full" value={formData.lot_size} onChange={e => setFormData({...formData, lot_size: e.target.value})} required />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-premium block mb-2">Entry Price</label>
                  <input type="number" step="0.00001" className="input-premium w-full" value={formData.open_price} onChange={e => setFormData({...formData, open_price: e.target.value})} required />
                </div>
                <div>
                  <label className="label-premium block mb-2">Exit Price</label>
                  <input type="number" step="0.00001" className="input-premium w-full" value={formData.close_price} onChange={e => setFormData({...formData, close_price: e.target.value})} required />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-premium block mb-2">Open Time</label>
                  <PremiumDateTimePicker value={new Date(formData.open_time)} onChange={(d) => handleDateChange('open_time', d)} />
                </div>
                <div>
                  <label className="label-premium block mb-2">Close Time</label>
                  <PremiumDateTimePicker value={new Date(formData.close_time)} onChange={(d) => handleDateChange('close_time', d)} />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-secondary uppercase tracking-widest border-b border-default pb-2">Analytics</h3>
              
              {isDomestic && formData.net_pnl ? (
                <div className="premium-inner-box p-4 border border-orange-500/20 bg-orange-500/5">
                  <h4 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3">Live Tax Receipt</h4>
                  <div className="space-y-2 text-sm font-mono">
                    <div className="flex justify-between text-neutral-300"><span>Gross PnL</span><span>₹{Number(formData.profit_loss).toFixed(2)}</span></div>
                    <div className="flex justify-between text-rose-400"><span>Brokerage</span><span>-₹{formData.tax_breakdown?.brokerage?.toFixed(2)}</span></div>
                    <div className="flex justify-between text-rose-400"><span>STT</span><span>-₹{formData.tax_breakdown?.stt?.toFixed(2)}</span></div>
                    <div className="flex justify-between text-rose-400"><span>Other Taxes</span><span>-₹{(Number(formData.total_taxes) - formData.tax_breakdown?.brokerage - formData.tax_breakdown?.stt).toFixed(2)}</span></div>
                    <div className="border-t border-orange-500/20 my-2 pt-2 flex justify-between font-bold text-primary">
                      <span>Net PnL</span>
                      <span className={Number(formData.net_pnl) >= 0 ? "text-emerald-400" : "text-rose-400"}>₹{Number(formData.net_pnl).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="premium-inner-box p-3">
                    <label className="label-premium block mb-1">Gross P&L ($)</label>
                    <input type="number" step="0.01" className="bg-transparent text-primary font-bold text-lg w-full outline-none" value={formData.profit_loss} onChange={e => setFormData({...formData, profit_loss: e.target.value})} placeholder="0.00" />
                  </div>
                  <div className="premium-inner-box p-3">
                    <label className="label-premium block mb-1">Commission</label>
                    <input type="number" step="0.01" className="bg-transparent text-primary font-bold text-lg w-full outline-none" value={formData.commission} onChange={e => setFormData({...formData, commission: e.target.value})} placeholder="0.00" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-premium block mb-2">Stop Loss</label>
                  <input type="number" step="0.00001" className="input-premium w-full" value={formData.stop_loss_price} onChange={e => setFormData({...formData, stop_loss_price: e.target.value})} />
                </div>
                <div>
                  <label className="label-premium block mb-2">Take Profit</label>
                  <input type="number" step="0.00001" className="input-premium w-full" value={formData.take_profit_price} onChange={e => setFormData({...formData, take_profit_price: e.target.value})} />
                </div>
              </div>

              {riskRewardRatio !== null && (
                <div className="premium-inner-box p-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-muted uppercase tracking-widest">Risk/Reward</span>
                  <span className="text-primary font-bold font-mono">1 : {riskRewardRatio.toFixed(2)}</span>
                </div>
              )}

              <div>
                <label className="label-premium block mb-2">Emotion / State</label>
                <select className="input-premium w-full" value={formData.emotion} onChange={e => setFormData({...formData, emotion: e.target.value})}>
                  <option value="Neutral">Neutral</option>
                  <option value="Confident">Confident</option>
                  <option value="FOMO">FOMO</option>
                  <option value="Revenge">Revenge</option>
                  <option value="Bored">Bored</option>
                  <option value="Tilted">Tilted</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full btn-primary py-4 text-lg">
            {loading ? "Recording Trade..." : "Log Trade to Journal"}
          </button>
        </form>
      </div>
    </div>
  );
}
