"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function IpoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = params.symbol as string;

  const [loading, setLoading] = useState(true);
  const [ipoData, setIpoData] = useState<any>(null);
  const [deepData, setDeepData] = useState<any>(null);

  useEffect(() => {
    fetchIpoDetails();
  }, [symbol]);

  const fetchIpoDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ipos");
      if (!res.ok) throw new Error("Failed to fetch IPO data");
      
      const allIpos = await res.json();
      const decodedSymbol = decodeURIComponent(symbol);
      const specificIpo = allIpos.find((i: any) => i.symbol === decodedSymbol);
      
      if (!specificIpo) {
        toast.error("IPO details not found");
        router.push("/dashboard/ipos");
        return;
      }
      
      setIpoData(specificIpo);

      if (specificIpo.detailUrl) {
        try {
          const detailRes = await fetch(`/api/ipos/details?url=${encodeURIComponent(specificIpo.detailUrl)}`);
          if (detailRes.ok) {
            const dData = await detailRes.json();
            setDeepData(dData);
          }
        } catch (e) {
          console.error("Failed to load deep data", e);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading IPO details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!ipoData) return null;

  const lotSizeData = [
    { cat: "Retail (Min)", lots: 1, shares: ipoData.minLot, amount: ipoData.minAmount },
    { cat: "sHNI (Min)", lots: Math.ceil(200000 / ipoData.minAmount), shares: ipoData.minLot * Math.ceil(200000 / ipoData.minAmount), amount: ipoData.minAmount * Math.ceil(200000 / ipoData.minAmount) },
    { cat: "bHNI (Min)", lots: Math.ceil(1000000 / ipoData.minAmount), shares: ipoData.minLot * Math.ceil(1000000 / ipoData.minAmount), amount: ipoData.minAmount * Math.ceil(1000000 / ipoData.minAmount) },
  ];



  // Dynamic Timeline Logic
  const parseDate = (dStr: string) => {
    if (dStr === "TBA" || !dStr) return Infinity;
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? Infinity : d.getTime();
  };
  
  const today = new Date().getTime();
  const timelineSteps = [
    { label: "Open", date: ipoData.date, time: parseDate(ipoData.date), icon: "la-door-open" },
    { label: "Close", date: ipoData.closeDate, time: parseDate(ipoData.closeDate), icon: "la-door-closed" },
    { label: "Allotment", date: ipoData.allotmentDate || deepData?.allotmentDate || "TBA", time: parseDate(ipoData.allotmentDate || deepData?.allotmentDate), icon: "la-award" },
    { label: "Listing", date: ipoData.listingDate || deepData?.listingDate || "TBA", time: parseDate(ipoData.listingDate || deepData?.listingDate), icon: "la-flag-checkered" }
  ];
  
  let currentStepIndex = -1;
  timelineSteps.forEach((s, i) => {
    if (today >= s.time && s.date !== "TBA") {
      currentStepIndex = i;
    }
  });

  // Hard override based on status to ensure accuracy even if dates are missing or slightly off
  if (ipoData.status === 'Closed' && currentStepIndex < 1) currentStepIndex = 1;
  if (ipoData.status === 'Allotment Awaited' && currentStepIndex < 1) currentStepIndex = 1;
  if (ipoData.status === 'Allotment Out' && currentStepIndex < 2) currentStepIndex = 2;
  if (ipoData.status === 'Listed' && currentStepIndex < 3) currentStepIndex = 3;

  const getProgressWidth = (idx: number) => {
    if (idx === -1) return 0;
    if (idx >= timelineSteps.length - 1) return 100;
    return (idx * (100 / (timelineSteps.length - 1)));
  };
  const timelineWidth = getProgressWidth(currentStepIndex);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 animate-in fade-in zoom-in duration-500">
      
      {/* Premium Navigation & Header */}
      <div className="flex items-center justify-between mb-2 sticky top-0 bg-background/80 backdrop-blur-xl z-40 py-4 border-b border-default/50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface hover:bg-elevated text-secondary hover:text-primary transition-all border border-default shadow-sm hover:shadow-md">
            <i className="las la-arrow-left text-xl"></i>
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-extrabold text-primary tracking-tight leading-none truncate max-w-[200px] sm:max-w-md">{ipoData.name}</h1>
            <span className="text-[10px] text-muted font-mono tracking-wider uppercase mt-1">{ipoData.symbol}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs hidden sm:inline-flex">
            <i className="las la-building mr-1"></i> {ipoData.exchange.includes('NSE') && !ipoData.exchange.includes('SME') ? 'MAINBOARD' : 'SME'}
          </Badge>
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wider whitespace-nowrap border ${
            ipoData.status === 'Live' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
            ipoData.status === 'Upcoming' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
            ipoData.status === 'Allotment Awaited' || ipoData.status === 'Closed' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
            ipoData.status === 'Allotment Out' ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' :
            ipoData.status === 'Listed' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
            'bg-surface border-default/50 text-muted'
          }`}>
            {ipoData.status === 'Live' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>}
            {ipoData.status}
          </span>

          {/* Glowing Check Allotment Button */}
          {ipoData.status === 'Allotment Out' && deepData?.allotmentUrl ? (
            <a 
              href={deepData.allotmentUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-2 group relative inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-500 hover:to-indigo-500 border border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.8)]"
            >
              <i className="las la-external-link-alt text-sm"></i>
              Check Allotment
              <span className="absolute inset-0 rounded-lg ring-2 ring-white/20 group-hover:ring-white/50 transition-all duration-300"></span>
            </a>
          ) : (
            <button 
              disabled
              className="ml-2 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-muted transition-all duration-300 bg-surface rounded-lg border border-default/50 opacity-50 cursor-not-allowed"
            >
              <i className="las la-lock text-sm"></i>
              Allotment Locked
            </button>
          )}
        </div>
      </div>

      {/* Spectacular Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-default/30 shadow-2xl group">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-background to-blue-900/40"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] group-hover:bg-purple-500/30 transition-colors duration-700"></div>
        
        <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row items-center gap-8 backdrop-blur-sm">
          {/* Logo Entity */}
          <div className="w-32 h-32 rounded-2xl bg-white p-3 shadow-xl ring-4 ring-white/10 shrink-0 transform group-hover:scale-105 transition-transform duration-500">
            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${ipoData.name}&backgroundColor=000000&textColor=ffffff`} alt={ipoData.name} className="w-full h-full object-contain rounded-xl" />
          </div>
          
          {/* Core Metrics */}
          <div className="flex-1 w-full flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted uppercase tracking-widest font-bold mb-1">Offer Period</p>
                <p className="text-lg font-medium text-primary bg-surface/50 px-3 py-1.5 rounded-lg inline-block border border-default/50 backdrop-blur-md">
                  <i className="las la-calendar-day text-purple-400 mr-2"></i>
                  {ipoData.date} <span className="text-muted mx-2">→</span> {ipoData.closeDate}
                </p>
              </div>
              <div className="flex gap-4">
                <div className="bg-surface/50 px-4 py-2 rounded-xl border border-default/50 backdrop-blur-md">
                  <p className="text-[10px] text-muted uppercase tracking-widest mb-0.5">Issue Price</p>
                  <p className="text-xl font-bold">{ipoData.priceRange}</p>
                </div>
                <div className="bg-surface/50 px-4 py-2 rounded-xl border border-default/50 backdrop-blur-md">
                  <p className="text-[10px] text-muted uppercase tracking-widest mb-0.5">Lot Size</p>
                  <p className="text-xl font-bold">{ipoData.minLot}</p>
                </div>
              </div>
            </div>

            {/* GMP Highlight or Listed Performance */}
            {ipoData.status === 'Listed' ? (
              <div className="bg-surface/80 p-5 rounded-2xl border border-default shadow-lg flex flex-col justify-center items-center min-w-[200px] backdrop-blur-md transform group-hover:-translate-y-1 transition-transform duration-300">
                <p className="text-xs text-muted uppercase tracking-widest font-bold mb-2">Current LTP</p>
                <div className="text-3xl font-extrabold tracking-tight text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  {ipoData.currentLtp?.split(' ')[0] || '--'}
                </div>
                <p className="text-[10px] text-emerald-500 font-bold mt-1">{ipoData.currentLtp?.split(' ')[1] || ''}</p>
              </div>
            ) : (
              <div className="bg-surface/80 p-5 rounded-2xl border border-default shadow-lg flex flex-col justify-center items-center min-w-[200px] backdrop-blur-md transform group-hover:-translate-y-1 transition-transform duration-300">
                <p className="text-xs text-muted uppercase tracking-widest font-bold mb-2">Expected Premium</p>
                <div className={`text-4xl font-extrabold tracking-tight ${ipoData.gmp && !ipoData.gmp.startsWith('₹0') ? 'text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]'}`}>
                  {ipoData.gmp}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Subs & Timeline */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Subscription Dashboard */}
          {/* Subscription Dashboard */}
          <div className="rounded-xl border border-white/10 bg-[#0f0f0f] overflow-hidden">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                <i className="las la-fire text-orange-500 text-lg"></i> Live Subscription
              </h3>
            </div>
            <div className="grid grid-cols-4 divide-x divide-white/5">
              <div className="p-5 flex flex-col justify-center items-center text-center">
                <p className="text-[11px] text-slate-500 mb-1 font-bold">QIB</p>
                <p className="text-xl font-bold text-white">{ipoData.subsQib !== '--' ? ipoData.subsQib : (deepData?.subsQib || "--")}</p>
              </div>
              <div className="p-5 flex flex-col justify-center items-center text-center">
                <p className="text-[11px] text-slate-500 mb-1 font-bold">NII</p>
                <p className="text-xl font-bold text-white">{ipoData.subsNii !== '--' ? ipoData.subsNii : (deepData?.subsNii || "--")}</p>
              </div>
              <div className="p-5 flex flex-col justify-center items-center text-center">
                <p className="text-[11px] text-blue-500 mb-1 font-bold">Retail</p>
                <p className="text-xl font-bold text-white">{ipoData.subsRetail !== '--' ? ipoData.subsRetail : (deepData?.subsRetail || "--")}</p>
              </div>
              <div className="p-5 flex flex-col justify-center items-center text-center">
                <p className="text-[11px] text-emerald-500 mb-1 font-bold">Total</p>
                <p className="text-xl font-bold text-white">{ipoData.subs || "--"}</p>
              </div>
            </div>
          </div>

          {/* Timeline & Details */}
          <Card className="p-6 bg-elevated border-default shadow-sm">
            <h3 className="font-bold text-primary flex items-center gap-2 mb-8">
              <i className="las la-project-diagram text-purple-500 text-xl"></i> IPO Timeline
            </h3>
            
            <div className="relative px-4">
              <div className="absolute top-3 left-6 w-[calc(100%-3rem)] h-1 bg-surface rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all duration-1000 ease-in-out" style={{ width: `${timelineWidth}%` }}></div>
              </div>
              
              <div className="flex justify-between relative z-10">
                {timelineSteps.map((step, idx) => {
                  const isCompleted = currentStepIndex >= idx;
                  
                  return (
                    <div key={idx} className="flex flex-col items-center w-24">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 mb-3 shadow-lg transition-colors duration-500 ${
                        isCompleted 
                          ? "bg-purple-500 text-white border-elevated ring-2 ring-purple-500/30"
                          : "bg-surface text-muted border-elevated ring-2 ring-default"
                      }`}>
                        <i className={`las ${isCompleted ? "la-check" : step.icon}`}></i>
                      </div>
                      <p className={`text-xs font-bold transition-colors ${isCompleted ? "text-primary" : "text-muted"}`}>{step.label}</p>
                      <p className="text-[10px] text-muted">{step.date}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-surface/50 rounded-2xl border border-default/50">
              <div>
                <p className="text-[10px] text-muted uppercase">Issue Size</p>
                <p className="text-sm font-bold mt-1">{ipoData.issueSize}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase">Face Value</p>
                <p className="text-sm font-bold mt-1">{deepData?.faceValue || "--"}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase">Listed On</p>
                <p className="text-sm font-bold mt-1">{ipoData.exchange}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase">Registrar</p>
                <p className="text-sm font-bold mt-1 truncate">{deepData?.registrar || "--"}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Lots & Valuation */}
        <div className="space-y-6">
          <Card className="p-0 bg-elevated border-default overflow-hidden shadow-sm">
            <div className="p-4 border-b border-default bg-surface/30"><h3 className="font-bold text-primary">Investment Tiers</h3></div>
            <div className="divide-y divide-default/50">
              {lotSizeData.map((l, i) => (
                <div key={i} className="p-4 hover:bg-surface/30 transition-colors flex justify-between items-center group">
                  <div>
                    <p className="text-sm font-bold text-primary">{l.cat}</p>
                    <p className="text-xs text-muted mt-0.5">{l.lots} Lot(s) &bull; {l.shares} Shares</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold font-mono group-hover:text-purple-500 transition-colors">₹{l.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {ipoData.status === 'Listed' && (
            <Card className="p-0 bg-elevated border-default overflow-hidden shadow-sm mt-6">
              <div className="p-4 border-b border-default bg-surface/30"><h3 className="font-bold text-primary">Listing Performance</h3></div>
              <div className="divide-y divide-default/50">
                <div className="p-4 flex justify-between items-center group">
                  <span className="text-xs text-muted">Final Subscription</span>
                  <span className="font-bold font-mono">{ipoData.subscription || ipoData.subs}</span>
                </div>
                <div className="p-4 flex justify-between items-center group">
                  <span className="text-xs text-muted">Listing Price</span>
                  <span className="font-bold font-mono">{ipoData.actualListingPrice}</span>
                </div>
                <div className="p-4 flex justify-between items-center group">
                  <span className="text-xs text-muted">Day 1 Close</span>
                  <span className="font-bold font-mono">{ipoData.listingDayClose}</span>
                </div>
                <div className="p-4 flex justify-between items-center group">
                  <span className="text-xs text-muted">Current LTP</span>
                  <span className="font-bold font-mono text-emerald-500">{ipoData.currentLtp}</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Floating Action Button for Application */}
      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 animate-bounce">
        <Button 
          size="lg" 
          className="rounded-full shadow-2xl shadow-purple-500/30 px-8 h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-lg border-0"
          onClick={() => router.push('/dashboard/ipos?log=true&symbol=' + ipoData.symbol)}
        >
          <i className="las la-bolt text-2xl mr-2"></i> Log Application
        </Button>
      </div>
    </div>
  );
}
