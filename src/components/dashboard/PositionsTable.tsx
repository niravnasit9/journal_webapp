"use client";

import React, { useState, useMemo } from "react";
import { useUiStore } from "@/store/useUiStore";
import { TradeDoc } from "@/lib/firebase/schema";
import { format } from "date-fns";
import { DateRangePicker, DateRangePreset, DateRange } from "@/components/ui/DateRangePicker";

interface PositionsTableProps {
  positions: TradeDoc[];
}

export default function PositionsTable({ positions }: PositionsTableProps) {
  const { activeWorkspace } = useUiStore();
  const isDomestic = activeWorkspace === "DOMESTIC";

  // ── Filter state ──────────────────────────────────────────────────────────
  const [datePreset, setDatePreset] = useState<DateRangePreset>('all');
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [symbolSearch, setSymbolSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("CLOSED");
  const [pnlFilter, setPnlFilter] = useState("ALL"); // ALL | WIN | LOSS

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: isDomestic ? "INR" : "USD",
    }).format(val);

  const formatDate = (dateStr: string) => {
    try { return format(new Date(dateStr), "dd/MM/yy HH:mm"); }
    catch { return dateStr || "—"; }
  };

  // Unique segments from data
  const segments = useMemo(() => {
    const s = new Set<string>();
    positions.forEach(p => { if ((p as any).domestic_segment) s.add((p as any).domestic_segment); });
    return Array.from(s);
  }, [positions]);

  // ── Apply filters ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return positions.filter(p => {
      const tradeDate = (p as any).trade_date || (p.close_time || "").split("T")[0];
      if (dateFrom && tradeDate < dateFrom) return false;
      if (dateTo && tradeDate > dateTo) return false;
      if (symbolSearch) {
        const sym = ((p as any).domestic_segment === "FNO_OPTIONS"
          ? `${p.symbol} ${(p as any).strike_price || ""} ${(p as any).option_type || ""}`
          : p.symbol
        ).toLowerCase();
        if (!sym.includes(symbolSearch.toLowerCase())) return false;
      }
      if (segmentFilter !== "ALL" && (p as any).domestic_segment !== segmentFilter) return false;
      if ((p as any).status !== statusFilter) return false;
      const pnl = (p as any).net_pnl ?? p.profit_loss ?? 0;
      if (pnlFilter === "WIN" && pnl <= 0) return false;
      if (pnlFilter === "LOSS" && pnl >= 0) return false;
      return true;
    });
  }, [positions, dateFrom, dateTo, symbolSearch, segmentFilter, statusFilter, pnlFilter]);

  // Group by date (descending)
  const groupedByDate = useMemo(() => {
    const groups: Record<string, TradeDoc[]> = {};
    filtered.forEach(p => {
      const date = (p as any).trade_date || (p.close_time || "").split("T")[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(p);
    });
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a)) // descending
      .map(date => {
        const dayTrades = groups[date];
        const dailyGross = dayTrades.reduce((s, p) => s + ((p as any).gross_pnl ?? p.profit_loss ?? 0), 0);
        const dailyNet = dayTrades.reduce((s, p) => s + ((p as any).net_pnl ?? p.profit_loss ?? 0), 0);
        const dailyTaxes = dayTrades.reduce((s, p) => s + ((p as any).total_taxes ?? 0), 0);
        const dailyWins = dayTrades.filter(p => ((p as any).net_pnl ?? p.profit_loss ?? 0) > 0).length;
        return { date, dayTrades, dailyGross, dailyNet, dailyTaxes, dailyWins };
      });
  }, [filtered]);

  // ── Summary row ───────────────────────────────────────────────────────────
  const totalGross = filtered.reduce((s, p) => s + ((p as any).gross_pnl ?? 0), 0);
  const totalNet = filtered.reduce((s, p) => s + ((p as any).net_pnl ?? p.profit_loss ?? 0), 0);
  const totalTaxes = filtered.reduce((s, p) => s + ((p as any).total_taxes ?? 0), 0);

  const hasActiveFilters = dateFrom || dateTo || symbolSearch || segmentFilter !== "ALL" || statusFilter !== "ALL" || pnlFilter !== "ALL";

  const clearFilters = () => {
    setDateFrom(""); setDateTo(""); setSymbolSearch("");
    setSegmentFilter("ALL"); setStatusFilter("CLOSED"); setPnlFilter("ALL");
  };

  return (
    <div className="premium-card p-0 overflow-hidden">
      {/* Header */}
      <div className="bg-elevated border-b border-default p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest">Daily Positions</h2>
          <p className="text-xs text-muted mt-0.5">
            {filtered.length} of {positions.length} position{positions.length !== 1 ? "s" : ""}
            {hasActiveFilters && <span className="ml-1 text-blue-400">(filtered)</span>}
          </p>
        </div>
        {/* Summary chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${totalNet >= 0 ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" : "bg-rose-500/10 border-rose-500/25 text-rose-400"}`}>
            Net {formatCurrency(totalNet)}
          </span>
          <span className="text-xs font-mono px-3 py-1.5 rounded-full border border-default bg-background text-secondary">
            Gross {formatCurrency(totalGross)}
          </span>
          {isDomestic && (
            <span className="text-xs font-mono px-3 py-1.5 rounded-full border border-rose-500/20 bg-rose-500/5 text-rose-400">
              Tax {formatCurrency(totalTaxes)}
            </span>
          )}
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
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Status:</span>
            <div className="flex rounded-lg border border-default overflow-hidden text-xs font-bold">
              {(["CLOSED", "OPEN"] as const).map(v => (
                <button key={v} onClick={() => setStatusFilter(v)}
                  className={`px-3 py-1.5 transition-colors ${statusFilter === v
                    ? "bg-elevated text-primary"
                    : "text-muted hover:text-secondary"} ${v === "OPEN" ? "border-l border-default" : ""}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* PnL */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">PnL:</span>
            <div className="flex rounded-lg border border-default overflow-hidden text-xs font-bold">
              {(["ALL", "WIN", "LOSS"] as const).map((v, i) => (
                <button key={v} onClick={() => setPnlFilter(v)}
                  className={`px-3 py-1.5 transition-colors ${pnlFilter === v
                    ? v === "WIN" ? "bg-emerald-500/20 text-emerald-400"
                    : v === "LOSS" ? "bg-rose-500/20 text-rose-400"
                    : "bg-elevated text-primary"
                    : "text-muted hover:text-secondary"} ${i > 0 ? "border-l border-default" : ""}`}>
                  {v === "ALL" ? "All" : v === "WIN" ? "✓ Win" : "✗ Loss"}
                </button>
              ))}
            </div>
          </div>

          {/* Segment (domestic only) */}
          {isDomestic && segments.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Segment:</span>
              <div className="flex rounded-lg border border-default overflow-hidden text-xs font-bold flex-wrap">
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
              <th className="px-6 py-4">Entry Time</th>
              <th className="px-6 py-4">Exit Time</th>
              {isDomestic ? (
                <>
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4 text-right">Avg Buy</th>
                  <th className="px-6 py-4 text-right">Avg Sell</th>
                  <th className="px-6 py-4">Position Size</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Gross PnL</th>
                  <th className="px-6 py-4 text-right">Taxes</th>
                  <th className="px-6 py-4 text-right">Net PnL</th>
                </>
              ) : (
                <>
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4">Lots</th>
                  <th className="px-6 py-4">Pips</th>
                  <th className="px-6 py-4 text-right">Gross PnL</th>
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white uppercase tracking-widest text-sm bg-elevated px-3 py-1 rounded border border-default">
                          {format(new Date(group.date), "EEE, dd MMM yyyy")}
                        </span>
                        <span className="text-xs font-bold text-muted uppercase">
                          {group.dayTrades.length} Trades • {group.dailyWins} Wins
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono font-bold">
                        <span className="text-muted">Gross: <span className={group.dailyGross >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatCurrency(group.dailyGross)}</span></span>
                        {isDomestic && <span className="text-rose-400">Tax: {formatCurrency(group.dailyTaxes)}</span>}
                        <span className="text-white px-3 py-1 rounded bg-elevated border border-default shadow-sm">
                          Net: <span className={group.dailyNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatCurrency(group.dailyNet)}</span>
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Date Group Trades */}
                {group.dayTrades.map(t => (
                  <tr key={t.id} className="hover:bg-elevated/50 transition-colors group">
                    <td className="px-6 py-4 text-secondary font-mono text-xs">{formatDate(t.open_time || (t as any).trade_date || "")}</td>
                    <td className="px-6 py-4 text-secondary font-mono text-xs">{formatDate(t.close_time || (t as any).trade_date || "")}</td>
                    {isDomestic ? (
                      <>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-primary">
                              {(t as any).domestic_segment === "FNO_OPTIONS"
                                ? `${t.symbol || "Unknown Asset"} ${(t as any).strike_price || ""} ${(t as any).option_type || ""}`.trim()
                                : (t.symbol || "Unknown Asset")}
                            </span>
                            {(t as any).domestic_segment && (
                              <span className="text-[10px] text-muted">{(t as any).domestic_segment}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-xs text-emerald-400">{formatCurrency(t.open_price || 0)}</td>
                        <td className="px-6 py-4 text-right font-mono text-xs text-rose-400">{formatCurrency(t.close_price || 0)}</td>
                        <td className="px-6 py-4 text-secondary font-mono">
                          {(t as any).lots && (t as any).lots !== (t as any).units ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-primary">{(t as any).lots} Lots</span>
                              <span className="text-[10px] text-muted">{(t as any).units} Units</span>
                            </div>
                          ) : (
                            <span className="font-bold text-primary">{(t as any).units || 0} Units</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            (t as any).status === "CLOSED"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-amber-500/15 text-amber-400"
                          }`}>
                            {(t as any).status || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-xs">
                          <span className={((t as any).gross_pnl || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            {formatCurrency((t as any).gross_pnl || 0)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-rose-400 font-mono text-xs">{formatCurrency((t as any).total_taxes || 0)}</td>
                        <td className="px-6 py-4 text-right font-bold font-mono">
                          <span className={((t as any).net_pnl || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            {formatCurrency((t as any).net_pnl || 0)}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 font-bold text-primary">{t.symbol}</td>
                        <td className="px-6 py-4 text-secondary font-mono">{(t as any).lots || 0}</td>
                        <td className="px-6 py-4 text-secondary font-mono">0</td>
                        <td className="px-6 py-4 text-right font-bold font-mono">
                          <span className={(t.profit_loss || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            {formatCurrency(t.profit_loss || 0)}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </React.Fragment>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={12} className="px-6 py-12 text-center">
                  <p className="text-muted font-bold mb-1">No positions found</p>
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
