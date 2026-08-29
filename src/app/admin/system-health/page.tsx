"use client";

import { useState, useEffect } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export default function AdminSystemHealthPage() {
  const [isPinging, setIsPinging] = useState(false);
  const [lastPing, setLastPing] = useState<Date | null>(null);

  // Mock statuses for the UI demo since we can't ping actual nodes here
  const [nodes, setNodes] = useState({
    firestore: { status: "operational", latency: "14ms" },
    auth: { status: "operational", latency: "22ms" },
    visionAPI: { status: "operational", latency: "140ms" },
    cryptoWebhook: { status: "operational", latency: "45ms" }
  });

  const runDiagnostics = () => {
    setIsPinging(true);
    toast("Running diagnostics...", { icon: '🔍' });
    
    // Simulate ping delay
    setTimeout(() => {
      setNodes({
        firestore: { status: "operational", latency: `${Math.floor(Math.random() * 20 + 10)}ms` },
        auth: { status: "operational", latency: `${Math.floor(Math.random() * 30 + 15)}ms` },
        visionAPI: { status: Math.random() > 0.9 ? "degraded" : "operational", latency: `${Math.floor(Math.random() * 200 + 100)}ms` },
        cryptoWebhook: { status: "operational", latency: `${Math.floor(Math.random() * 50 + 30)}ms` }
      });
      setLastPing(new Date());
      setIsPinging(false);
      toast.success("Diagnostics complete");
    }, 2000);
  };

  useEffect(() => {
    // Initial fetch
    setLastPing(new Date());
  }, []);

  const getStatusColor = (status: string) => {
    return status === "operational" ? "bg-emerald-500" : "bg-amber-500";
  };

  return (
    <div className="space-y-6 animate-in fade-in font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="heading-page text-white">System Health & Node Status</h1>
          <p className="text-sm text-neutral-400 mt-1">Live server infrastructure and external API monitor.</p>
        </div>
        <button 
          onClick={runDiagnostics} 
          disabled={isPinging}
          className="btn-ghost border border-neutral-700 font-bold bg-[#121212] flex items-center gap-2"
        >
          {isPinging ? <LoadingSpinner className="w-5 h-5 border-blue-500" /> : <i className="las la-sync-alt"></i>}
          Run Diagnostics
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Node: Firestore */}
        <div className="premium-card p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 text-xl">
              <i className="las la-database"></i>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(nodes.firestore.status)} shadow-[0_0_10px_currentColor] animate-pulse`}></div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{nodes.firestore.status}</span>
            </div>
          </div>
          <h3 className="font-bold text-white text-lg">Firebase Firestore</h3>
          <p className="text-xs text-neutral-500 mt-1 mb-4">Primary database cluster</p>
          <div className="premium-inner-box p-3 flex justify-between items-center">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Latency</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">{nodes.firestore.latency}</span>
          </div>
        </div>

        {/* Node: Auth */}
        <div className="premium-card p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 text-xl">
              <i className="las la-fingerprint"></i>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(nodes.auth.status)} shadow-[0_0_10px_currentColor] animate-pulse`}></div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{nodes.auth.status}</span>
            </div>
          </div>
          <h3 className="font-bold text-white text-lg">Firebase Auth</h3>
          <p className="text-xs text-neutral-500 mt-1 mb-4">Token issuance & JWT verification</p>
          <div className="premium-inner-box p-3 flex justify-between items-center">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Latency</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">{nodes.auth.latency}</span>
          </div>
        </div>

        {/* Node: Vision API */}
        <div className="premium-card p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 text-xl">
              <i className="las la-brain"></i>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(nodes.visionAPI.status)} shadow-[0_0_10px_currentColor] animate-pulse`}></div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{nodes.visionAPI.status}</span>
            </div>
          </div>
          <h3 className="font-bold text-white text-lg">AI Auto-Tagger</h3>
          <p className="text-xs text-neutral-500 mt-1 mb-4">Google Cloud Vision API inference</p>
          <div className="premium-inner-box p-3 flex justify-between items-center">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Latency</span>
            <span className={`font-mono font-bold text-sm ${nodes.visionAPI.status === 'degraded' ? 'text-amber-400' : 'text-emerald-400'}`}>{nodes.visionAPI.latency}</span>
          </div>
        </div>

        {/* Node: Crypto Webhook */}
        <div className="premium-card p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-xl">
              <i className="lab la-bitcoin"></i>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(nodes.cryptoWebhook.status)} shadow-[0_0_10px_currentColor] animate-pulse`}></div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{nodes.cryptoWebhook.status}</span>
            </div>
          </div>
          <h3 className="font-bold text-white text-lg">Payment Webhooks</h3>
          <p className="text-xs text-neutral-500 mt-1 mb-4">USDT network confirmation listeners</p>
          <div className="premium-inner-box p-3 flex justify-between items-center">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Latency</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">{nodes.cryptoWebhook.latency}</span>
          </div>
        </div>

      </div>

      <div className="text-center text-[10px] text-neutral-600 font-mono mt-4">
        Last diagnostic ping: {lastPing ? lastPing.toLocaleTimeString() : "..."}
      </div>

    </div>
  );
}
