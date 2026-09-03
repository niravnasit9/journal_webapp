"use client";

import { useUiStore } from "@/store/useUiStore";
import { AccountDoc, TradeDoc } from "@/lib/firebase/schema";

interface AccountOverviewProps {
  account: AccountDoc;
  trades: TradeDoc[];
}

export default function AccountOverview({ account, trades }: AccountOverviewProps) {
  const { activeWorkspace } = useUiStore();
  const formatCurrency = (val: number, isDomestic: boolean) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: isDomestic ? 'INR' : 'USD'
    }).format(val);
  };

  const isDomestic = activeWorkspace === "DOMESTIC";

  if (isDomestic) {
    const totalTaxesPaid = trades.reduce((sum, t) => sum + (t.total_taxes || 0), 0);
    const netPnl = trades.reduce((sum, t) => sum + (t.net_pnl || 0), 0);
    const availableFunds = account.initial_balance + netPnl;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="premium-card p-6 border-t-2 border-t-orange-500">
          <p className="text-xs font-bold text-muted uppercase">Available Funds</p>
          <p className="text-2xl font-bold text-primary mt-2">{formatCurrency(availableFunds, true)}</p>
        </div>
        <div className="premium-card p-6 border-t-2 border-t-neutral-700">
          <p className="text-xs font-bold text-muted uppercase">Margin Used</p>
          <p className="text-2xl font-bold text-primary mt-2">{formatCurrency(0, true)}</p>
        </div>
        <div className="premium-card p-6 border-t-2 border-t-rose-500">
          <p className="text-xs font-bold text-muted uppercase">Total Taxes Paid</p>
          <p className="text-2xl font-bold text-rose-400 mt-2">{formatCurrency(totalTaxesPaid, true)}</p>
        </div>
        <div className="premium-card p-6 border-t-2 border-t-emerald-500">
          <p className="text-xs font-bold text-muted uppercase">Net PnL</p>
          <p className={`text-2xl font-bold mt-2 ${netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(netPnl, true)}
          </p>
        </div>
      </div>
    );
  }

  // GLOBAL VIEW
  const grossPnl = trades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
  const equity = account.initial_balance + grossPnl;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="premium-card p-6 border-t-2 border-t-blue-500">
        <p className="text-xs font-bold text-muted uppercase">Account Balance</p>
        <p className="text-2xl font-bold text-primary mt-2">{formatCurrency(account.initial_balance, false)}</p>
      </div>
      <div className="premium-card p-6 border-t-2 border-t-indigo-500">
        <p className="text-xs font-bold text-muted uppercase">Equity</p>
        <p className="text-2xl font-bold text-primary mt-2">{formatCurrency(equity, false)}</p>
      </div>
      <div className="premium-card p-6 border-t-2 border-t-neutral-700">
        <p className="text-xs font-bold text-muted uppercase">Free Margin</p>
        <p className="text-2xl font-bold text-primary mt-2">{formatCurrency(equity, false)}</p>
      </div>
      <div className="premium-card p-6 border-t-2 border-t-emerald-500">
        <p className="text-xs font-bold text-muted uppercase">Gross PnL</p>
        <p className={`text-2xl font-bold mt-2 ${grossPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {formatCurrency(grossPnl, false)}
        </p>
      </div>
    </div>
  );
}
