export default function FeatureGrid() {
  const features = [
    {
      title: "Automated Trade Journaling",
      description: "Seamlessly sync your trades via API or CSV. No more manual data entry. Your dashboard updates in real-time with every execution.",
      icon: "la-sync",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    },
    {
      title: "Advanced MFE/MAE Analysis",
      description: "Identify trades that were in profit but closed for a loss. Uncover your hidden flaws and optimize your exit strategies instantly.",
      icon: "la-chart-bar",
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20"
    },
    {
      title: "Interactive Equity Curves",
      description: "Visualize your portfolio's growth over time with interactive, brushable charts. Zoom into specific drawdowns and analyze performance.",
      icon: "la-chart-area",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20"
    },
    {
      title: "Strategic Playbooks",
      description: "Document your A+ setups with rich text, image uploads, and checklists. Systematize your trading and stop taking random trades.",
      icon: "la-book",
      color: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/20"
    },
    {
      title: "Goal Tracking & Milestones",
      description: "Set daily, weekly, or monthly P&L targets. Watch your progress update automatically and celebrate when you hit your milestones.",
      icon: "la-bullseye",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20"
    },
    {
      title: "AI Trade Insights",
      description: "Let our Monte Carlo Simulator and AI engine analyze your win rates to predict future performance and provide actionable feedback.",
      icon: "la-robot",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20"
    }
  ];

  return (
    <section id="features" className="py-24 relative overflow-hidden bg-[#050608]">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">master the markets</span>.
          </h2>
          <p className="text-muted-foreground text-lg">
            Built by traders, for traders. ProfitPulse provides institutional-grade analytics wrapped in a beautiful, intuitive interface.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div 
              key={i} 
              className="group bg-surface/50 hover:bg-surface backdrop-blur-sm border border-white/5 hover:border-white/10 p-8 rounded-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feature.bg} ${feature.border} border transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                <i className={`las ${feature.icon} text-3xl ${feature.color}`}></i>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
