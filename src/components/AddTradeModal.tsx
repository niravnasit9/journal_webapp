import { useState, useEffect } from "react";
import { addManualTradeAction } from "@/app/actions/tradeActions";
import toast from "react-hot-toast";
import { calculatePnL } from "@/utils/pnlCalculator";
import CustomSelect from "@/components/ui/CustomSelect";

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
  const [usdInrRate, setUsdInrRate] = useState(83.50);
  
  // Symbol selection states
  const [symbolMode, setSymbolMode] = useState<"preset" | "other">("preset");
  const [selectedPreset, setSelectedPreset] = useState("XAUUSD");
  const [customSymbol, setCustomSymbol] = useState("");

  const [formData, setFormData] = useState({
    direction: "BUY" as "BUY" | "SELL",
    lot_size: "",
    open_price: "",
    close_price: "",
    profit_loss: "",
    commission: ""
  });

  const currentSymbol = symbolMode === "preset" ? selectedPreset : customSymbol;

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (symbolMode === "other" && !customSymbol.trim()) {
      toast.error("Please enter a custom symbol.");
      return;
    }

    setLoading(true);
    
    const res = await addManualTradeAction(accountId, {
      symbol: currentSymbol.toUpperCase(),
      direction: formData.direction,
      lot_size: Number(formData.lot_size),
      open_price: Number(formData.open_price),
      close_price: Number(formData.close_price),
      profit_loss: Number(formData.profit_loss),
      commission: Number(formData.commission) || 0,
    });

    setLoading(false);
    
    if (res.success) {
      setFormData({ direction: "BUY", lot_size: "", open_price: "", close_price: "", profit_loss: "", commission: "" });
      setCustomSymbol("");
      setSymbolMode("preset");
      onAdded();
      onClose();
    } else {
      toast.error("Failed to add trade: " + res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-[#f0f0f0] dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white dark:bg-[#111827] border border-yellow-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-yellow-200 dark:border-slate-800/50 bg-gray-50 dark:bg-[#0a0f1c]/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Add Manual Trade</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:text-white transition-colors">
            <i className="las la-times text-xl"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Symbol</label>
              <CustomSelect 
                value={symbolMode === "preset" ? selectedPreset : "OTHER"}
                onChange={(val) => {
                  if (val === "OTHER") {
                    setSymbolMode("other");
                  } else {
                    setSymbolMode("preset");
                    setSelectedPreset(val);
                  }
                }}
                options={[
                  ...SYMBOL_PRESETS.map(s => ({ value: s, label: s })),
                  { value: "OTHER", label: "Other..." }
                ]}
              />
              
              {symbolMode === "other" && (
                <input 
                  required type="text" placeholder="e.g. EURUSD"
                  value={customSymbol} 
                  onChange={e => setCustomSymbol(e.target.value.toUpperCase())}
                  className="w-full mt-2 bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-200 dark:border-slate-800 rounded-lg px-4 py-2 text-gray-900 dark:text-white outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all font-mono uppercase"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Direction</label>
              <CustomSelect 
                value={formData.direction} 
                onChange={val => setFormData({...formData, direction: val as "BUY"|"SELL"})}
                options={[
                  { value: "BUY", label: "BUY" },
                  { value: "SELL", label: "SELL" }
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Lot Size</label>
              <input 
                required type="number" step="0.01" placeholder="1.0"
                value={formData.lot_size} onChange={e => setFormData({...formData, lot_size: e.target.value})}
                className="w-full bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-gray-900 dark:text-white outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Open Price</label>
              <input 
                required type="number" step="any" placeholder="0.0000"
                value={formData.open_price} onChange={e => setFormData({...formData, open_price: e.target.value})}
                className="w-full bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-gray-900 dark:text-white outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Close Price</label>
              <input 
                required type="number" step="any" placeholder="0.0000"
                value={formData.close_price} onChange={e => setFormData({...formData, close_price: e.target.value})}
                className="w-full bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-gray-900 dark:text-white outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all font-mono"
              />
            </div>
          </div>

          {accountCurrency === "INR" && (
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                USD/INR Exchange Rate
                <span className="text-blue-500 font-mono text-[10px]">Auto-calculates INR P&L</span>
              </label>
              <input 
                required type="number" step="any" placeholder="83.50"
                value={usdInrRate} onChange={e => setUsdInrRate(Number(e.target.value))}
                className="w-full bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all font-mono"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                Commission ({accountCurrency === "INR" ? "₹" : "$"})
                <span className="text-blue-500 font-mono text-[10px]">Editable</span>
              </label>
              <input 
                required type="number" step="0.01" placeholder="7.00"
                value={formData.commission} onChange={e => setFormData({...formData, commission: e.target.value})}
                className="w-full bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all font-mono"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                Gross Profit ({accountCurrency === "INR" ? "₹" : "$"})
                <span className="text-emerald-500 font-mono text-[10px]">Auto-calculated</span>
              </label>
              <input 
                required type="number" step="0.01" placeholder="e.g. 150.00"
                value={formData.profit_loss} onChange={e => setFormData({...formData, profit_loss: e.target.value})}
                className="w-full bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white outline-none focus:border-emerald-500/50 transition-all font-mono text-lg font-bold border-emerald-500/30"
              />
            </div>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-slate-500">Note: Commission will be deducted from your Gross Profit.</p>

          <div className="pt-4">
            <button 
              disabled={loading} type="submit"
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 disabled:opacity-50 text-black font-bold py-3 rounded-lg transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)]"
            >
              {loading ? "Adding..." : "Save Trade"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
