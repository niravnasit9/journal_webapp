import React from 'react';
import { CoachingAlert } from '@/lib/coachingEngine';

interface CoachingAlertsProps {
  alerts: CoachingAlert[];
}

export const CoachingAlerts: React.FC<CoachingAlertsProps> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-8">
      <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
        <i className="las la-robot text-blue-500 text-lg"></i> AI Coaching Insights
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((alert, idx) => (
          <div 
            key={idx} 
            className={`p-4 rounded-xl border ${
              alert.type === 'positive' 
                ? 'bg-emerald-900/10 border-emerald-500/30 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]' 
                : 'bg-amber-900/10 border-amber-500/30 shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]'
            } flex items-start gap-4`}
          >
            <div className={`mt-1 p-2 rounded-full ${
              alert.type === 'positive' 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/20 text-amber-400'
            }`}>
              <i className={`las text-xl ${alert.type === 'positive' ? 'la-check-circle' : 'la-exclamation-triangle'}`}></i>
            </div>
            <div>
              <h4 className={`text-sm font-bold mb-1 ${
                alert.type === 'positive' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {alert.title}
              </h4>
              <p className="text-sm text-neutral-300 leading-relaxed font-medium">
                {alert.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
