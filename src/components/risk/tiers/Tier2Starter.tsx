"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LockedOverlay } from "./LockedOverlay";

interface Props {
  currencySymbol: string;
  hasAccess: boolean;
}

export function Tier2Starter({ currencySymbol, hasAccess }: Props) {
  const [ticker, setTicker] = useState("");
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState("");
  const [maxTrades, setMaxTrades] = useState("");

  const handleFetchPrice = () => {
    // Mock API fetch
    if (ticker.length > 0) {
      setLivePrice(Math.floor(Math.random() * 500) + 100);
    }
  };

  return (
    <div className="mt-12 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <i className="las la-bolt text-amber-500"></i> Smart Rules & Live Data
        </h2>
        <p className="text-sm text-secondary">Advanced configurations for disciplined risk management.</p>
      </div>

      <LockedOverlay isLocked={!hasAccess} requiredTier="Starter" checkoutPath="/checkout/starter">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Live Ticker Price Hook */}
          <Card className="border-default shadow-sm">
            <CardHeader className="py-4 border-b border-subtle bg-elevated/30">
              <CardTitle className="text-sm uppercase tracking-widest flex items-center gap-2">
                <i className="las la-chart-line text-lg"></i> Live Ticker Hook
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <label className="text-sm font-bold text-primary mb-1 block">Ticker Symbol</label>
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  placeholder="e.g. AAPL, BTCUSD"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  className="w-full bg-surface border border-subtle rounded-lg py-2 px-3 text-primary focus:outline-none focus:border-amber-500"
                />
                <Button variant="outline" onClick={handleFetchPrice}>Fetch</Button>
              </div>
              {livePrice && (
                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 text-center">
                  <span className="text-xs text-secondary block mb-1">Live Market Price</span>
                  <span className="text-xl font-black text-amber-500">{currencySymbol}{livePrice.toFixed(2)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Settings Rule Builder */}
          <Card className="border-default shadow-sm">
            <CardHeader className="py-4 border-b border-subtle bg-elevated/30">
              <CardTitle className="text-sm uppercase tracking-widest flex items-center gap-2">
                <i className="las la-gavel text-lg"></i> Rule Builder
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="text-sm font-bold text-primary mb-1 block">Daily Loss Limit ({currencySymbol})</label>
                <input 
                  type="number" 
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full bg-surface border border-subtle rounded-lg py-2 px-3 text-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-primary mb-1 block">Max Trades Open</label>
                <input 
                  type="number" 
                  value={maxTrades}
                  onChange={(e) => setMaxTrades(e.target.value)}
                  placeholder="e.g. 3"
                  className="w-full bg-surface border border-subtle rounded-lg py-2 px-3 text-primary focus:outline-none"
                />
              </div>
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white">Save Rules</Button>
            </CardContent>
          </Card>

          {/* The Notification System */}
          <Card className="border-default shadow-sm">
            <CardHeader className="py-4 border-b border-subtle bg-elevated/30">
              <CardTitle className="text-sm uppercase tracking-widest flex items-center gap-2">
                <i className="las la-bell text-lg"></i> Notification System
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-4">
                Receive instant email alerts via SendGrid when your trading rules are breached.
              </p>
              <div className="space-y-3 mb-6">
                <label className="flex items-center gap-3 text-sm text-primary">
                  <input type="checkbox" className="w-4 h-4 rounded border-subtle accent-amber-500" defaultChecked />
                  Email on Daily Limit Breach
                </label>
                <label className="flex items-center gap-3 text-sm text-primary">
                  <input type="checkbox" className="w-4 h-4 rounded border-subtle accent-amber-500" defaultChecked />
                  Email on Max Trades Exceeded
                </label>
              </div>
              <Button variant="outline" className="w-full">Configure Email Integration</Button>
            </CardContent>
          </Card>

        </div>
      </LockedOverlay>
    </div>
  );
}
