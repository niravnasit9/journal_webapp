"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { TradeDoc, AccountDoc, UserDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

interface TradeWithUser extends TradeDoc {
  userEmail: string;
}

export default function AdminTradesPage() {
  const [loading, setLoading] = useState(true);
  const [trades, setTrades] = useState<TradeWithUser[]>([]);
  const [marketFilter, setMarketFilter] = useState<"ALL" | "GLOBAL" | "DOMESTIC">("ALL");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "delete">("view");
  const [currentTrade, setCurrentTrade] = useState<TradeWithUser | null>(null);

  // Form States for Edit
  const [formData, setFormData] = useState<Partial<TradeDoc>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const uSnap = await getDocs(query(collection(db, "users")));
      const users: Record<string, string> = {};
      uSnap.docs.forEach(d => { users[d.id] = (d.data() as UserDoc).email; });

      const aSnap = await getDocs(query(collection(db, "accounts")));
      const accounts: Record<string, string> = {};
      aSnap.docs.forEach(d => { 
        const acc = d.data() as AccountDoc;
        accounts[d.id] = users[acc.owner_uid] || "Unknown User"; 
      });

      const tSnap = await getDocs(query(collection(db, "trades")));
      const dbTrades: TradeWithUser[] = [];
      tSnap.docs.forEach(d => {
        const t = d.data() as TradeDoc;
        dbTrades.push({
          ...t,
          id: d.id,
          userEmail: accounts[t.account_id] || "Unknown User"
        });
      });

      dbTrades.sort((a, b) => new Date(b.open_time).getTime() - new Date(a.open_time).getTime());
      setTrades(dbTrades);
    } catch (error) {
      console.error("Failed to load trades:", error);
      toast.error("Failed to load global trades");
    } finally {
      setLoading(false);
    }
  };

  const openView = (trade: TradeWithUser) => {
    setCurrentTrade(trade);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const openEdit = () => {
    if (currentTrade) {
      setFormData({
        symbol: currentTrade.symbol,
        profit_loss: currentTrade.profit_loss,
        direction: currentTrade.direction,
        lot_size: currentTrade.lot_size,
        open_price: currentTrade.open_price,
        close_price: currentTrade.close_price,
        pips: currentTrade.pips,
        commission: currentTrade.commission,
        swap: currentTrade.swap || 0,
        emotion: currentTrade.emotion,
        setup_grade: currentTrade.setup_grade,
        execution_score: currentTrade.execution_score,
        strategy_id: currentTrade.strategy_id
      });
      setModalMode("edit");
    }
  };

  const openDelete = () => {
    setModalMode("delete");
  };

  const handleEditSubmit = async () => {
    if (!currentTrade) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "trades", currentTrade.id), formData);
      toast.success("Trade overridden successfully");
      setIsModalOpen(false);
      fetchTrades();
    } catch (error: any) {
      console.error("Update failed:", error);
      toast.error("Failed to update trade: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!currentTrade) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, "trades", currentTrade.id));
      toast.success("Trade deleted from global ledger");
      setIsModalOpen(false);
      fetchTrades();
    } catch (error: any) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete trade: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTrades = trades.filter(t => {
    if (marketFilter === "ALL") return true;
    const isDomestic = t.domestic_segment != null || t.option_type != null; // basic heuristic if market_type not directly on trade
    // Wait, trade doc doesn't have market_type, but we added domestic_segment to schema!
    // If it has domestic_segment, it's domestic.
    if (marketFilter === "DOMESTIC") return isDomestic;
    return !isDomestic;
  });

  const totalVolume = filteredTrades.reduce((acc, t) => acc + (t.lot_size || t.quantity || 0), 0);
  const globalNetPnl = filteredTrades.reduce((acc, t) => acc + (t.profit_loss || 0), 0);
  const activeOpenTrades = filteredTrades.filter(t => !t.close_time).length;

  return (
    <div className="space-y-6 animate-in fade-in font-sans">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-page text-white">Global Trades Ledger</h1>
        <p className="text-sm text-secondary mt-1">
          Audit and review all real-time and historical trade activity across the platform.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="premium-card p-6 shadow-xl relative overflow-hidden group border-default">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          <div className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Total Volume Traded</div>
          <div className="text-3xl font-bold text-white">{totalVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })} Lots</div>
        </div>
        
        <div className="premium-card p-6 shadow-xl relative overflow-hidden group border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Global Net PnL</div>
          <div className={`text-3xl font-bold ${globalNetPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {globalNetPnl >= 0 ? '+' : ''}${globalNetPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        
        <div className="premium-card p-6 shadow-xl relative overflow-hidden group border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
          <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">Active Open Trades</div>
          <div className="text-3xl font-bold text-white">{activeOpenTrades}</div>
        </div>
      </div>

      {/* The Table */}
      <div className="premium-card p-0 overflow-hidden">
        <div className="bg-elevated border-b border-default flex flex-col md:flex-row md:items-center justify-between gap-4 p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Trade Activity</h2>
          <select
            value={marketFilter}
            onChange={(e) => setMarketFilter(e.target.value as any)}
            className="input-premium text-xs py-1.5 px-3 max-w-[200px]"
          >
            <option value="ALL">All Markets</option>
            <option value="GLOBAL">Global Only</option>
            <option value="DOMESTIC">Domestic Only</option>
          </select>
        </div>
        
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-[#1a1a1a] text-muted text-[10px] font-bold uppercase tracking-widest border-b border-default">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">User Email</th>
                <th className="px-6 py-4">Asset / Pair</th>
                <th className="px-6 py-4">Direction</th>
                <th className="px-6 py-4">R:R</th>
                <th className="px-6 py-4 text-right">Net PnL</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <LoadingSpinner className="w-8 h-8 mx-auto border-blue-500" />
                  </td>
                </tr>
              ) : trades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted font-bold">
                    No trades found on the platform.
                  </td>
                </tr>
              ) : (
                filteredTrades.map(trade => (
                  <tr key={trade.id} className="hover:bg-elevated/50 transition-colors border-b border-default">
                    <td className="px-6 py-4">
                      <span className="text-neutral-300 font-medium">{new Date(trade.open_time).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-secondary">{trade.userEmail}</span>
                    </td>
                    <td className="px-6 py-4">
                      {trade.domestic_segment === "FNO_OPTIONS" ? (
                        <span className="font-bold text-white">{trade.symbol} {trade.strike_price} {trade.option_type}</span>
                      ) : (
                        <span className="font-bold text-white">{trade.symbol}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {trade.direction === "BUY" ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                          Long
                        </span>
                      ) : (
                        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                          Short
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-secondary font-mono text-xs">{trade.risk_reward_ratio ? `1:${trade.risk_reward_ratio.toFixed(2)}` : 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${trade.profit_loss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trade.profit_loss >= 0 ? '+' : ''}{trade.domestic_segment ? '₹' : '$'}{trade.profit_loss.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openView(trade)}
                        className="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center ml-auto"
                        title="View Details"
                      >
                        <i className="las la-eye text-xl"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details/Edit/Delete Modal */}
      {isModalOpen && currentTrade && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="premium-card w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative border border-default">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 text-muted hover:text-white transition-colors"
            >
              <i className="las la-times text-2xl"></i>
            </button>
            
            {modalMode === "view" ? (
              <>
                <h2 className="text-xl font-bold text-white tracking-tight mb-4 flex items-center gap-2">
                  <i className="las la-chart-bar text-blue-500"></i> Trade Details
                </h2>
                
                <div className="premium-inner-box p-5 mb-6 space-y-3 text-sm">
                  <div className="flex justify-between border-b border-default pb-2">
                    <span className="text-muted font-bold uppercase tracking-widest text-[10px]">Trade ID</span>
                    <span className="text-white font-mono">{currentTrade.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-default pb-2">
                    <span className="text-muted font-bold uppercase tracking-widest text-[10px]">User</span>
                    <span className="text-white">{currentTrade.userEmail}</span>
                  </div>
                  <div className="flex justify-between border-b border-default pb-2">
                    <span className="text-muted font-bold uppercase tracking-widest text-[10px]">Asset</span>
                    <span className="text-white font-bold">{currentTrade.symbol}</span>
                  </div>
                  <div className="flex justify-between border-b border-default pb-2">
                    <span className="text-muted font-bold uppercase tracking-widest text-[10px]">Direction</span>
                    <span className="text-white">{currentTrade.direction}</span>
                  </div>
                  <div className="flex justify-between border-b border-default pb-2">
                    <span className="text-muted font-bold uppercase tracking-widest text-[10px]">Open Price</span>
                    <span className="text-white font-mono">{currentTrade.open_price}</span>
                  </div>
                  <div className="flex justify-between border-b border-default pb-2">
                    <span className="text-muted font-bold uppercase tracking-widest text-[10px]">Close Price</span>
                    <span className="text-white font-mono">{currentTrade.close_price || "Open"}</span>
                  </div>
                  <div className="flex justify-between border-b border-default pb-2">
                    <span className="text-muted font-bold uppercase tracking-widest text-[10px]">Lots</span>
                    <span className="text-white font-mono">{currentTrade.lot_size}</span>
                  </div>
                  <div className="flex justify-between border-b border-default pb-2">
                    <span className="text-muted font-bold uppercase tracking-widest text-[10px]">Emotion</span>
                    <span className="text-white">{currentTrade.emotion || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted font-bold uppercase tracking-widest text-[10px]">Net PnL</span>
                    <span className={`font-bold ${currentTrade.profit_loss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ${currentTrade.profit_loss.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between gap-3 pt-2">
                  <button onClick={openDelete} className="btn-ghost flex items-center gap-2 hover:text-rose-400 hover:bg-rose-500/10">
                    <i className="las la-trash"></i> Delete Trade
                  </button>
                  <div className="flex gap-2">
                    <button onClick={openEdit} className="btn-ghost flex items-center gap-2">
                      <i className="las la-pen"></i> Override
                    </button>
                    <button onClick={() => setIsModalOpen(false)} className="btn-primary">
                      Done
                    </button>
                  </div>
                </div>
              </>
            ) : modalMode === "delete" ? (
              <>
                <h2 className="text-xl font-bold text-white tracking-tight mb-4 flex items-center gap-2">
                  <i className="las la-exclamation-triangle text-amber-500"></i> Delete Trade
                </h2>
                <div className="premium-inner-box p-4 text-center border-amber-500/20 bg-amber-500/5 mb-6">
                  <p className="text-sm text-amber-500/80 mb-2 font-bold">
                    WARNING: This will permanently delete this trade from the global ledger.
                  </p>
                  <p className="text-xs text-secondary">
                    This action will alter the ledger math for {currentTrade.userEmail}'s personal dashboard.
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setModalMode("view")} className="btn-ghost" disabled={isSubmitting}>Cancel</button>
                  <button onClick={handleDeleteSubmit} className="px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-sm rounded-xl hover:bg-rose-500/20 transition-all flex items-center gap-2" disabled={isSubmitting}>
                    {isSubmitting ? <LoadingSpinner className="w-4 h-4" /> : <i className="las la-trash"></i>} Confirm Delete
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white tracking-tight mb-4 flex items-center gap-2">
                  <i className="las la-tools text-amber-500"></i> Admin Override
                </h2>
                
                <div className="premium-inner-box p-4 border-amber-500/20 bg-amber-500/5 mb-6">
                  <p className="text-xs text-amber-500/80 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                    <i className="las la-exclamation-circle text-sm"></i> Extreme Caution
                  </p>
                  <p className="text-xs text-amber-500/60 leading-relaxed">
                    Manual modifications to user trades will permanently alter their personal dashboard ledger math. This should only be used to correct system synchronization errors.
                  </p>
                </div>

                <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Asset / Symbol</label>
                      <input 
                        type="text" 
                        value={formData.symbol || ""}
                        onChange={e => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                        className="input-premium w-full bg-elevated border-default uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Direction</label>
                      <select 
                        value={formData.direction || "BUY"}
                        onChange={e => setFormData({...formData, direction: e.target.value as "BUY" | "SELL"})}
                        className="input-premium w-full bg-elevated border-default"
                      >
                        <option value="BUY">BUY (Long)</option>
                        <option value="SELL">SELL (Short)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Lot Size</label>
                      <input 
                        type="number" 
                        value={formData.lot_size || 0}
                        onChange={e => setFormData({...formData, lot_size: parseFloat(e.target.value)})}
                        className="input-premium w-full bg-elevated border-default"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Net PnL (USD)</label>
                      <input 
                        type="number" 
                        value={formData.profit_loss || 0}
                        onChange={e => setFormData({...formData, profit_loss: parseFloat(e.target.value)})}
                        className="input-premium w-full bg-elevated border-default"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Open Price</label>
                      <input 
                        type="number" 
                        value={formData.open_price || 0}
                        onChange={e => setFormData({...formData, open_price: parseFloat(e.target.value)})}
                        className="input-premium w-full bg-elevated border-default"
                        step="0.00001"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Close Price</label>
                      <input 
                        type="number" 
                        value={formData.close_price || 0}
                        onChange={e => setFormData({...formData, close_price: parseFloat(e.target.value)})}
                        className="input-premium w-full bg-elevated border-default"
                        step="0.00001"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Pips</label>
                      <input 
                        type="number" 
                        value={formData.pips || 0}
                        onChange={e => setFormData({...formData, pips: parseFloat(e.target.value)})}
                        className="input-premium w-full bg-elevated border-default"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Commission</label>
                      <input 
                        type="number" 
                        value={formData.commission || 0}
                        onChange={e => setFormData({...formData, commission: parseFloat(e.target.value)})}
                        className="input-premium w-full bg-elevated border-default"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Swap</label>
                      <input 
                        type="number" 
                        value={formData.swap || 0}
                        onChange={e => setFormData({...formData, swap: parseFloat(e.target.value)})}
                        className="input-premium w-full bg-elevated border-default"
                        step="0.01"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Emotion</label>
                      <select 
                        value={formData.emotion || "Neutral"}
                        onChange={e => setFormData({...formData, emotion: e.target.value as any})}
                        className="input-premium w-full bg-elevated border-default"
                      >
                        <option value="Neutral">Neutral</option>
                        <option value="FOMO">FOMO</option>
                        <option value="Revenge">Revenge</option>
                        <option value="Confident">Confident</option>
                        <option value="Bored">Bored</option>
                        <option value="Tilted">Tilted</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Execution</label>
                      <select 
                        value={formData.execution_score || "None"}
                        onChange={e => setFormData({...formData, execution_score: e.target.value as any})}
                        className="input-premium w-full bg-elevated border-default"
                      >
                        <option value="None">None</option>
                        <option value="Perfect">Perfect</option>
                        <option value="Early Entry">Early Entry</option>
                        <option value="Late Exit">Late Exit</option>
                        <option value="FOMO">FOMO</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-default">
                  <button onClick={() => setModalMode("view")} className="btn-ghost" disabled={isSubmitting}>Cancel</button>
                  <button onClick={handleEditSubmit} className="btn-primary flex items-center gap-2" disabled={isSubmitting}>
                    {isSubmitting ? <LoadingSpinner className="w-4 h-4" /> : <i className="las la-save"></i>} Commit Override
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
