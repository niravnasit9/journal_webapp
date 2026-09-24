export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
        <i className="las la-chart-bar text-white text-xl"></i>
      </div>
      <span className="text-xl font-bold tracking-tight text-primary">ProfitPulse</span>
    </div>
  );
}
