"use client";

import { useState, useMemo } from "react";
import { useUiStore } from "@/store/useUiStore";
import { RawExecutionDoc } from "@/lib/firebase/schema";
import { format } from "date-fns";

interface TradingHistoryProps {
  executions: RawExecutionDoc[];
  onEditTrade?: (trade: any) => void;
  onDeleteTrade?: (tradeId: string) => void;
}

export default function TradingHistory({ executions, onEditTrade, onDeleteTrade }: TradingHistoryProps) {
  const { activeWorkspace } = useUiStore();
  const isDomestic = activeWorkspace === "DOMESTIC";

  // ── Filter state ──────────────────────────────────────────────────────────
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [symbolSearch, setSymbolSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState<"ALL" | "BUY" | "SELL">("ALL");
  const [segmentFilter, setSegmentFilter] = useState("ALL");

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: isDomestic ? "INR" : "USD",
    }).format(val);

  const formatDate = (dateStr: string) => {
    try { return format(new Date(dateStr), "dd/MM/yy HH:mm:ss"); }
    catch { return dateStr || "—"; }
  };

  // Unique segments from data
  const segments = useMemo(() => {
    const s = new Set<string>();
    executions.forEach(e => { if ((e as any).domestic_segment) s.add((e as any).domestic_segment); });
    return Array.from(s);
  }, [executions]);

  // ── Apply filters ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return executions.filter(e => {
      const execDate = (e.time || "").split("T")[0];
      if (dateFrom && execDate < dateFrom) return false;
      if (dateTo && execDate > dateTo) return false;
      if (symbolSearch) {
        const sym = ((e as any).domestic_segment === "FNO_OPTIONS"
          ? `${e.symbol} ${(e as any).strike_price || ""} ${(e as any).option_type || ""}`
          : e.symbol
        ).toLowerCase();
        if (!sym.includes(symbolSearch.toLowerCase())) return false;
      }
      if (directionFilter !== "ALL" && e.direction !== directionFilter) return false;
      if (segmentFilter !== "ALL" && (e as any).domestic_segment !== segmentFilter) return false;
      return true;
    });
  }, [executions, dateFrom, dateTo, symbolSearch, directionFilter, segmentFilter]);

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalBuys = filtered.filter(e => e.direction === "BUY").length;
  const totalSells = filtered.filter(e => e.direction === "SELL").length;
  const totalTaxes = filtered.reduce((s, e) => s + ((e.brokerage || 0) + (e.stt || 0) + (e.transaction_charges || 0) + (e.gst || 0) + (e.sebi || 0) + (e.stamp_duty || 0)), 0);

  const hasActiveFilters = dateFrom || dateTo || symbolSearch || directionFilter !== "ALL" || segmentFilter !== "ALL";

  const clearFilters = () => {
    setDateFrom(""); setDateTo(""); setSymbolSearch("");
    setDirectionFilter("ALL"); setSegmentFilter("ALL");
  };

  return (
    <div className="premium-card p-0 overflow-hidden">
      {/* Header */}
      <div className="bg-elevated border-b border-default p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest">Trading History</h2>
          <p className="text-xs text-muted mt-0.5">
            {filtered.length} of {executions.length} execution{executions.length !== 1 ? "s" : ""}
            {hasActiveFilters && <span className="ml-1 text-blue-400">(filtered)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
            {totalBuys} BUY
          </span>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full border border-rose-500/25 bg-rose-500/10 text-rose-400">
            {totalSells} SELL
          </span>
          {isDomestic && (
            <span className="text-xs font-mono px-3 py-1.5 rounded-full border border-rose-500/20 bg-rose-500/5 text-rose-400">
              Total Tax {formatCurrency(totalTaxes)}
            </span>
          )}
          <span className="text-xs font-mono px-3 py-1.5 rounded-full border border-default bg-background text-secondary">
            {filtered.length} Trades
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="border-b border-default bg-background/50 px-5 py-3 flex flex-wrap gap-2 items-center">
        {/* Symbol search */}
        <div className="relative">
          <i className="las la-search absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm"></i>
          <input
            type="text"
            placeholder="Symbol..."
            value={symbolSearch}
            onChange={e => setSymbolSearch(e.target.value)}
            className="input-premium pl-8 py-1.5 text-xs w-36"
          />
        </div>

        {/* Date From */}
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] text-muted font-bold uppercase tracking-wider whitespace-nowrap">From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="input-premium py-1.5 text-xs w-36" />
        </div>

        {/* Date To */}
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] text-muted font-bold uppercase tracking-wider whitespace-nowrap">To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="input-premium py-1.5 text-xs w-36" />
        </div>

        {/* Segment (domestic only) */}
        {isDomestic && segments.length > 0 && (
          <select value={segmentFilter} onChange={e => setSegmentFilter(e.target.value)}
            className="input-premium py-1.5 text-xs">
            <option value="ALL">All Segments</option>
            {segments.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}

        {/* Direction toggle */}
        <div className="flex rounded-lg border border-default overflow-hidden text-xs font-bold">
          {(["ALL", "BUY", "SELL"] as const).map(v => (
            <button key={v} onClick={() => setDirectionFilter(v)}
              className={`px-3 py-1.5 transition-colors ${directionFilter === v
                ? v === "BUY" ? "bg-emerald-500/20 text-emerald-400"
                : v === "SELL" ? "bg-rose-500/20 text-rose-400"
                : "bg-elevated text-primary"
                : "text-muted hover:text-secondary"}`}>
              {v === "ALL" ? "All" : v}
            </button>
          ))}
        </div>

        {/* Clear */}
        {hasActiveFilters && (
          <button onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors border border-rose-500/20">
            <i className="las la-times"></i> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-elevated text-muted text-[10px] font-bold uppercase tracking-widest border-b border-default">
              <th className="px-6 py-4">Time</th>
              {isDomestic ? (
                <>
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4">Segment</th>
                  <th className="px-6 py-4">Direction</th>
                  <th className="px-6 py-4">Qty</th>
                  <th className="px-6 py-4 text-right">Price</th>
                  <th className="px-6 py-4 text-right">Turnover</th>
                  <th className="px-6 py-4 text-right">Taxes</th>
                </>
              ) : (
                <>
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4">Direction</th>
                  <th className="px-6 py-4">Qty</th>
                  <th className="px-6 py-4 text-right">Price</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-default">
            {filtered.map(t => {
              const totalTax = (t.brokerage || 0) + (t.stt || 0) + (t.transaction_charges || 0) + (t.gst || 0) + (t.sebi || 0) + (t.stamp_duty || 0);
              const turnover = (t.quantity || 0) * (t.price || 0);
              return (
                <tr key={t.id} className="hover:bg-elevated/50 transition-colors group">
                  <td className="px-6 py-4 text-secondary font-mono text-xs">{formatDate(t.time)}</td>
                  {isDomestic ? (
                    <>
                      <td className="px-6 py-4 font-bold text-primary">
                        {(t as any).domestic_segment === "FNO_OPTIONS"
                          ? `${t.symbol} ${(t as any).strike_price || ""} ${(t as any).option_type || ""}`
                          : t.symbol}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          (t as any).domestic_segment === "COMMODITY" ? "bg-amber-500/15 text-amber-400"
                          : (t as any).domestic_segment === "FNO_OPTIONS" ? "bg-purple-500/15 text-purple-400"
                          : "bg-blue-500/15 text-blue-400"
                        }`}>
                          {(t as any).domestic_segment || "EQUITY"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold">
                        <span className={t.direction === "BUY" ? "text-emerald-400" : "text-rose-400"}>{t.direction}</span>
                      </td>
                      <td className="px-6 py-4 text-secondary font-mono">{t.quantity || 0}</td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-secondary">{formatCurrency(t.price || 0)}</td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-secondary">{formatCurrency(turnover)}</td>
                      <td className="px-6 py-4 text-right text-rose-400 font-mono text-xs">{formatCurrency(totalTax)}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 font-bold text-primary">{t.symbol}</td>
                      <td className="px-6 py-4 font-bold">
                        <span className={t.direction === "BUY" ? "text-emerald-400" : "text-rose-400"}>{t.direction}</span>
                      </td>
                      <td className="px-6 py-4 text-secondary font-mono">{t.quantity || 0}</td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-secondary">{formatCurrency(t.price || 0)}</td>
                    </>
                  )}
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center">
                  <p className="text-muted font-bold mb-1">No executions found</p>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-xs text-blue-400 hover:underline">Clear filters</button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
