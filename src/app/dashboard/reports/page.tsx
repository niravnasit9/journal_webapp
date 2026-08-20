import { FileText, Download, Lock } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto font-sans">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
          <FileText className="w-6 h-6 text-yellow-500" />
          Export Reports
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Generate and download detailed PDF or CSV reports of your trading history.</p>
      </div>

      <div className="bg-white dark:bg-[#111318] border border-yellow-200 dark:border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-2xl mt-12">
        <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-yellow-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-4">Premium Feature</h2>
        <p className="text-gray-500 dark:text-slate-400 max-w-md mx-auto mb-8">
          The advanced reporting module is currently in development. Soon you will be able to export tax-ready documents, custom PDF tear sheets, and CSV dumps.
        </p>
        <button className="flex items-center gap-2 px-6 py-3 bg-[#e5e7eb] dark:bg-slate-800 hover:bg-slate-700 text-gray-900 dark:text-white font-bold rounded-lg transition-colors border border-yellow-300 dark:border-slate-700 cursor-not-allowed">
          <Download className="w-4 h-4" />
          Export Feature Coming Soon
        </button>
      </div>
    </div>
  );
}
