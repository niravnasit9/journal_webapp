"use client";

import React, { useState, useMemo } from "react";
import { useUiStore } from "@/store/useUiStore";
import { RawExecutionDoc } from "@/lib/firebase/schema";
import { format } from "date-fns";
import { DateRangePicker, DateRangePreset, DateRange } from "@/components/ui/DateRangePicker";

interface TradingHistoryProps {
  executions: RawExecutionDoc[];
  onEditTrade?: (trade: any) => void;
  onDeleteTrade?: (tradeId: string) => void;
}

export default function TradingHistory({ executions, onEditTrade, onDeleteTrade }: TradingHistoryProps) {
  const { activeWorkspace } = useUiStore();
  const isDomestic = activeWorkspace === "DOMESTIC";

  // ── Filter state ──────────────────────────────────────────────────────────
  const [symbolSearch, setSymbolSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DateRangePreset>('all');
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
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

  // Group by date (descending)
  const groupedByDate = useMemo(() => {
    const groups: Record<string, RawExecutionDoc[]> = {};
    filtered.forEach(e => {
      const date = (e.time || "").split("T")[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(e);
    });
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a)) // descending
      .map(date => {
        const dayExecs = groups[date];
        const dailyBuys = dayExecs.filter(e => e.direction === "BUY").length;
        const dailySells = dayExecs.filter(e => e.direction === "SELL").length;
        const dailyTaxes = dayExecs.reduce((s, e) => s + ((e.brokerage || 0) + (e.stt || 0) + (e.transaction_charges || 0) + (e.gst || 0) + (e.sebi || 0) + (e.stamp_duty || 0)), 0);
        return { date, dayExecs, dailyBuys, dailySells, dailyTaxes };
      });
  }, [filtered]);

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
      <div className="border-b border-default bg-background/50 px-5 py-4 flex flex-col gap-4">
        {/* Top Row: Search and Date */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Symbol Search */}
            <div className="relative">
              <i className="las la-search absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm"></i>
              <input
                type="text"
                placeholder="Symbol..."
                value={symbolSearch}
                onChange={e => setSymbolSearch(e.target.value)}
                className="input-premium pl-8 py-1.5 text-xs w-48"
              />
            </div>

            {/* Date Range Picker */}
            <div className="z-50">
              <DateRangePicker 
                value={datePreset}
                onChange={(range: DateRange) => {
                  setDatePreset(range.preset);
                  setDateFrom(range.start ? format(range.start, "yyyy-MM-dd") : "");
                  setDateTo(range.end ? format(range.end, "yyyy-MM-dd") : "");
                }}
              />
            </div>
          </div>
          
          {/* Clear Button */}
          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors border border-rose-500/20">
              <i className="las la-times"></i> Clear Filters
            </button>
          )}
        </div>

        {/* Bottom Row: Toggle Buttons */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Direction toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Direction:</span>
            <div className="flex rounded-lg border border-default overflow-hidden text-xs font-bold">
              {(["ALL", "BUY", "SELL"] as const).map((v, i) => (
                <button key={v} onClick={() => setDirectionFilter(v)}
                  className={`px-3 py-1.5 transition-colors ${directionFilter === v
                    ? v === "BUY" ? "bg-emerald-500/20 text-emerald-400"
                    : v === "SELL" ? "bg-rose-500/20 text-rose-400"
                    : "bg-elevated text-primary"
                    : "text-muted hover:text-secondary"} ${i > 0 ? "border-l border-default" : ""}`}>
                  {v === "ALL" ? "All" : v}
                </button>
              ))}
            </div>
          </div>

          {/* Segment (domestic only) */}
          {isDomestic && segments.length > 0 && (
            <div className="flex items-center gap-2 max-w-full">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest shrink-0">Segment:</span>
              <div className="flex rounded-lg border border-default overflow-x-auto no-scrollbar text-xs font-bold whitespace-nowrap">
                <button
                  onClick={() => setSegmentFilter("ALL")}
                  className={`px-3 py-1.5 transition-colors ${segmentFilter === "ALL" ? "bg-elevated text-primary" : "text-muted hover:text-secondary"}`}
                >
                  All
                </button>
                {segments.map(s => (
                  <button
                    key={s}
                    onClick={() => setSegmentFilter(s)}
                    className={`px-3 py-1.5 transition-colors border-l border-default ${segmentFilter === s ? "bg-elevated text-primary" : "text-muted hover:text-secondary"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto pb-2">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-elevated text-muted text-[10px] font-bold uppercase tracking-widest border-b border-default">
              <th className="px-6 py-4">Time</th>
              {isDomestic ? (
                <>
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4 hidden md:table-cell">Segment</th>
                  <th className="px-6 py-4">Direction</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Qty</th>
                  <th className="px-6 py-4 text-right hidden sm:table-cell">Price</th>
                  <th className="px-6 py-4 text-right hidden lg:table-cell">Turnover</th>
                  <th className="px-6 py-4 text-right hidden md:table-cell">Taxes</th>
                </>
              ) : (
                <>
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4">Direction</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Qty</th>
                  <th className="px-6 py-4 text-right hidden sm:table-cell">Price</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-default">
            {groupedByDate.map(group => (
              <React.Fragment key={group.date}>
                {/* Date Group Header */}
                <tr className="bg-surface border-b border-default border-t border-t-white/10">
                  <td colSpan={isDomestic ? 8 : 4} className="px-6 py-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-sm bg-elevated px-3 py-1 rounded border border-default">
                          {format(new Date(group.date), "EEE, dd MMM yyyy")}
                        </span>
                        <span className="text-xs font-bold text-muted uppercase">
                          {group.dayExecs.length} Executions
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono font-bold">
                        <span className="text-emerald-600 dark:text-emerald-400">{group.dailyBuys} BUY</span>
                        <span className="text-rose-600 dark:text-rose-400">{group.dailySells} SELL</span>
                        {isDomestic && <span className="text-rose-600 dark:text-rose-400 ml-2">Tax: {formatCurrency(group.dailyTaxes)}</span>}
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Date Group Executions */}
                {group.dayExecs.map(t => {
                  const totalTax = (t.brokerage || 0) + (t.stt || 0) + (t.transaction_charges || 0) + (t.gst || 0) + (t.sebi || 0) + (t.stamp_duty || 0);
                  const turnover = (t.quantity || 0) * (t.price || 0);
                  return (
                    <tr key={t.id} className="hover:bg-elevated/50 transition-colors group">
                      <td className="px-6 py-4 text-secondary font-mono text-xs">{formatDate(t.time)}</td>
                      {isDomestic ? (
                        <>
                          <td className="px-6 py-4 font-bold text-primary whitespace-normal break-words min-w-[120px]">
                            {(t as any).domestic_segment === "FNO_OPTIONS"
                              ? `${t.symbol || "Unknown Asset"} ${t.symbol?.includes((t as any).strike_price?.toString()) ? "" : ((t as any).strike_price || "")} ${t.symbol?.includes((t as any).option_type) ? "" : ((t as any).option_type || "")}`.trim()
                              : (t.symbol || "Unknown Asset")}
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              (t as any).domestic_segment === "COMMODITY" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : (t as any).domestic_segment === "FNO_OPTIONS" ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                              : (t as any).domestic_segment === "IPO" ? "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 font-black border border-fuchsia-500/20"
                              : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                            }`}>
                              {(t as any).domestic_segment || "EQUITY"}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold">
                            <span className={t.direction === "BUY" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>{t.direction}</span>
                          </td>
                          <td className="px-6 py-4 text-secondary font-mono hidden sm:table-cell">{t.quantity || 0}</td>
                          <td className="px-6 py-4 text-right font-mono text-xs text-secondary hidden sm:table-cell">{formatCurrency(t.price || 0)}</td>
                          <td className="px-6 py-4 text-right font-mono text-xs text-secondary hidden lg:table-cell">{formatCurrency(turnover)}</td>
                          <td className="px-6 py-4 text-right text-rose-600 dark:text-rose-400 font-mono text-xs hidden md:table-cell">{formatCurrency(totalTax)}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 font-bold text-primary whitespace-normal break-words min-w-[120px]">{t.symbol}</td>
                          <td className="px-6 py-4 font-bold">
                            <span className={t.direction === "BUY" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>{t.direction}</span>
                          </td>
                          <td className="px-6 py-4 text-secondary font-mono hidden sm:table-cell">{t.quantity || 0}</td>
                          <td className="px-6 py-4 text-right font-mono text-xs text-secondary hidden sm:table-cell">{formatCurrency(t.price || 0)}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
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
