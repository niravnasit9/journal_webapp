import Link from "next/link";
import { Button } from "@/components/ui/Button";
import TickerTape from "./TickerTape";

export default function HeroSection() {
  return (
    <>
    <div className="pt-20">
      <TickerTape />
    </div>
    <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 overflow-hidden min-h-[90vh] flex flex-col items-center">
      {/* Dynamic Animated Background Glows */}
      <div className="absolute top-[10%] left-[20%] w-[40rem] h-[40rem] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-[spin_20s_linear_infinite] pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[35rem] h-[35rem] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-[spin_25s_reverse_linear_infinite] pointer-events-none"></div>
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[50rem] h-[20rem] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full mt-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-bold mb-8 shadow-sm hover:bg-blue-100 transition-colors cursor-default">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
            </span>
            ProfitPulse Enterprise Edition Available
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-slate-800 to-slate-500 dark:from-white dark:via-white dark:to-white/40 drop-shadow-sm dark:drop-shadow-2xl leading-[1.1]">
            Institutional-Grade Analytics. <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-500 drop-shadow-sm dark:drop-shadow-[0_0_30px_rgba(99,102,241,0.3)]">Retail Accessibility.</span>
          </h1>

          <p className="text-lg md:text-2xl text-slate-600 dark:text-white/60 max-w-3xl mx-auto mb-12 leading-relaxed font-medium dark:font-light">
            Elevate your trading performance with automated journal synchronization, robust MFE/MAE diagnostics, and data-driven strategy playbooks.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto rounded-full px-8 py-6 text-base font-bold shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:shadow-[0_0_60px_rgba(59,130,246,0.4)] transition-all">
                Start Journaling Free
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full px-8 py-6 text-base font-bold bg-white/80 dark:bg-surface/50 text-slate-800 dark:text-white backdrop-blur-md border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white transition-all shadow-sm">
                <i className="las la-user mr-2"></i> Login to Account
              </Button>
            </Link>
          </div>
          
          {/* High-Fidelity Dashboard Image Mock */}
          <div className="mt-16 md:mt-24 relative w-full max-w-5xl mx-auto rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-[0_20px_50px_rgba(8,112,184,0.15)] dark:shadow-[0_0_100px_rgba(30,58,138,0.4)] bg-white dark:bg-base group perspective-1000">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/80 dark:to-base z-20 pointer-events-none"></div>
            <img src="/images/hero-dashboard.jpg" alt="Trading Dashboard Interface" className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-[1.02]" />
            
            {/* Floating Glass Statistic Cards */}
            <div className="absolute -left-4 md:-left-8 top-1/4 bg-white/90 dark:bg-surface/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl p-3 md:p-4 shadow-xl dark:shadow-2xl animate-[bounce_4s_infinite] hidden sm:flex flex-col z-30">
              <span className="text-[8px] md:text-[10px] text-slate-500 dark:text-white/50 font-bold uppercase tracking-widest mb-1">Win Rate</span>
              <span className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">72.4%</span>
            </div>

            <div className="absolute -right-4 md:-right-8 bottom-1/3 bg-white/90 dark:bg-surface/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl p-3 md:p-4 shadow-xl dark:shadow-2xl animate-[bounce_5s_infinite_reverse] hidden sm:flex flex-col z-30">
              <span className="text-[8px] md:text-[10px] text-slate-500 dark:text-white/50 font-bold uppercase tracking-widest mb-1">Profit Factor</span>
              <span className="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400">2.8x</span>
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
