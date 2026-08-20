"use client";

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface PnLChartProps {
  data: { date: string; balance: number; equity: number }[];
}

export default function PnLChart({ data }: PnLChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 bg-[#111827] rounded-xl border border-gray-800">
        No equity data available
      </div>
    );
  }

  // Determine if overall profitable to set graph color
  const initialEquity = data[0]?.equity || 0;
  const finalEquity = data[data.length - 1]?.equity || 0;
  const isProfitable = finalEquity >= initialEquity;

  const strokeColor = isProfitable ? "#34d399" : "#ef4444"; // emerald-400 or rose-500
  const fillColor = isProfitable ? "url(#colorEquityGreen)" : "url(#colorEquityRed)";

  // Format currency dynamically based on what the parent passes or just generic numbers if we don't know
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorEquityGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorEquityRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
          />
          <YAxis 
            stroke="#6b7280" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => value.toLocaleString()}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
            itemStyle={{ color: strokeColor }}
            formatter={(value: any) => [Number(value).toLocaleString(), 'Equity']}
          />
          <Area 
            type="monotone" 
            dataKey="equity" 
            stroke={strokeColor} 
            strokeWidth={3}
            fillOpacity={1} 
            fill={fillColor} 
            name="Equity"
            activeDot={{ r: 6, strokeWidth: 0, fill: strokeColor }}
            dot={{ r: 3, fill: '#111827', strokeWidth: 2, stroke: strokeColor }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
