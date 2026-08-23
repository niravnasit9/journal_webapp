"use client";

import { useState, useEffect, useMemo } from "react";
import { addManualTradeAction } from "@/app/actions/tradeActions";
import toast from "react-hot-toast";
import { calculatePnL } from "@/utils/pnlCalculator";
import { useAuth } from "@/lib/firebase/authContext";
import { PremiumDateTimePicker } from "@/components/ui/PremiumDateTimePicker";

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
    close_time: new Date().toISOString()
  });

  const currentSymbol = symbolMode === "preset" ? selectedPreset : customSymbol;

  const handleDateChange = (field: 'open_time' | 'close_time', date: Date | null) => {
    if (!date) return;
    setFormData(prev => ({ ...prev, [field]: date.toISOString() }));
  };

  // Auto-calculate Commission when lot size changes
  useEffect(() => {
    if (formData.lot_size) {
      const lots = Number(formData.lot_size);
      if (!isNaN(lots)) {
        const commRate = parseFloat(localStorage.getItem("defaultCommission") || "5.00");
        setFormData(prev => ({ ...prev, commission: (lots * commRate).toFixed(2) }));
      }
    }
  }, [formData.lot_size]);

  // Auto-calculate P&L whenever inputs change
  useEffect(() => {
    if (currentSymbol && formData.open_price && formData.close_price && formData.lot_size) {
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
  }, [currentSymbol, formData.direction, formData.open_price, formData.close_price, formData.lot_size, accountCurrency, usdInrRate]);

  // Auto-calculate R:R
  const riskRewardRatio = useMemo(() => {
    const op = Number(formData.open_price);
    const sl = Number(formData.stop_loss_price);
    const tp = Number(formData.take_profit_price);

    if (isNaN(op) || isNaN(sl) || isNaN(tp) || op === sl) return null;
    
    const risk = Math.abs(op - sl);
    const reward = Math.abs(tp - op);
    
    if (risk === 0) return null;
    const rr = reward / risk;
    return Number(rr.toFixed(2));
  }, [formData.open_price, formData.stop_loss_price, formData.take_profit_price]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (symbolMode === "other" && !customSymbol.trim()) {
      toast.error("Please enter a custom symbol.");
      return;
    }

    if (new Date(formData.close_time) <= new Date(formData.open_time)) {
      toast.error("Close time cannot be before or equal to open time.");
      return;
    }

    setLoading(true);
    
    const res = await addManualTradeAction(accountId, {
      symbol: currentSymbol.toUpperCase(),
      direction: formData.direction,
      lot_size: Number(formData.lot_size),
      open_price: Number(formData.open_price),
      close_price: Number(formData.close_price),
      stop_loss_price: formData.stop_loss_price ? Number(formData.stop_loss_price) : undefined,
      take_profit_price: formData.take_profit_price ? Number(formData.take_profit_price) : undefined,
      risk_reward_ratio: riskRewardRatio || undefined,
      profit_loss: Number(formData.profit_loss),
      commission: Number(formData.commission) || 0,
      emotion: isProOrElite ? formData.emotion : undefined,
      setup_grade: isProOrElite ? formData.setup_grade : undefined,
      execution_score: isProOrElite && formData.execution_score !== "None" ? formData.execution_score : undefined,
      entry_chart_url: isProOrElite ? formData.entry_chart_url : undefined,
      exit_chart_url: isProOrElite ? formData.exit_chart_url : undefined,
      open_time: formData.open_time,
      close_time: formData.close_time,
    });

    setLoading(false);
    
    if (res.success) {
      setFormData({ 
        direction: "BUY", lot_size: "", open_price: "", close_price: "", stop_loss_price: "", take_profit_price: "", profit_loss: "", commission: "", 
        emotion: "Neutral", setup_grade: "B", execution_score: "None", entry_chart_url: "", exit_chart_url: "",
        open_time: new Date().toISOString(), close_time: new Date().toISOString() 
      });
      setCustomSymbol("");
      setSymbolMode("preset");
      onAdded();
      onClose();
    } else {
      toast.error("Failed to add trade: " + res.error);
    }
  };

  const inputClass = "w-full bg-[#121212] border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-neutral-100 rounded-lg px-3 py-2 text-sm transition-colors";
  const labelClass = "block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      <div className={`relative bg-[#0a0a0a] border border-neutral-800 rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden animate-in zoom-in-95 fade-in duration-300`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white tracking-tight">Add Trade</h2>
            {riskRewardRatio !== null && (
              <span className="bg-blue-900/30 text-blue-400 border border-blue-900/50 px-2 py-0.5 rounded text-xs font-bold">
                Calculated R:R — 1:{riskRewardRatio}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            <i className="las la-times text-xl"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Direction</label>
              <div className="flex bg-[#121212] border border-neutral-800 rounded-lg p-1 overflow-hidden">
                <button
                  type="button"
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${formData.direction === 'BUY' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                  onClick={() => setFormData({ ...formData, direction: "BUY" })}
                >
                  LONG
                </button>
                <button
                  type="button"
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${formData.direction === 'SELL' ? 'bg-rose-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                  onClick={() => setFormData({ ...formData, direction: "SELL" })}
                >
                  SHORT
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>Symbol</label>
              {symbolMode === "preset" ? (
                <div className="flex gap-2">
                  <select
                    className={inputClass}
                    value={selectedPreset}
                    onChange={(e) => setSelectedPreset(e.target.value)}
                  >
                    {SYMBOL_PRESETS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button type="button" onClick={() => setSymbolMode("other")} className="px-3 bg-[#121212] border border-neutral-800 text-neutral-300 rounded-lg text-sm hover:bg-neutral-800">
                    Custom
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    className={inputClass}
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g. AAPL"
                  />
                  <button type="button" onClick={() => setSymbolMode("preset")} className="px-3 bg-[#121212] border border-neutral-800 text-neutral-300 rounded-lg text-sm hover:bg-neutral-800">
                    Presets
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Open Date & Time</label>
              <PremiumDateTimePicker
                value={new Date(formData.open_time)}
                onChange={(d) => handleDateChange('open_time', d)}
              />
            </div>
            <div>
              <label className={labelClass}>Close Date & Time</label>
              <PremiumDateTimePicker
                value={new Date(formData.close_time)}
                onChange={(d) => handleDateChange('close_time', d)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Lot Size</label>
              <input
                type="number"
                step="0.01"
                required
                className={inputClass}
                value={formData.lot_size}
                onChange={(e) => setFormData({ ...formData, lot_size: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Open Price</label>
              <input
                type="number"
                step="any"
                required
                className={inputClass}
                value={formData.open_price}
                onChange={(e) => setFormData({ ...formData, open_price: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Stop Loss</label>
              <input
                type="number"
                step="any"
                className={inputClass}
                placeholder="Optional"
                value={formData.stop_loss_price}
                onChange={(e) => setFormData({ ...formData, stop_loss_price: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Take Profit</label>
              <input
                type="number"
                step="any"
                className={inputClass}
                placeholder="Optional"
                value={formData.take_profit_price}
                onChange={(e) => setFormData({ ...formData, take_profit_price: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Close Price</label>
              <input
                type="number"
                step="any"
                required
                className={inputClass}
                value={formData.close_price}
                onChange={(e) => setFormData({ ...formData, close_price: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Net P&L</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-neutral-500">{accountCurrency === "INR" ? "₹" : "$"}</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  className={`${inputClass} pl-7`}
                  value={formData.profit_loss}
                  onChange={(e) => setFormData({ ...formData, profit_loss: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Commission</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-neutral-500">{accountCurrency === "INR" ? "₹" : "$"}</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  className={`${inputClass} pl-7`}
                  value={formData.commission}
                  onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                />
              </div>
            </div>
          </div>

          {isProOrElite && (
            <div className="border-t border-neutral-800 pt-5 space-y-4">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <i className="las la-brain text-blue-500"></i> Smart AI Fields
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Emotion</label>
                  <select
                    className={inputClass}
                    value={formData.emotion}
                    onChange={(e) => setFormData({ ...formData, emotion: e.target.value as any })}
                  >
                    <option value="Neutral">Neutral</option>
                    <option value="Confident">Confident</option>
                    <option value="FOMO">FOMO</option>
                    <option value="Revenge">Revenge</option>
                    <option value="Bored">Bored</option>
                    <option value="Tilted">Tilted</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Setup Grade</label>
                  <select
                    className={inputClass}
                    value={formData.setup_grade}
                    onChange={(e) => setFormData({ ...formData, setup_grade: e.target.value as any })}
                  >
                    <option value="A+">A+ (Perfect)</option>
                    <option value="A">A (Great)</option>
                    <option value="B">B (Good)</option>
                    <option value="C">C (Poor)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Execution</label>
                  <select
                    className={inputClass}
                    value={formData.execution_score}
                    onChange={(e) => setFormData({ ...formData, execution_score: e.target.value as any })}
                  >
                    <option value="None">Not Graded</option>
                    <option value="Perfect">Perfect Execution</option>
                    <option value="Early Entry">Early Entry</option>
                    <option value="Late Exit">Late Exit</option>
                    <option value="FOMO">FOMO Entry</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Entry Chart URL</label>
                  <input
                    type="url"
                    className={inputClass}
                    placeholder="https://tradingview.com/..."
                    value={formData.entry_chart_url}
                    onChange={(e) => setFormData({ ...formData, entry_chart_url: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Exit Chart URL</label>
                  <input
                    type="url"
                    className={inputClass}
                    placeholder="https://tradingview.com/..."
                    value={formData.exit_chart_url}
                    onChange={(e) => setFormData({ ...formData, exit_chart_url: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-neutral-800">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <i className="las la-spinner la-spin text-xl"></i> Processing...
                </>
              ) : (
                "Save Trade"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
