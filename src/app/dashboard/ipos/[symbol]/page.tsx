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
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    fetchIpoDetails();
  }, [symbol]);

  const fetchIpoDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ipos");
      if (!res.ok) throw new Error("Failed to fetch IPO data");
      
      const allIpos = await res.json();
      const specificIpo = allIpos.find((i: any) => i.symbol === symbol);
      
      if (!specificIpo) {
        toast.error("IPO details not found");
        router.push("/dashboard/ipos");
        return;
      }
      
      setIpoData(specificIpo);
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

  // Mock extended data based on the real basic data to match the screenshots perfectly
  const mockDeepData = {
    timeline: { open: ipoData.date, close: ipoData.closeDate, allotment: "TBA", listing: "TBA" },
    subs: {
      date: new Date().toLocaleString(),
      qib: "0.26x",
      niiAbove: "14.95x",
      niiBelow: "18.34x",
      niiTotal: "16.08x",
      retail: ipoData.subs || "5.41x",
      total: "6.22x"
    },
    lotSize: [
      { cat: "Retail (Min)", lots: 1, shares: ipoData.minLot, amount: ipoData.minAmount },
      { cat: "sHNI (Min)", lots: 14, shares: ipoData.minLot * 14, amount: ipoData.minAmount * 14 },
      { cat: "bHNI (Min)", lots: 67, shares: ipoData.minLot * 67, amount: ipoData.minAmount * 67 },
    ],
    valuations: [
      { label: "EPS Pre IPO", val: "₹1.58/-" },
      { label: "EPS Post IPO", val: "₹3.95/-" },
      { label: "P/E Pre IPO", val: "21.52" },
      { label: "P/E Post IPO", val: "8.61" },
      { label: "ROE", val: "17.4%" },
      { label: "ROCE", val: "22.1%" },
      { label: "Market Cap", val: "₹5,984.79 Cr." },
    ],
    chartData: [
      { date: "Sep 21, 11:30 PM", premium: 3 },
      { date: "Sep 22, 10:00 AM", premium: 5 },
      { date: "Sep 22, 04:00 PM", premium: 8 },
      { date: "Sep 23, 10:30 AM", premium: 11 },
      { date: "Sep 23, 04:00 PM", premium: 12 },
      { date: "Sep 24, 02:45 PM", premium: 13 },
      { date: "Sep 25, 10:00 AM", premium: 14 },
      { date: "Sep 25, 04:15 PM", premium: 13 },
    ]
  };

  if (showChart) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 pb-24 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-3 mb-4 sticky top-0 bg-background/80 backdrop-blur-md z-40 py-4 border-b border-default">
          <button onClick={() => setShowChart(false)} className="p-2 -ml-2 rounded-full hover:bg-elevated transition-colors">
            <i className="las la-arrow-left text-xl"></i>
          </button>
          <h1 className="text-xl font-bold text-primary truncate">{ipoData.name} IPO</h1>
        </div>

        <div className="flex justify-between items-center bg-elevated px-4 py-3 rounded-xl border border-default text-xs md:text-sm">
          <span className="text-muted">{ipoData.date} - {ipoData.closeDate}</span>
          <span className="text-primary font-bold">{ipoData.priceRange}</span>
          <span className="text-muted">Lot: {ipoData.minLot}</span>
        </div>

        <Card className="p-5 bg-elevated border-default shadow-sm">
          <h3 className="font-bold text-primary mb-6">Premium Chart</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockDeepData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <defs>
                  <linearGradient id="colorPremium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-default/20" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="currentColor" 
                  className="text-muted text-[10px]" 
                  tickMargin={15}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="currentColor" className="text-muted text-xs" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-elevated)', borderColor: 'var(--color-default)', borderRadius: '8px' }}
                  itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="premium" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorPremium)" activeDot={{ r: 6, fill: "#8b5cf6", stroke: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <p className="text-[10px] text-muted text-center max-w-lg mx-auto leading-relaxed mt-6">
          Disclaimer: Exp. Premium/GMP is indicative and from unofficial markets. Not a guarantee of listing price or returns. Invest at your own risk.
        </p>
      </div>
    );
  }

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
          <Badge variant="neutral" className={`text-xs ${ipoData.status === 'Live' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-surface text-muted'}`}>
            {ipoData.status === 'Live' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>}
            {ipoData.status}
          </Badge>
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

            {/* GMP Highlight */}
            <div className="bg-surface/80 p-5 rounded-2xl border border-default shadow-lg flex flex-col justify-center items-center min-w-[200px] backdrop-blur-md transform group-hover:-translate-y-1 transition-transform duration-300">
              <p className="text-xs text-muted uppercase tracking-widest font-bold mb-2">Expected Premium</p>
              <div className={`text-4xl font-extrabold tracking-tight ${ipoData.gmp && !ipoData.gmp.startsWith('₹0') ? 'text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]'}`}>
                {ipoData.gmp}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowChart(true)}
                className="mt-4 w-full bg-background/50 hover:bg-background text-xs border border-default/50"
              >
                <i className="las la-chart-area text-lg mr-1 text-purple-400"></i> Open Chart
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Subs & Timeline */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Subscription Dashboard */}
          <Card className="p-0 bg-elevated border-default overflow-hidden shadow-sm">
            <div className="p-5 border-b border-default bg-surface/30 flex justify-between items-center">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <i className="las la-fire text-orange-500 text-xl"></i> Live Subscription
              </h3>
              <span className="text-xs text-muted font-mono">{mockDeepData.subs.date}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-default/30">
              <div className="bg-elevated p-5 flex flex-col justify-center items-center text-center hover:bg-surface/50 transition-colors">
                <p className="text-xs text-muted mb-1 font-bold">QIB</p>
                <p className="text-xl font-bold text-primary">{mockDeepData.subs.qib}</p>
              </div>
              <div className="bg-elevated p-5 flex flex-col justify-center items-center text-center hover:bg-surface/50 transition-colors">
                <p className="text-xs text-muted mb-1 font-bold">NII</p>
                <p className="text-xl font-bold text-primary">{mockDeepData.subs.niiTotal}</p>
              </div>
              <div className="bg-elevated p-5 flex flex-col justify-center items-center text-center hover:bg-surface/50 transition-colors relative overflow-hidden group">
                <div className="absolute inset-0 bg-blue-500/5 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                <p className="text-xs text-blue-500 mb-1 font-bold">Retail</p>
                <p className="text-xl font-bold text-primary">{mockDeepData.subs.retail}</p>
              </div>
              <div className="bg-elevated p-5 flex flex-col justify-center items-center text-center hover:bg-surface/50 transition-colors relative overflow-hidden group">
                <div className="absolute inset-0 bg-emerald-500/5 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                <p className="text-xs text-emerald-500 mb-1 font-bold">Total</p>
                <p className="text-2xl font-black text-primary">{mockDeepData.subs.total}</p>
              </div>
            </div>
          </Card>

          {/* Timeline & Details */}
          <Card className="p-6 bg-elevated border-default shadow-sm">
            <h3 className="font-bold text-primary flex items-center gap-2 mb-8">
              <i className="las la-project-diagram text-purple-500 text-xl"></i> IPO Timeline
            </h3>
            
            <div className="relative px-4">
              <div className="absolute top-3 left-4 w-[calc(100%-2rem)] h-1 bg-surface rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-[25%] shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
              </div>
              
              <div className="flex justify-between relative z-10">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg border-2 border-elevated ring-2 ring-purple-500/30 mb-3"><i className="las la-check"></i></div>
                  <p className="text-xs font-bold text-primary">Open</p>
                  <p className="text-[10px] text-muted">{mockDeepData.timeline.open}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-surface text-muted flex items-center justify-center border-2 border-elevated ring-2 ring-default mb-3"><i className="las la-dot-circle"></i></div>
                  <p className="text-xs font-bold text-primary">Close</p>
                  <p className="text-[10px] text-muted">{mockDeepData.timeline.close}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-surface text-muted flex items-center justify-center border-2 border-elevated ring-2 ring-default mb-3"><i className="las la-award"></i></div>
                  <p className="text-xs font-bold text-primary">Allotment</p>
                  <p className="text-[10px] text-muted">{mockDeepData.timeline.allotment}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-surface text-muted flex items-center justify-center border-2 border-elevated ring-2 ring-default mb-3"><i className="las la-flag-checkered"></i></div>
                  <p className="text-xs font-bold text-primary">Listing</p>
                  <p className="text-[10px] text-muted">{mockDeepData.timeline.listing}</p>
                </div>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-surface/50 rounded-2xl border border-default/50">
              <div>
                <p className="text-[10px] text-muted uppercase">Issue Size</p>
                <p className="text-sm font-bold mt-1">{ipoData.issueSize}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase">Face Value</p>
                <p className="text-sm font-bold mt-1">₹10</p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase">Listed On</p>
                <p className="text-sm font-bold mt-1">{ipoData.exchange}</p>
              </div>
              <div className="flex items-center gap-2">
                <a href="#" className="w-8 h-8 flex items-center justify-center rounded-lg bg-background border border-default hover:border-purple-500 hover:text-purple-500 transition-colors text-muted text-xs" title="DRHP"><i className="las la-file-pdf text-lg"></i></a>
                <a href="#" className="w-8 h-8 flex items-center justify-center rounded-lg bg-background border border-default hover:border-purple-500 hover:text-purple-500 transition-colors text-muted text-xs" title="RHP"><i className="las la-file-alt text-lg"></i></a>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Lots & Valuation */}
        <div className="space-y-6">
          <Card className="p-0 bg-elevated border-default overflow-hidden shadow-sm">
            <div className="p-4 border-b border-default bg-surface/30"><h3 className="font-bold text-primary">Investment Tiers</h3></div>
            <div className="divide-y divide-default/50">
              {mockDeepData.lotSize.map((l, i) => (
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

          <Card className="p-0 bg-elevated border-default overflow-hidden shadow-sm">
            <div className="p-4 border-b border-default bg-surface/30"><h3 className="font-bold text-primary">Financial Valuations</h3></div>
            <div className="grid grid-cols-2 divide-y divide-x divide-default/50">
              {mockDeepData.valuations.map((v, i) => (
                <div key={i} className="p-4 text-center hover:bg-surface/30 transition-colors group">
                  <p className="text-[10px] text-muted uppercase tracking-wider mb-1">{v.label}</p>
                  <p className="text-sm font-bold text-primary group-hover:text-blue-500 transition-colors">{v.val}</p>
                </div>
              ))}
            </div>
          </Card>
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
