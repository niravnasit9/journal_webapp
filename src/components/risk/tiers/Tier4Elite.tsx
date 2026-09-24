"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LockedOverlay } from "./LockedOverlay";
import { useState } from "react";

interface Props {
  hasAccess: boolean;
}

export function Tier4Elite({ hasAccess }: Props) {
  const [killSwitchEnabled, setKillSwitchEnabled] = useState(false);

  return (
    <div className="mt-12 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <i className="las la-crown text-purple-500"></i> Institutional System
        </h2>
        <p className="text-sm text-secondary">Statistical processing engines and deep server-side logic.</p>
      </div>

      <LockedOverlay isLocked={!hasAccess} requiredTier="Elite" checkoutPath="/checkout/elite">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Statistical Analysis Dashboard */}
          <Card className="border-default shadow-sm border-purple-500/20">
            <CardHeader className="py-4 border-b border-subtle bg-purple-500/5">
              <CardTitle className="text-sm uppercase tracking-widest flex items-center gap-2 text-purple-500">
                <i className="las la-chart-area text-lg"></i> Statistical Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-xs text-secondary mb-6">
                Processed via background analytics worker simulating 10,000 randomized trade sequences based on your historical journal data.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-surface border border-subtle rounded-xl text-center">
                  <span className="text-xs text-secondary block mb-1 uppercase font-bold tracking-widest">Sharpe Ratio</span>
                  <span className="text-2xl font-black text-primary">1.84</span>
                  <span className="text-xs text-emerald-500 block mt-1"><i className="las la-arrow-up"></i> Excellent</span>
                </div>
                <div className="p-4 bg-surface border border-subtle rounded-xl text-center">
                  <span className="text-xs text-secondary block mb-1 uppercase font-bold tracking-widest">Sortino Ratio</span>
                  <span className="text-2xl font-black text-primary">2.41</span>
                  <span className="text-xs text-emerald-500 block mt-1"><i className="las la-arrow-up"></i> Superior</span>
                </div>
              </div>

              <div className="h-32 w-full bg-slate-100 dark:bg-slate-900 rounded-lg border border-subtle flex items-end overflow-hidden relative group">
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <span className="text-xs font-bold text-secondary bg-surface px-2 py-1 rounded">Monte Carlo Ruin Curve (Mock)</span>
                </div>
                {/* SVG mock of a downward curve */}
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full stroke-purple-500 fill-purple-500/10 stroke-2">
                  <path d="M0,10 C20,15 40,30 60,70 C80,90 90,95 100,98 L100,100 L0,100 Z"></path>
                </svg>
              </div>
            </CardContent>
          </Card>

          {/* The "Kill-Switch" Component */}
          <Card className="border-default shadow-sm border-purple-500/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-bl-full -z-10"></div>
            <CardHeader className="py-4 border-b border-subtle bg-purple-500/5">
              <CardTitle className="text-sm uppercase tracking-widest flex items-center gap-2 text-purple-500">
                <i className="las la-power-off text-lg"></i> Automated Account Lockout
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-primary">The "Kill-Switch"</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={killSwitchEnabled} 
                        onChange={() => setKillSwitchEnabled(!killSwitchEnabled)} 
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-rose-500"></div>
                    </label>
                  </div>
                  
                  <p className="text-sm text-secondary mb-4">
                    When enabled, if the connected API stream reports an equity drop that breaches your defined daily max loss, the backend automatically fires a <code className="bg-elevated px-1 py-0.5 rounded text-rose-500">DELETE /positions</code> request directly to the broker's API endpoints, instantly liquidating positions and safeguarding your capital.
                  </p>

                  <div className={`p-4 rounded-xl border transition-colors ${killSwitchEnabled ? 'bg-rose-500/10 border-rose-500/30' : 'bg-surface border-subtle'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${killSwitchEnabled ? 'bg-rose-500 text-white animate-pulse' : 'bg-elevated text-secondary'}`}>
                        <i className="las la-shield-alt text-xl"></i>
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${killSwitchEnabled ? 'text-rose-500' : 'text-primary'}`}>
                          {killSwitchEnabled ? 'Kill-Switch Armed' : 'Kill-Switch Disabled'}
                        </h4>
                        <p className="text-xs text-secondary">Awaiting API trigger conditions.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </LockedOverlay>
    </div>
  );
}
