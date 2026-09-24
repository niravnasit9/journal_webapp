"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Props {
  accountBalance: number;
  currencySymbol: string;
}

export function DomesticRiskCalculator({ accountBalance, currencySymbol }: Props) {
  const [riskPercent, setRiskPercent] = useState<number>(1);
  const [stopLossPoints, setStopLossPoints] = useState<number>(10);
  const [assetPrice, setAssetPrice] = useState<number>(1000);

  // Calculations
  const riskAmount = (accountBalance * riskPercent) / 100;
  
  // Position Sizing: Risk Amount / Stop Loss Points = Quantity of shares/contracts
  // Make sure we don't divide by zero
  const suggestedQuantity = stopLossPoints > 0 ? Math.floor(riskAmount / stopLossPoints) : 0;
  
  // Total exposure (cost to buy the shares)
  const totalExposure = suggestedQuantity * assetPrice;
  const leverageRequired = totalExposure > accountBalance ? (totalExposure / accountBalance).toFixed(2) + 'x' : 'None';

  // Risk of Ruin: Trades to lose 50% of account
  const tradesToLoseHalf = Math.floor(50 / riskPercent);

  return (
    <Card className="overflow-hidden border-default shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-900/50">
      <CardHeader className="border-b border-subtle bg-elevated/50 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <i className="las la-calculator text-xl text-indigo-500"></i>
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
                Advanced Sizing Calculator
                <Badge variant="info" size="sm">Domestic Pro</Badge>
              </CardTitle>
              <p className="text-xs text-secondary mt-1">Optimize your trade size based on personal capital.</p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Inputs */}
          <div className="space-y-5">
            <div>
              <label className="text-sm font-bold text-primary mb-2 flex justify-between">
                <span>Risk Per Trade (%)</span>
                <span className="text-indigo-500">{riskPercent}% ({currencySymbol}{riskAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })})</span>
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
              <div className="flex justify-between text-xs text-secondary mt-1">
                <span>Conservative (0.1%)</span>
                <span>Aggressive (5%)</span>
              </div>
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
                <div className="relative">
                  <input 
                    type="number" 
                    value={stopLossPoints}
                    onChange={(e) => setStopLossPoints(Number(e.target.value))}
                    className="w-full bg-surface border border-subtle rounded-lg py-2 px-3 text-primary focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Outputs */}
          <div className="bg-surface rounded-xl border border-subtle p-5 flex flex-col justify-center">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">Recommended Allocation</h4>
            
            <div className="flex items-end gap-3 mb-6">
              <span className="text-5xl font-black text-primary">{suggestedQuantity.toLocaleString()}</span>
              <span className="text-lg font-bold text-secondary mb-1">Shares / Lots</span>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
              <div>
                <span className="text-secondary block mb-1">Total Exposure:</span>
                <span className="font-bold text-primary">{currencySymbol}{totalExposure.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-secondary block mb-1">Margin / Leverage:</span>
                <span className={`font-bold ${totalExposure > accountBalance ? 'text-warning' : 'text-success'}`}>{leverageRequired}</span>
              </div>
              <div>
                <span className="text-secondary block mb-1">Max Capital Loss:</span>
                <span className="font-bold text-danger">-{currencySymbol}{riskAmount.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-secondary block mb-1">Risk of Ruin (50%):</span>
                <span className="font-bold text-primary">{tradesToLoseHalf} consecutive losses</span>
              </div>
            </div>
          </div>
          
        </div>
      </CardContent>
    </Card>
  );
}
