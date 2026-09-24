"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LockedOverlay } from "./LockedOverlay";
import { useState } from "react";

interface Props {
  hasAccess: boolean;
}

export function Tier3Pro({ hasAccess }: Props) {
  const [webhookUrl, setWebhookUrl] = useState("");

  return (
    <div className="mt-12 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <i className="las la-satellite-dish text-blue-500"></i> Advanced Automation Layer
        </h2>
        <p className="text-sm text-secondary">Real-time webhook routing and matrix calculations.</p>
      </div>

      <LockedOverlay isLocked={!hasAccess} requiredTier="Pro" checkoutPath="/checkout/pro">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          
          {/* Broker API Integration Layer */}
          <Card className="border-default shadow-sm border-blue-500/20">
            <CardHeader className="py-4 border-b border-subtle bg-blue-500/5">
              <CardTitle className="text-sm uppercase tracking-widest flex items-center gap-2 text-blue-500">
                <i className="las la-plug text-lg"></i> Broker API Connect
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-6">
                Connect your broker directly via OAuth or secure API keys to fetch active trades and equity curves automatically.
              </p>
              <div className="space-y-3">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2">
                  <i className="lab la-windows"></i> Connect Webull / TradeStation
                </Button>
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                  <i className="las la-key"></i> Add Custom API Key
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Correlation Heatmap Component */}
          <Card className="border-default shadow-sm border-blue-500/20">
            <CardHeader className="py-4 border-b border-subtle bg-blue-500/5">
              <CardTitle className="text-sm uppercase tracking-widest flex items-center gap-2 text-blue-500">
                <i className="las la-th text-lg"></i> Correlation Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-xs text-secondary mb-4">
                Checks open positions against a daily correlation data matrix.
              </p>
              <div className="grid grid-cols-3 gap-1 mb-4 rounded-lg overflow-hidden">
                <div className="aspect-square bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-500">AAPL</div>
                <div className="aspect-square bg-rose-500/40 flex items-center justify-center text-xs font-bold text-white shadow-inner">0.82</div>
                <div className="aspect-square bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-white">-0.1</div>
                
                <div className="aspect-square bg-rose-500/40 flex items-center justify-center text-xs font-bold text-white">0.82</div>
                <div className="aspect-square bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-500">MSFT</div>
                <div className="aspect-square bg-emerald-500/40 flex items-center justify-center text-xs font-bold text-white">-0.4</div>
                
                <div className="aspect-square bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-white">-0.1</div>
                <div className="aspect-square bg-emerald-500/40 flex items-center justify-center text-xs font-bold text-white">-0.4</div>
                <div className="aspect-square bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-500">GLD</div>
              </div>
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-500 flex items-start gap-2">
                <i className="las la-exclamation-circle text-base mt-0.5"></i>
                <span>Warning: AAPL and MSFT are highly correlated (&gt;0.75). You are essentially doubling your risk exposure.</span>
              </div>
            </CardContent>
          </Card>

          {/* Webhook Push Alerts */}
          <Card className="border-default shadow-sm border-blue-500/20">
            <CardHeader className="py-4 border-b border-subtle bg-blue-500/5">
              <CardTitle className="text-sm uppercase tracking-widest flex items-center gap-2 text-blue-500">
                <i className="lab la-discord text-lg"></i> Webhook Push Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-secondary mb-4">
                Paste a Discord Webhook URL or Telegram Bot Token. If a live position is detected without a stop loss, we fire a payload instantly.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-primary mb-1 block">Discord Webhook URL</label>
                  <input 
                    type="url" 
                    placeholder="https://discord.com/api/webhooks/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full bg-surface border border-subtle rounded-lg py-2 px-3 text-primary text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <Button className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900">
                  Save Webhook
                </Button>
                <div className="text-center">
                  <Button variant="ghost" size="sm" className="text-blue-500 text-xs">
                    <i className="las la-paper-plane mr-1"></i> Send Test Payload
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </LockedOverlay>
    </div>
  );
}
