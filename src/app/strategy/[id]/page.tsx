"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { StrategyDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function PublicStrategyPage() {
  const params = useParams();
  const id = params.id as string;

  const [strategy, setStrategy] = useState<StrategyDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchStrategy();
    }
  }, [id]);

  const fetchStrategy = async () => {
    try {
      const docRef = doc(db, "strategies", id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError("Strategy not found.");
        setLoading(false);
        return;
      }

      const data = docSnap.data() as StrategyDoc;

      if (!data.is_public) {
        setError("This strategy is private and cannot be viewed.");
        setLoading(false);
        return;
      }

      setStrategy(data);
    } catch (err: any) {
      console.error("Error fetching strategy:", err);
      if (err.code === "permission-denied") {
        setError("This strategy is private or you do not have permission to view it.");
      } else {
        setError("An error occurred while loading this strategy.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0f1c] flex flex-col items-center justify-center transition-colors duration-500 relative">
        <LoadingSpinner className="w-16 h-16 border-[4px] border-yellow-500 border-t-transparent" />
        <p className="mt-8 text-gray-500 dark:text-slate-400 font-black uppercase tracking-[0.3em] text-xs animate-pulse">Decrypting Playbook...</p>
      </div>
    );
  }

  if (error || !strategy) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0f1c] flex flex-col items-center justify-center p-6 text-center transition-colors duration-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="relative z-10 bg-white dark:bg-[#111318] border border-gray-200 dark:border-white/5 p-12 rounded-[2rem] shadow-2xl max-w-lg w-full">
          <div className="w-24 h-24 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
            <i className="las la-lock text-5xl text-rose-500"></i>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter">Access Restricted</h1>
          <p className="text-gray-500 dark:text-slate-400 mb-10 font-medium">
            {error || "This strategy doesn't exist or has been hidden by the author."}
          </p>
          <Link href="/" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl shadow-lg transition-all hover:scale-105">
            Return to ProfitPulse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#050810] transition-colors duration-500 font-sans relative">
      
      {/* Background Overlays & Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Animated Orbs */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-yellow-400/10 dark:bg-yellow-500/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3 animate-[pulse_8s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-600/5 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2 animate-[pulse_10s_ease-in-out_infinite]"></div>
        
        {/* Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" 
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: `40px 40px`
          }}
        ></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-[#0a0f1c]/70 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.5)] group-hover:scale-110 transition-transform duration-300">
              <i className="las la-shield-alt text-2xl text-black"></i>
            </div>
            <span className="text-xl font-black tracking-tighter text-gray-900 dark:text-white">
              ProfitPulse
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link 
              href="/register" 
              className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black text-sm font-black rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Start Journaling
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-20">
        
        {strategy.image_url && (
          <div className="w-full h-[300px] md:h-[450px] rounded-[3rem] overflow-hidden mb-12 md:mb-16 relative shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <img src={strategy.image_url} alt={strategy.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10"></div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Left Column: Strategy Details (Sticky on Desktop) */}
          <div className="lg:col-span-5">
            <div className="sticky top-32 animate-in fade-in slide-in-from-left-8 duration-700">
              
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-[0.2em] mb-6 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Verified Playbook
              </div>

              <div className="mb-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 mb-2">Strategy Name</h3>
                <h1 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight">
                  {strategy.name}
                </h1>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-4 mt-6">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-white/5 border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                  {strategy.owner_photo_url ? (
                    <img src={strategy.owner_photo_url} alt="Author" className="w-full h-full object-cover" />
                  ) : (
                    <i className="las la-user text-xl text-gray-400"></i>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 mb-0.5">Author</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    @{strategy.owner_email ? strategy.owner_email.split('@')[0] : "Trader"}
                  </p>
                </div>
              </div>

              <div className="h-px w-24 bg-yellow-400 my-8"></div>

              <div className="mb-8">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 mb-3">Core Philosophy & Description</h3>
                <div className="bg-white/50 dark:bg-[#111318]/50 backdrop-blur-md rounded-2xl p-6 border border-gray-100 dark:border-white/5 shadow-sm relative overflow-hidden">
                  <i className="las la-quote-left absolute top-4 right-4 text-6xl text-gray-100 dark:text-white/5 rotate-12"></i>
                  <p className="text-lg text-gray-700 dark:text-slate-300 font-medium leading-relaxed relative z-10">
                    {strategy.description || "The author did not provide a detailed description for this strategy. It relies entirely on the strict execution rules."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/50 dark:bg-[#111318]/50 backdrop-blur-md rounded-2xl p-5 border border-gray-100 dark:border-white/5 shadow-sm flex flex-col">
                  <i className="las la-list-ol text-2xl text-yellow-500 mb-2"></i>
                  <span className="text-2xl font-black text-gray-900 dark:text-white">{strategy.rules.length}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Strict Rules</span>
                </div>
                <div className="bg-white/50 dark:bg-[#111318]/50 backdrop-blur-md rounded-2xl p-5 border border-gray-100 dark:border-white/5 shadow-sm flex flex-col">
                  <i className="las la-calendar-check text-2xl text-blue-500 mb-2"></i>
                  <span className="text-xl font-black text-gray-900 dark:text-white mt-1">
                    {new Date(strategy.updated_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-1">Last Updated</span>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Execution Rules */}
          <div className="lg:col-span-7">
            <div className="animate-in fade-in slide-in-from-right-8 duration-700 delay-150 fill-mode-both">
              
              <div className="mb-8 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-400 flex items-center justify-center shadow-lg rotate-3">
                  <i className="las la-gavel text-2xl text-black"></i>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Execution Rules</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">All rules must be met to take a valid trade.</p>
                </div>
              </div>

              {strategy.rules.length > 0 ? (
                <div className="space-y-6">
                  {strategy.rules.map((rule, idx) => (
                    <div 
                      key={idx} 
                      className="group relative bg-white dark:bg-[#111318] rounded-[2rem] p-8 shadow-sm hover:shadow-2xl border border-gray-100 dark:border-white/5 hover:border-yellow-400/50 transition-all duration-500 overflow-hidden"
                    >
                      {/* Hover Overlay Animation */}
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/5 to-yellow-400/0 opacity-0 group-hover:opacity-100 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000 ease-in-out pointer-events-none"></div>

                      <div className="flex gap-6 items-start relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0 group-hover:bg-yellow-400 group-hover:border-yellow-400 transition-colors duration-300 shadow-inner">
                          <span className="text-gray-900 dark:text-white group-hover:text-black font-black text-2xl">{idx + 1}</span>
                        </div>
                        <div className="pt-1">
                          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 mb-2">Rule Parameter {idx + 1}</h4>
                          <p className="text-xl text-gray-800 dark:text-slate-200 font-bold leading-relaxed">
                            {rule}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 rounded-[3rem] bg-white/50 dark:bg-[#111318]/50 border border-dashed border-gray-200 dark:border-white/10 text-center shadow-inner">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="las la-folder-open text-4xl text-gray-400"></i>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">No Rules Found</h3>
                  <p className="text-gray-500 dark:text-slate-400 font-medium">This playbook has no execution parameters.</p>
                </div>
              )}

            </div>
          </div>
          
        </div>

        {/* Call to Action Banner (Full Width) */}
        <div className="mt-24 relative rounded-[3rem] overflow-hidden shadow-[0_20px_50px_-12px_rgba(250,204,21,0.3)] group animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-400 transition-transform duration-1000 group-hover:scale-105"></div>
          
          {/* Animated Tech Overlay */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] mix-blend-overlay"></div>
          
          <div className="relative z-10 px-8 py-16 md:py-20 text-center text-black flex flex-col items-center">
            <div className="w-16 h-16 bg-black/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
              <i className="las la-chart-bar text-4xl text-black"></i>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 max-w-2xl">
              Professional Traders Have Rules. Gamblers Don't.
            </h2>
            <p className="text-xl font-bold opacity-90 max-w-xl mx-auto mb-10">
              Build your own mechanical trading edge. Document your strategies and log every trade seamlessly with ProfitPulse.
            </p>
            
            <Link 
              href="/register" 
              className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-black text-white text-lg font-black rounded-2xl transition-all shadow-2xl hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
            >
              Start Your Free Journal <i className="las la-arrow-right text-xl"></i>
            </Link>
          </div>
        </div>

      </main>
      
      <footer className="py-8 text-center relative z-10 border-t border-gray-200 dark:border-white/5">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-600">
          &copy; {new Date().getFullYear()} ProfitPulse. Discipline over conviction.
        </p>
      </footer>
    </div>
  );
}
