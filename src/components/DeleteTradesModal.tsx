"use client";

import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { clearTradesByDateAction, clearAllTradesAction } from "@/app/actions/tradeActions";
import { TradeDoc } from "@/lib/firebase/schema";
import Portal from "@/components/ui/Portal";

interface DeleteTradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  trades: TradeDoc[];
  onSuccess: () => void;
}

type FilterMode = "date" | "range" | "all";

export default function DeleteTradesModal({ isOpen, onClose, accountId, trades, onSuccess }: DeleteTradesModalProps) {
  const [mode, setMode] = useState<FilterMode>("date");
  const [selectedDate, setSelectedDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    trades.forEach(t => {
      const d = (t as any).trade_date || (t.close_time || '').split('T')[0];
      if (d) dates.add(d);
    });
    return Array.from(dates).sort().reverse();
  }, [trades]);

  const previewCount = useMemo(() => {
    if (mode === "all") return trades.length;
    if (mode === "date" && selectedDate) {
      return trades.filter(t => {
        const d = (t as any).trade_date || (t.close_time || '').split('T')[0];
        return d === selectedDate;
      }).length;
    }
    if (mode === "range" && fromDate && toDate) {
      return trades.filter(t => {
        const d = (t as any).trade_date || (t.close_time || '').split('T')[0];
        return d >= fromDate && d <= toDate;
      }).length;
    }
    return 0;
  }, [mode, selectedDate, fromDate, toDate, trades]);

  const handleDelete = async () => {
    if (previewCount === 0) { toast.error("No trades match the selected filter."); return; }
    setLoading(true);
    try {
      if (mode === "all") {
        const res = await clearAllTradesAction(accountId);
        if (res.success) { toast.success("All trades deleted."); onSuccess(); onClose(); }
        else toast.error("Failed: " + res.error);
      } else if (mode === "date") {
        const res = await clearTradesByDateAction(accountId, selectedDate);
        if (res.success) { toast.success(`Deleted ${res.count} position(s) for ${selectedDate}.`); onSuccess(); onClose(); }
        else toast.error("Failed: " + res.error);
      } else if (mode === "range") {
        const datesToDelete = Array.from(new Set(
          trades.map(t => (t as any).trade_date || (t.close_time || '').split('T')[0])
            .filter(d => d >= fromDate && d <= toDate)
        ));
        let total = 0;
        for (const date of datesToDelete) {
          const res = await clearTradesByDateAction(accountId, date);
          if (res.success) total += (res.count || 0);
        }
        toast.success(`Deleted ${total} position(s) across ${datesToDelete.length} day(s).`);
        onSuccess(); onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setLoading(false);
      setConfirmed(false);
    }
  };

  const reset = () => {
    setMode("date"); setSelectedDate(""); setFromDate(""); setToDate(""); setConfirmed(false); onClose();
  };

  if (!isOpen) return null;

  const dangerLabel = mode === "all"
    ? "ALL trades"
    : mode === "date"
    ? `trades on ${selectedDate || "..."}`
    : `trades from ${fromDate || "..."} to ${toDate || "..."}`;

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="premium-card w-full max-w-lg p-6 shadow-2xl relative">

          {/* Header */}
          <button onClick={reset} className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors">
            <i className="las la-times text-2xl"></i>
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-rose-500/15 rounded-xl flex items-center justify-center border border-rose-500/25 shrink-0">
              <i className="las la-calendar-times text-rose-400 text-xl"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary">Delete Trades</h2>
              <p className="text-xs text-muted">Select a filter to remove specific trade sessions</p>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-2 mb-5 p-1 bg-elevated rounded-xl border border-default">
            {([
              ["date", "By Date", "la-calendar-day"],
              ["range", "Date Range", "la-calendar-week"],
              ["all", "Clear All", "la-trash-alt"],
            ] as [FilterMode, string, string][]).map(([m, label, icon]) => (
              <button
                key={m}
                onClick={() => { setMode(m); setConfirmed(false); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  mode === m
                    ? m === "all"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      : "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                    : "text-muted hover:text-secondary"
                }`}
              >
                <i className={`las ${icon} text-base`}></i>
                {label}
              </button>
            ))}
          </div>

          {/* Inputs */}
          <div className="space-y-4 mb-6">
            {mode === "date" && (
              <div>
                <label className="label-premium block mb-2">Select Date</label>
                <select
                  className="input-premium w-full"
                  value={selectedDate}
                  onChange={e => { setSelectedDate(e.target.value); setConfirmed(false); }}
                >
                  <option value="">-- Pick a trading date --</option>
                  {availableDates.map(d => {
                    const count = trades.filter(t => ((t as any).trade_date || (t.close_time || '').split('T')[0]) === d).length;
                    return <option key={d} value={d}>{d} ({count} position{count !== 1 ? 's' : ''})</option>;
                  })}
                </select>
                {availableDates.length === 0 && (
                  <p className="text-xs text-muted mt-2">No trades found in this account.</p>
                )}
              </div>
            )}

            {mode === "range" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-premium block mb-2">From Date</label>
                  <input type="date" className="input-premium w-full" value={fromDate} onChange={e => { setFromDate(e.target.value); setConfirmed(false); }} />
                </div>
                <div>
                  <label className="label-premium block mb-2">To Date</label>
                  <input type="date" className="input-premium w-full" value={toDate} onChange={e => { setToDate(e.target.value); setConfirmed(false); }} />
                </div>
              </div>
            )}

            {mode === "all" && (
              <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-4">
                <p className="text-rose-400 text-sm font-bold mb-1">⚠ Danger Zone</p>
                <p className="text-secondary text-xs leading-relaxed">
                  This will permanently delete <strong className="text-rose-300">all {trades.length} positions</strong> and every raw execution in this account. The account balance will be reset to its initial value.
                </p>
              </div>
            )}
          </div>

          {/* Preview Banner */}
          {previewCount > 0 && (
            <div className={`rounded-xl p-3 mb-5 flex items-center gap-3 border ${mode === "all" ? "bg-rose-500/10 border-rose-500/25" : "bg-amber-500/10 border-amber-500/25"}`}>
              <i className={`las la-exclamation-triangle text-xl ${mode === "all" ? "text-rose-400" : "text-amber-400"}`}></i>
              <p className={`text-sm font-semibold ${mode === "all" ? "text-rose-300" : "text-amber-300"}`}>
                {previewCount} position{previewCount !== 1 ? 's' : ''} will be permanently deleted.
              </p>
            </div>
          )}

          {/* Confirm Checkbox */}
          {previewCount > 0 && (
            <label className="flex items-start gap-3 cursor-pointer mb-5">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-rose-500/40 bg-elevated text-rose-500 cursor-pointer"
              />
              <span className="text-xs text-secondary leading-relaxed">
                I understand that deleting <strong className="text-primary">{dangerLabel}</strong> is permanent and cannot be undone.
              </span>
            </label>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button onClick={reset} className="px-5 py-2.5 rounded-xl border border-default text-secondary hover:text-primary font-bold text-sm transition-colors">
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={!confirmed || previewCount === 0 || loading}
              className="px-5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <LoadingSpinner className="w-4 h-4 border-rose-400" /> : <i className="las la-trash-alt"></i>}
              Delete Trades
            </button>
          </div>

        </div>
      </div>
    </Portal>
  );
}
