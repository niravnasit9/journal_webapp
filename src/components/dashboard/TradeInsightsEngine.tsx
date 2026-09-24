"use client";

import { useMemo } from "react";
import { TradeDoc } from "@/lib/firebase/schema";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface TradeInsightsEngineProps {
  trades: TradeDoc[];
  isDomestic: boolean;
}

interface Insight {
  id: string;
  title: string;
  description: string;
  type: "warning" | "danger" | "success" | "info";
  icon: string;
}

export default function TradeInsightsEngine({ trades, isDomestic }: TradeInsightsEngineProps) {
  const insights = useMemo(() => {
    if (!trades || trades.length === 0) return [];

    const generated: Insight[] = [];

    // 1. Duration Analysis
    let totalWinDuration = 0;
    let winCount = 0;
    let totalLossDuration = 0;
    let lossCount = 0;

    const symbolPnL: Record<string, number> = {};
    const dailyTradesCount: Record<string, number> = {};

    let totalGrossPnL = 0;
    let totalTaxes = 0;

    trades.forEach((t) => {
      // PnL & Taxes
      const netPnL = isDomestic ? (t.net_pnl || 0) : (t.profit_loss - (t.commission || 0));
      const grossPnL = isDomestic ? (t.gross_pnl || 0) : t.profit_loss;
      
      if (isDomestic) {
        totalGrossPnL += grossPnL;
        totalTaxes += (t.total_taxes || 0);
      }

      // Symbol Tracking
      if (!symbolPnL[t.symbol]) symbolPnL[t.symbol] = 0;
      symbolPnL[t.symbol] += netPnL;

      // Daily Trades for Overtrading
      const tradeDate = new Date(t.close_time).toLocaleDateString();
      if (!dailyTradesCount[tradeDate]) dailyTradesCount[tradeDate] = 0;
      dailyTradesCount[tradeDate]++;

      // Duration
      if (t.open_time && t.close_time) {
        const durationMs = new Date(t.close_time).getTime() - new Date(t.open_time).getTime();
        if (durationMs > 0) {
          if (netPnL > 0) {
            totalWinDuration += durationMs;
            winCount++;
          } else if (netPnL < 0) {
            totalLossDuration += durationMs;
            lossCount++;
          }
        }
      }
    });

    // Generate Duration Insight
    if (winCount > 0 && lossCount > 0) {
      const avgWinDuration = totalWinDuration / winCount;
      const avgLossDuration = totalLossDuration / lossCount;

      if (avgWinDuration < avgLossDuration / 2) {
        generated.push({
          id: "cut-winners",
          title: "Cutting Winners Early",
          description: `Your average losing trade lasts ${formatDuration(avgLossDuration)}, while your winners last only ${formatDuration(avgWinDuration)}. You might be closing profitable trades too soon out of fear while holding losers hoping they bounce back.`,
          type: "warning",
          icon: "la-exclamation-triangle"
        });
      } else if (avgLossDuration < avgWinDuration / 2) {
        generated.push({
          id: "let-winners-run",
          title: "Great Trade Management",
          description: `You are holding winners longer (${formatDuration(avgWinDuration)}) than losers (${formatDuration(avgLossDuration)}). This is a hallmark of profitable trading!`,
          type: "success",
          icon: "la-check-circle"
        });
      }
    }

    // Generate Tax Drag Insight
    if (isDomestic && totalGrossPnL > 0 && totalTaxes > totalGrossPnL * 0.25) {
      generated.push({
        id: "tax-drag",
        title: "High Tax & Brokerage Drag",
        description: `Taxes and fees are eating up ${((totalTaxes / totalGrossPnL) * 100).toFixed(1)}% of your gross profits. Consider reducing your trade frequency or focusing on higher reward-to-risk setups to offset costs.`,
        type: "danger",
        icon: "la-hand-holding-usd"
      });
    }

    // Generate Overtrading Insight
    const overtradedDays = Object.entries(dailyTradesCount).filter(([_, count]) => count > 10);
    if (overtradedDays.length > 0) {
      generated.push({
        id: "overtrading",
        title: "Overtrading Detected",
        description: `You took more than 10 trades on ${overtradedDays.length} day(s). High frequency often leads to emotional exhaustion and lower quality setups.`,
        type: "danger",
        icon: "la-burn"
      });
    }

    // Asset Performance Insight
    const sortedAssets = Object.entries(symbolPnL).sort((a, b) => b[1] - a[1]);
    if (sortedAssets.length >= 2) {
      const bestAsset = sortedAssets[0];
      const worstAsset = sortedAssets[sortedAssets.length - 1];

      if (bestAsset[1] > 0) {
        generated.push({
          id: "best-asset",
          title: "The Cash Cow",
          description: `${bestAsset[0]} is your most profitable asset. Focus your screen time on setups here.`,
          type: "success",
          icon: "la-trophy"
        });
      }

      if (worstAsset[1] < 0) {
        generated.push({
          id: "worst-asset",
          title: "The Wealth Destroyer",
          description: `${worstAsset[0]} is causing your biggest drawdowns. Consider avoiding this asset or paper-trading it until you find an edge.`,
          type: "danger",
          icon: "la-skull-crossbones"
        });
      }
    }

    return generated;
  }, [trades, isDomestic]);

  if (insights.length === 0) return null;

  return (
    <div className="w-full mb-6">
      <h2 className="text-sm font-bold text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
        <i className="las la-brain text-info text-lg"></i>
        Smart Trade Insights
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
        {insights.map((insight) => (
          <Card 
            key={insight.id} 
            className={`min-w-[280px] sm:min-w-[320px] max-w-[350px] p-5 shrink-0 snap-center border-l-4 ${getBorderColor(insight.type)} transition-transform hover:-translate-y-1`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${getIconBg(insight.type)}`}>
                <i className={`las ${insight.icon} text-2xl ${getIconColor(insight.type)}`}></i>
              </div>
              <div>
                <h3 className="font-bold text-primary text-base">{insight.title}</h3>
                <p className="text-secondary text-sm mt-1 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Helpers
function formatDuration(ms: number) {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = (mins / 60).toFixed(1);
  return `${hrs}h`;
}

function getBorderColor(type: string) {
  switch (type) {
    case "warning": return "border-warning";
    case "danger": return "border-danger";
    case "success": return "border-success";
    case "info": return "border-info";
    default: return "border-default";
  }
}

function getIconBg(type: string) {
  switch (type) {
    case "warning": return "bg-warning-bg";
    case "danger": return "bg-danger-bg";
    case "success": return "bg-success-bg";
    case "info": return "bg-info-bg";
    default: return "bg-elevated";
  }
}

function getIconColor(type: string) {
  switch (type) {
    case "warning": return "text-warning";
    case "danger": return "text-danger";
    case "success": return "text-success";
    case "info": return "text-info";
    default: return "text-primary";
  }
}
