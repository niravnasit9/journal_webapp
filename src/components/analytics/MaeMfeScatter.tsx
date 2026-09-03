"use client";

import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TradeDoc } from '@/lib/firebase/schema';

export const MaeMfeScatter: React.FC<{ trades: TradeDoc[] }> = ({ trades }) => {
  const { data, moneyLeftOnTable } = useMemo(() => {
    let mfeSum = 0;
    let profitSum = 0;
    let winCount = 0;

    const chartData = trades
      .filter(t => t.mfe_usd !== undefined && t.mae_usd !== undefined)
      .map(t => {
        const pnl = t.profit_loss - (t.commission || 0);
        
        // For AI Calc: Money left on table for winning trades
        if (pnl > 0 && t.mfe_usd !== undefined) {
          mfeSum += t.mfe_usd;
          profitSum += pnl;
          winCount++;
        }

        return {
          id: t.id,
          symbol: t.symbol,
          mfe: t.mfe_usd || 0,
          mae: Math.abs(t.mae_usd || 0),
          pnl: pnl,
          isWin: pnl >= 0
        };
      });

    const avgMfe = winCount > 0 ? mfeSum / winCount : 0;
    const avgProfit = winCount > 0 ? profitSum / winCount : 0;
    const leftOnTable = Math.max(0, avgMfe - avgProfit);

    return { data: chartData, moneyLeftOnTable: leftOnTable };
  }, [trades]);

  if (trades.length < 5) {
    return (
      <div className="bg-[#0a0a0a] border border-default rounded-2xl p-6 shadow-xl w-full h-[400px] flex flex-col items-center justify-center text-center">
        <i className="las la-braille text-6xl text-neutral-800 mb-4"></i>
        <h2 className="text-xl font-bold text-white tracking-tight">MFE / MAE Inefficiency</h2>
        <p className="text-sm text-muted mt-2">Log at least 5 trades with MFE/MAE data to unlock this scatter plot.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#121212] border border-default p-3 rounded-lg shadow-xl">
          <p className="text-sm font-bold text-white mb-1">{data.symbol}</p>
          <div className="space-y-1 text-xs">
            <p className="text-emerald-400">MFE: +${data.mfe.toFixed(2)}</p>
            <p className="text-rose-400">MAE: -${data.mae.toFixed(2)}</p>
            <p className="text-secondary">Closed: {data.pnl >= 0 ? '+' : '-'}${Math.abs(data.pnl).toFixed(2)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#0a0a0a] border border-default rounded-2xl p-6 shadow-xl w-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <i className="las la-braille text-[#a855f7]"></i> Trade Excursion (MFE / MAE)
        </h2>
        {moneyLeftOnTable > 0 && (
          <div className="mt-4 bg-[#a855f7]/10 border border-[#a855f7]/20 p-4 rounded-xl">
            <p className="text-sm text-white font-medium">
              <span className="text-[#a855f7] font-bold">Money Left on the Table:</span> You are giving back an average of <span className="font-bold">${moneyLeftOnTable.toFixed(2)}</span> per winning trade by holding past your Maximum Favorable Excursion. Consider trailing your stops tighter.
            </p>
          </div>
        )}
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis 
              type="number" 
              dataKey="mae" 
              name="MAE" 
              stroke="#525252" 
              fontSize={12} 
              tickFormatter={(v) => `$${v}`}
              label={{ value: 'Maximum Adverse Excursion ($)', position: 'insideBottom', offset: -10, fill: '#525252', fontSize: 12 }}
            />
            <YAxis 
              type="number" 
              dataKey="mfe" 
              name="MFE" 
              stroke="#525252" 
              fontSize={12} 
              tickFormatter={(v) => `$${v}`}
              label={{ value: 'Maximum Favorable Excursion ($)', angle: -90, position: 'insideLeft', fill: '#525252', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Trades" data={data}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.isWin ? '#10b981' : '#ef4444'} opacity={0.7} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
