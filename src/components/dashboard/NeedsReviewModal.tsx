"use client";

import React, { useState, useEffect } from "react";
import Portal from "@/components/ui/Portal";
import { Button } from "@/components/ui/Button";
import { TradeDoc } from "@/lib/firebase/schema";
import { doc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { useUiStore } from "@/store/useUiStore";
import { useAuth } from "@/lib/firebase/authContext";
import { query, where } from "firebase/firestore";

interface NeedsReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: TradeDoc[];
  onComplete: () => void;
}

export default function NeedsReviewModal({ isOpen, onClose, trades, onComplete }: NeedsReviewModalProps) {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { activeWorkspace } = useUiStore();
  const isDomestic = activeWorkspace === "DOMESTIC";
  const currencySymbol = isDomestic ? "₹" : "$";

  // Queue of trades to review
  const [queue, setQueue] = useState<TradeDoc[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Form State
  const [selectedStrategyId, setSelectedStrategyId] = useState("");
  const [emotion, setEmotion] = useState("Calm");
  const [grade, setGrade] = useState("B");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setQueue(trades);
      setCurrentIndex(0);
      resetForm();
      fetchStrategies();
    }
  }, [isOpen, trades]);

  const fetchStrategies = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, "strategies"), where("owner_uid", "==", user.uid));
      const snap = await getDocs(q);
      const strats = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      setStrategies(strats);
    } catch (e) {
      console.error("Failed to load strategies:", e);
    }
  };

  const resetForm = () => {
    setSelectedStrategyId("");
    setEmotion("Calm");
    setGrade("B");
    setNotes("");
  };

  const currentTrade = queue[currentIndex];
  const activeStrategy = strategies.find(s => s.id === selectedStrategyId);

  const handleSave = async () => {
    if (!currentTrade) return;
    if (!selectedStrategyId) {
      toast.error("Please select a Strategy.");
      return;
    }

    setLoading(true);
    try {
      const tradeRef = doc(db, "trades", currentTrade.id);
      await updateDoc(tradeRef, {
        is_reviewed: true,
        strategy_id: selectedStrategyId,
        emotion: emotion,
        setup_grade: grade,
        review_notes: notes,
        reviewed_at: new Date().toISOString()
      });

      toast.success("Trade reviewed!");

      // Move to next
      if (currentIndex + 1 < queue.length) {
        setCurrentIndex(prev => prev + 1);
        resetForm();
      } else {
        toast.success("All trades reviewed!");
        onComplete();
        onClose();
      }
    } catch (e) {
      toast.error("Failed to save review.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !currentTrade) return null;

  const tNetPnl = isDomestic ? ((currentTrade as any).net_pnl ?? currentTrade.profit_loss ?? 0) : (currentTrade.profit_loss || 0);

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white dark:bg-slate-950 border border-default shadow-2xl rounded-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-in zoom-in-95">
          <div className="p-5 border-b border-default flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <i className="las la-tasks text-blue-500 text-xl"></i>
                Rapid Review ({currentIndex + 1} of {queue.length})
              </h2>
              <p className="text-sm text-muted mt-1">
                Categorize this trade so your journal can track its performance.
              </p>
            </div>
            <button onClick={onClose} className="p-2 text-muted hover:text-primary transition-colors rounded-full hover:bg-elevated">
              <i className="las la-times text-xl"></i>
            </button>
          </div>
          <div className="p-5 overflow-y-auto">

            {/* Trade Context Card */}
            <div className="bg-elevated p-4 rounded-xl border border-default flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${currentTrade.direction === 'BUY' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'}`}>
                    {currentTrade.direction}
                  </span>
                  <h3 className="font-bold text-primary text-lg">{currentTrade.symbol}</h3>
                </div>
                <p className="text-xs text-muted font-mono">
                  {format(new Date(currentTrade.close_time), "MMM do, HH:mm")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted uppercase font-bold tracking-widest mb-1">Net P&L</p>
                <p className={`text-xl font-black font-mono ${tNetPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {tNetPnl >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(tNetPnl).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Strategy</label>
                  <select
                    value={selectedStrategyId}
                    onChange={(e) => setSelectedStrategyId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-default rounded-lg p-2.5 text-sm text-primary focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="">-- Select Strategy --</option>
                    {strategies.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Emotion / Mental State</label>
                  <select
                    value={emotion}
                    onChange={(e) => setEmotion(e.target.value)}
                    className="w-full bg-surface border border-default rounded-lg p-2.5 text-sm text-primary focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="Calm">Calm & Focused</option>
                    <option value="FOMO">FOMO (Chasing)</option>
                    <option value="Revenge">Revenge Trading</option>
                    <option value="Tilted">Tilted / Frustrated</option>
                    <option value="Confident">Confident</option>
                    <option value="Hesitant">Hesitant / Scared</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Setup Grade</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-surface border border-default rounded-lg p-2.5 text-sm text-primary focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="A+">A+ (Perfect Setup)</option>
                    <option value="A">A (Great Setup)</option>
                    <option value="B">B (Average/Acceptable)</option>
                    <option value="C">C (Subpar/Forced)</option>
                    <option value="F">F (Broke Rules)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Quick Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g. Trapped early shorters at VWAP..."
                  className="w-full bg-surface border border-default rounded-lg p-2.5 text-sm text-primary focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

          </div>
          <div className="p-5 border-t border-default flex justify-end gap-2 rounded-b-2xl bg-white dark:bg-slate-950">
            <Button variant="secondary" onClick={() => {
              // Skip current trade
              if (currentIndex + 1 < queue.length) {
                setCurrentIndex(prev => prev + 1);
                resetForm();
              } else {
                toast.success("Finished queue!");
                onComplete();
                onClose();
              }
            }}>
              Skip
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
              {loading ? <i className="las la-spinner la-spin text-xl"></i> : (
                <>Save & Next <i className="las la-arrow-right"></i></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
