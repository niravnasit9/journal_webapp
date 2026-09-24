"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface Props {
  accountBalance: number;
  currencySymbol: string;
}

export function Tier1Free({ accountBalance, currencySymbol }: Props) {
  const [riskPercent, setRiskPercent] = useState<number>(1);
  const [stopLossPoints, setStopLossPoints] = useState<number>(10);
  const [assetPrice, setAssetPrice] = useState<number>(1000);

  const riskAmount = (accountBalance * riskPercent) / 100;
  const suggestedQuantity = stopLossPoints > 0 ? Math.floor(riskAmount / stopLossPoints) : 0;
  
  // Loss recovery table logic
  const recoveryData = [
    { loss: 5, recovery: 5.3 },
    { loss: 10, recovery: 11.1 },
    { loss: 20, recovery: 25.0 },
    { loss: 30, recovery: 42.9 },
    { loss: 40, recovery: 66.7 },
    { loss: 50, recovery: 100.0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Manual Position Sizing Card */}
        <Card className="border-default shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-900/50">
          <CardHeader className="border-b border-subtle bg-elevated/50 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <i className="las la-calculator text-primary"></i> Manual Position Sizer
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div>
              <label className="text-sm font-bold text-primary mb-2 flex justify-between">
                <span>Account Balance</span>
                <span>{currencySymbol}{accountBalance.toLocaleString()}</span>
              </label>
            </div>
            <div>
              <label className="text-sm font-bold text-primary mb-2 flex justify-between">
                <span>Risk Per Trade (%)</span>
                <span className="text-indigo-500">{riskPercent}%</span>
              </label>
              <input 
                type="range" 
                min="0.1" 
                max="5" 
                step="0.1" 
                value={riskPercent} 
                onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-primary mb-1 block">Entry Price</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-secondary">
                    {currencySymbol}
                  </div>
                  <input 
                    type="number" 
                    value={assetPrice}
                    onChange={(e) => setAssetPrice(Number(e.target.value))}
                    className="w-full bg-surface border border-subtle rounded-lg py-2 pl-8 pr-3 text-primary focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-primary mb-1 block">Stop Loss (Points)</label>
                <input 
                  type="number" 
                  value={stopLossPoints}
                  onChange={(e) => setStopLossPoints(Number(e.target.value))}
                  className="w-full bg-surface border border-subtle rounded-lg py-2 px-3 text-primary focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="mt-4 p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-center">
              <p className="text-sm text-secondary mb-1">Your recommended position size is</p>
              <h3 className="text-2xl font-black text-indigo-500">{suggestedQuantity.toLocaleString()} Units / Lots</h3>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Static Risk Display */}
          <Card className="border-default shadow-sm h-min">
            <CardContent className="p-6 text-center">
              <h4 className="text-sm font-bold text-secondary uppercase tracking-widest mb-2">Absolute Cash at Risk</h4>
              <p className="text-5xl font-black text-danger">-{currencySymbol}{riskAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-secondary mt-2">Based on your {riskPercent}% input parameters.</p>
            </CardContent>
          </Card>

          {/* Static Loss Recovery Table */}
          <Card className="border-default shadow-sm">
            <CardHeader className="py-4 border-b border-subtle">
              <CardTitle className="text-sm uppercase tracking-widest">Mathematical Recovery</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-elevated/50 text-secondary border-b border-subtle">
                  <tr>
                    <th className="px-4 py-3 font-bold">Drawdown (%)</th>
                    <th className="px-4 py-3 font-bold">Required to Recover (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {recoveryData.map((row) => (
                    <tr key={row.loss} className="hover:bg-elevated/20">
                      <td className="px-4 py-3 text-danger font-bold">-{row.loss}%</td>
                      <td className="px-4 py-3 text-success font-bold">+{row.recovery}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
