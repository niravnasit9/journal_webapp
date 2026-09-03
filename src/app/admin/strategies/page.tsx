"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, doc, addDoc, updateDoc, deleteDoc, writeBatch, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { TradeDoc, StrategyDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

interface StrategyStats extends StrategyDoc {
  totalTrades: number;
  winRate: number;
}

export default function AdminStrategiesPage() {
  const [loading, setLoading] = useState(true);
  const [strategies, setStrategies] = useState<StrategyStats[]>([]);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "delete">("add");
  const [currentStrat, setCurrentStrat] = useState<StrategyStats | null>(null);
  
  // Form States
  const [formData, setFormData] = useState({ 
    name: "", 
    description: "", 
    is_active: true,
    owner_uid: "",
    rules: [] as string[],
    is_public: false,
    image_url: "",
    owner_email: "",
    owner_name: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Strategies
      const sSnap = await getDocs(query(collection(db, "strategies")));
      const dbStrats = sSnap.docs.map(d => ({ ...d.data(), id: d.id } as StrategyDoc));
      
      // Fetch Trades
      const tSnap = await getDocs(query(collection(db, "trades")));
      const trades = tSnap.docs.map(d => d.data() as TradeDoc);

      const stratStats = dbStrats.map(strat => {
        const stratTrades = trades.filter(t => t.strategy_id === strat.id);
        const wins = stratTrades.filter(t => t.profit_loss > 0).length;
        const total = stratTrades.length;
        return {
          ...strat,
          totalTrades: total,
          winRate: total > 0 ? Math.round((wins / total) * 100) : 0
        };
      });

      stratStats.sort((a, b) => b.totalTrades - a.totalTrades);
      setStrategies(stratStats);
    } catch (error) {
      console.error("Failed to load strategies:", error);
      toast.error("Failed to load strategy metrics");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setFormData({ 
      name: "", 
      description: "", 
      is_active: true,
      owner_uid: "",
      rules: [""],
      is_public: false,
      image_url: "",
      owner_email: "",
      owner_name: ""
    });
    setModalMode("add");
    setCurrentStrat(null);
    setIsModalOpen(true);
  };

  const openEdit = (strat: StrategyStats) => {
    setFormData({ 
      name: strat.name, 
      description: strat.description || "", 
      is_active: strat.is_active ?? false,
      owner_uid: strat.owner_uid || "",
      rules: strat.rules && strat.rules.length > 0 ? strat.rules : [""],
      is_public: strat.is_public ?? false,
      image_url: strat.image_url || "",
      owner_email: strat.owner_email || "",
      owner_name: strat.owner_name || ""
    });
    setModalMode("edit");
    setCurrentStrat(strat);
    setIsModalOpen(true);
  };

  const openDelete = (strat: StrategyStats) => {
    setModalMode("delete");
    setCurrentStrat(strat);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() && modalMode !== "delete") {
      toast.error("Strategy name is required");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const baseStrat = {
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active,
        owner_uid: formData.owner_uid,
        rules: formData.rules.map(r => r.trim()).filter(Boolean),
        is_public: formData.is_public,
        image_url: formData.image_url,
        owner_email: formData.owner_email,
        owner_name: formData.owner_name,
      };

      if (modalMode === "add") {
        await addDoc(collection(db, "strategies"), {
          ...baseStrat,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        toast.success("Strategy created successfully");
      } 
      
      else if (modalMode === "edit" && currentStrat) {
        await updateDoc(doc(db, "strategies", currentStrat.id), {
          ...baseStrat,
          updated_at: new Date().toISOString()
        });
        toast.success("Strategy updated successfully");
      }
      
      else if (modalMode === "delete" && currentStrat) {
        // 1. Update all trades matching this strategy_id to null
        const batch = writeBatch(db);
        const linkedTrades = await getDocs(query(collection(db, "trades"), where("strategy_id", "==", currentStrat.id)));
        
        linkedTrades.docs.forEach(d => {
          batch.update(doc(db, "trades", d.id), { strategy_id: null });
        });
        
        // 2. Delete the strategy doc
        batch.delete(doc(db, "strategies", currentStrat.id));
        await batch.commit();
        
        toast.success(`Strategy deleted and ${linkedTrades.docs.length} trades unlinked.`);
      }

      setIsModalOpen(false);
      fetchData(); // Refresh UI
    } catch (error: any) {
      console.error("Action failed:", error);
      toast.error("Action failed: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalStrategies = strategies.length;
  const topWinRate = strategies.length > 0 ? Math.max(...strategies.map(s => s.winRate)) : 0;
  const mostUsed = strategies.length > 0 ? strategies[0].name : "N/A";

  return (
    <div className="space-y-6 animate-in fade-in font-sans">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="heading-page text-white">Global Strategy Directory</h1>
          <p className="text-sm text-secondary mt-1">
            Track and evaluate the performance of system and user strategies globally.
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <i className="las la-plus"></i> Create Strategy
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="premium-card p-6 shadow-xl relative overflow-hidden group border-default">
          <div className="absolute top-0 left-0 w-full h-1 bg-neutral-600"></div>
          <div className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Total Strategies</div>
          <div className="text-3xl font-bold text-white">{totalStrategies}</div>
        </div>
        
        <div className="premium-card p-6 shadow-xl relative overflow-hidden group border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Top Global Win Rate</div>
          <div className="text-3xl font-bold text-white">{topWinRate}%</div>
        </div>
        
        <div className="premium-card p-6 shadow-xl relative overflow-hidden group border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.05)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
          <div className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Most Utilized</div>
          <div className="text-xl font-bold text-white truncate leading-tight pt-1">{mostUsed}</div>
        </div>
      </div>

      {/* The Table */}
      <div className="premium-card p-0 overflow-hidden">
        <div className="bg-elevated border-b border-default flex flex-col md:flex-row md:items-center justify-between gap-4 p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Strategy Leaderboard</h2>
        </div>
        
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-[#1a1a1a] text-muted text-[10px] font-bold uppercase tracking-widest border-b border-default">
                <th className="px-6 py-4">Strategy Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Total Trades</th>
                <th className="px-6 py-4 w-64">Global Win Rate</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <LoadingSpinner className="w-8 h-8 mx-auto border-blue-500" />
                  </td>
                </tr>
              ) : strategies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted font-bold">
                    No strategies found in database.
                  </td>
                </tr>
              ) : (
                strategies.map(strat => (
                  <tr key={strat.id} className="hover:bg-elevated/50 transition-colors border-b border-default">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{strat.name}</div>
                      <div className="text-[10px] text-muted font-mono mt-0.5">{strat.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${strat.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                        {strat.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-white">{strat.totalTrades.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white w-8">{strat.winRate}%</span>
                        <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${strat.winRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEdit(strat)}
                          className="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center"
                          title="Edit Strategy"
                        >
                          <i className="las la-cog text-xl"></i>
                        </button>
                        <button 
                          onClick={() => openDelete(strat)}
                          className="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center hover:text-rose-400 hover:bg-rose-500/10"
                          title="Delete Strategy"
                        >
                          <i className="las la-trash text-xl"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="premium-card w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative border border-default">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 text-muted hover:text-white transition-colors"
            >
              <i className="las la-times text-2xl"></i>
            </button>
            
            {modalMode === "delete" ? (
              <>
                <h2 className="text-xl font-bold text-white tracking-tight mb-4 flex items-center gap-2">
                  <i className="las la-exclamation-triangle text-amber-500"></i> Delete Strategy
                </h2>
                <div className="premium-inner-box p-4 text-center border-amber-500/20 bg-amber-500/5">
                  <p className="text-sm text-amber-500/80 mb-2">
                    Are you sure you want to delete <strong>{currentStrat?.name}</strong>?
                  </p>
                  <p className="text-xs text-secondary">
                    This will safely unlink {currentStrat?.totalTrades} trades from this strategy and set them to "Uncategorized". The trades will NOT be deleted.
                  </p>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setIsModalOpen(false)} className="btn-ghost" disabled={isSubmitting}>Cancel</button>
                  <button onClick={handleSubmit} className="px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-sm rounded-xl hover:bg-rose-500/20 transition-all flex items-center gap-2" disabled={isSubmitting}>
                    {isSubmitting ? <LoadingSpinner className="w-4 h-4" /> : <i className="las la-trash"></i>} Confirm Delete
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white tracking-tight mb-6">
                  {modalMode === "add" ? "Create New Strategy" : "Edit Strategy"}
                </h2>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Strategy Name</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="input-premium w-full bg-elevated border-default"
                        placeholder="e.g. ICT Silver Bullet"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Owner UID</label>
                      <input 
                        type="text" 
                        value={formData.owner_uid}
                        onChange={e => setFormData({...formData, owner_uid: e.target.value})}
                        className="input-premium w-full bg-elevated border-default"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Description</label>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="input-premium w-full bg-elevated border-default h-24 resize-none"
                      placeholder="Strategy details..."
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest block">Strategy Rules</label>
                      <button 
                        onClick={() => setFormData({...formData, rules: [...formData.rules, ""]})}
                        className="text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest flex items-center gap-1"
                      >
                        <i className="las la-plus"></i> Add Rule
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.rules.map((rule, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input 
                            type="text" 
                            value={rule}
                            onChange={e => {
                              const newRules = [...formData.rules];
                              newRules[idx] = e.target.value;
                              setFormData({...formData, rules: newRules});
                            }}
                            className="input-premium w-full bg-elevated border-default"
                            placeholder={`Rule ${idx + 1}`}
                          />
                          <button 
                            onClick={() => {
                              const newRules = formData.rules.filter((_, i) => i !== idx);
                              setFormData({...formData, rules: newRules});
                            }}
                            className="btn-ghost w-10 h-10 flex-shrink-0 flex items-center justify-center hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                            title="Remove Rule"
                          >
                            <i className="las la-times text-lg"></i>
                          </button>
                        </div>
                      ))}
                      {formData.rules.length === 0 && (
                        <div className="text-xs text-muted text-center py-2 italic border border-dashed border-default rounded-lg">
                          No rules added yet.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Owner Name</label>
                      <input 
                        type="text" 
                        value={formData.owner_name}
                        onChange={e => setFormData({...formData, owner_name: e.target.value})}
                        className="input-premium w-full bg-elevated border-default"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Owner Email</label>
                      <input 
                        type="text" 
                        value={formData.owner_email}
                        onChange={e => setFormData({...formData, owner_email: e.target.value})}
                        className="input-premium w-full bg-elevated border-default"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Image URL</label>
                    <input 
                      type="text" 
                      value={formData.image_url}
                      onChange={e => setFormData({...formData, image_url: e.target.value})}
                      className="input-premium w-full bg-elevated border-default"
                    />
                  </div>
                  <div className="flex items-center gap-6 pt-2">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="isActive"
                        checked={formData.is_active}
                        onChange={e => setFormData({...formData, is_active: e.target.checked})}
                        className="w-4 h-4 rounded border-strong bg-neutral-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-neutral-900"
                      />
                      <label htmlFor="isActive" className="text-sm font-bold text-neutral-300">Active</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="isPublic"
                        checked={formData.is_public}
                        onChange={e => setFormData({...formData, is_public: e.target.checked})}
                        className="w-4 h-4 rounded border-strong bg-neutral-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-neutral-900"
                      />
                      <label htmlFor="isPublic" className="text-sm font-bold text-neutral-300">Public</label>
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-default">
                  <button onClick={() => setIsModalOpen(false)} className="btn-ghost" disabled={isSubmitting}>Cancel</button>
                  <button onClick={handleSubmit} className="btn-primary flex items-center gap-2" disabled={isSubmitting}>
                    {isSubmitting ? <LoadingSpinner className="w-4 h-4" /> : <i className="las la-save"></i>} Save Strategy
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
