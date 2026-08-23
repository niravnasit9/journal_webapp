import React from 'react';
import { useTierAccess } from '@/hooks/useTierAccess';
import { Button } from '@/components/ui/Button';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ZAxis } from 'recharts';

interface TradeData {
  id: string;
  pnl: number;
  mfe: number;
  mae: number;
}

export const MfeMaeChart = ({ trades }: { trades: TradeData[] }) => {
  const { mfeMaeAnalytics } = useTierAccess();

  if (!mfeMaeAnalytics) {
    return (
      <div className="relative rounded-2xl border border-slate-200 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden min-h-[400px] flex items-center justify-center">
        {/* Blurred background mock chart */}
        <div className="absolute inset-0 filter blur-md opacity-30 pointer-events-none">
          <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
        </div>
        
        {/* Upgrade CTA */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-md bg-white/80 dark:bg-slate-900/80 p-6 rounded-xl backdrop-blur-sm border border-slate-200 dark:border-slate-700">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Advanced MFE/MAE Analytics Locked</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Optimize your stop-losses and take-profits by visualizing exactly how much money you leave on the table. Upgrade to Pro to unlock.
          </p>
          <Button variant="primary" className="w-full" onClick={() => window.location.href='/checkout/pro'}>
            Upgrade to Pro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">MFE/MAE Scatter Plot</h3>
       <div className="h-[400px] w-full border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900/50 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              
              {/* X Axis: MFE (Favorable) -> Green / Positive */}
              <XAxis 
                type="number" 
                dataKey="mfe" 
                name="MFE ($)" 
                stroke="#475569" 
                tick={{fill: '#475569', fontSize: 10}}
                tickFormatter={(val) => `$${val}`}
                domain={['auto', 'auto']}
              />
              
              {/* Y Axis: MAE (Adverse) -> Red / Negative */}
              <YAxis 
                type="number" 
                dataKey="mae" 
                name="MAE ($)" 
                stroke="#475569" 
                tick={{fill: '#475569', fontSize: 10}}
                tickFormatter={(val) => `$${val}`}
                domain={['auto', 0]}
              />
              
              {/* Z Axis for bubble size (optional, currently static) */}
              <ZAxis type="number" range={[60, 60]} />

              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                contentStyle={{ backgroundColor: '#0f1115', borderColor: '#1f2229', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ display: 'none' }}
                formatter={(value: any, name: any) => [`$${Number(value).toFixed(2)}`, name === 'mfe' ? 'Max Favorable ($)' : 'Max Adverse ($)']}
              />
              
              <ReferenceLine y={0} stroke="#334155" />
              <ReferenceLine x={0} stroke="#334155" />

              {/* Plot Winning Trades */}
              <Scatter name="Wins" data={trades.filter(t => t.pnl > 0)} fill="#10b981" fillOpacity={0.6} />
              
              {/* Plot Losing Trades */}
              <Scatter name="Losses" data={trades.filter(t => t.pnl <= 0)} fill="#ef4444" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
       </div>
    </div>
  );
};
