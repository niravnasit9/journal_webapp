import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="bg-white dark:bg-base border-t border-slate-200 dark:border-white/10 pt-16 pb-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center">
                <i className="las la-chart-line text-white text-xl"></i>
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                ProfitPulse
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-sm leading-relaxed">
              The ultimate trading journal and analytics platform designed to help serious traders find their edge, track their progress, and eliminate emotional mistakes.
            </p>
          </div>
          
          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</Link></li>
              <li><Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing</Link></li>
              <li><Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Changelog</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-200 dark:border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 dark:text-slate-400 text-xs">
            © {new Date().getFullYear()} ProfitPulse. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="w-8 h-8 rounded-full bg-slate-50 dark:bg-surface border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-slate-300 dark:hover:border-white/30 transition-all">
              <i className="lab la-twitter text-lg"></i>
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-slate-50 dark:bg-surface border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-slate-300 dark:hover:border-white/30 transition-all">
              <i className="lab la-discord text-lg"></i>
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-slate-50 dark:bg-surface border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-slate-300 dark:hover:border-white/30 transition-all">
              <i className="lab la-github text-lg"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
