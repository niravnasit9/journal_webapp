export default function IntegrationsMarquee() {
  const brokers = [
    { name: "MetaTrader 5", color: "text-blue-600" },
    { name: "TradingView", color: "text-slate-900" },
    { name: "NinjaTrader", color: "text-emerald-600" },
    { name: "cTrader", color: "text-red-500" },
    { name: "TradeLocker", color: "text-purple-600" },
    { name: "Match-Trader", color: "text-sky-500" },
    { name: "DXtrade", color: "text-indigo-600" },
  ];

  return (
    <div className="py-10 border-y border-slate-200 dark:border-white/5 bg-white/50 dark:bg-base/50 backdrop-blur-md overflow-hidden flex flex-col items-center transition-colors">
      <p className="text-sm font-semibold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-6 text-center">Seamlessly integrates with your favorite platforms</p>
      
      <div className="relative w-full max-w-7xl mx-auto flex overflow-x-hidden">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-16 py-2 px-8">
          {/* Double the array for smooth infinite scrolling */}
          {[...brokers, ...brokers].map((broker, i) => (
            <span key={i} className={`text-xl md:text-2xl font-black ${broker.color} opacity-80 hover:opacity-100 transition-opacity cursor-default mix-blend-multiply`}>
              {broker.name}
            </span>
          ))}
        </div>
        
        {/* Gradient Fades for Marquee edges */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-50 dark:from-base to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-50 dark:from-base to-transparent z-10 pointer-events-none"></div>
      </div>
    </div>
  );
}
