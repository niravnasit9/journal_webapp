export default function TestimonialSection() {
  const testimonials = [
    {
      quote: "ProfitPulse completely transformed how I review my trades. The interactive equity curve and MFE/MAE analysis highlighted exactly where I was leaving money on the table.",
      author: "Alex Thompson",
      role: "Prop Firm Trader",
      initials: "AT",
      color: "bg-blue-100 text-blue-700"
    },
    {
      quote: "Before this, I used a clunky spreadsheet. Now, my journal syncs automatically and the AI insights are incredibly accurate. It's an absolute game-changer.",
      author: "Sarah Jenkins",
      role: "Retail Day Trader",
      initials: "SJ",
      color: "bg-emerald-100 text-emerald-700"
    },
    {
      quote: "The strategic playbooks feature allows me to document my setups beautifully. I've stopped taking random trades and my win rate has jumped by 15%.",
      author: "Michael Chang",
      role: "Options Specialist",
      initials: "MC",
      color: "bg-indigo-100 text-indigo-700"
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-white dark:bg-base transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-slate-900 dark:text-white">
            Trusted by top <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">traders</span>.
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            See how ProfitPulse is helping retail traders trade like institutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-slate-50 dark:bg-surface/50 border border-slate-200 dark:border-white/10 p-8 rounded-3xl relative hover:-translate-y-1 transition-transform">
              <i className="las la-quote-left absolute top-8 left-8 text-4xl text-slate-200 dark:text-white/5"></i>
              <p className="text-slate-700 dark:text-slate-300 text-lg mb-8 relative z-10 font-medium leading-relaxed pt-6">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${t.color}`}>
                  {t.initials}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{t.author}</h4>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
