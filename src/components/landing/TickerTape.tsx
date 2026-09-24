export default function TickerTape() {
  const assets = [
    { symbol: "BTC/USD", price: "68,412.35", change: "+2.14%", isUp: true },
    { symbol: "ETH/USD", price: "3,840.10", change: "+1.85%", isUp: true },
    { symbol: "SPY", price: "512.30", change: "-0.42%", isUp: false },
    { symbol: "QQQ", price: "438.90", change: "-0.15%", isUp: false },
    { symbol: "SOL/USD", price: "145.20", change: "+5.67%", isUp: true },
    { symbol: "AAPL", price: "173.50", change: "+1.20%", isUp: true },
    { symbol: "TSLA", price: "202.10", change: "-2.30%", isUp: false },
    { symbol: "NVDA", price: "880.50", change: "+4.10%", isUp: true },
    { symbol: "GOLD", price: "2,150.80", change: "+0.80%", isUp: true },
    { symbol: "EUR/USD", price: "1.0845", change: "-0.10%", isUp: false },
  ];

  // Duplicate for seamless infinite scroll
  const scrollItems = [...assets, ...assets];

  return (
    <div className="w-full bg-[#050608] border-b border-white/5 overflow-hidden flex items-center h-10 relative z-50">
      <div className="flex animate-[scroll_40s_linear_infinite] w-max">
        {scrollItems.map((asset, i) => (
          <div key={i} className="flex items-center gap-2 px-6 border-r border-white/5 whitespace-nowrap">
            <span className="text-white/80 text-xs font-bold font-mono tracking-wider">{asset.symbol}</span>
            <span className="text-white text-xs font-medium font-mono">{asset.price}</span>
            <span className={`text-xs font-medium font-mono ${asset.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {asset.change}
            </span>
          </div>
        ))}
      </div>
      
      {/* Gradient Fades for edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#050608] to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#050608] to-transparent z-10 pointer-events-none"></div>
    </div>
  );
}
