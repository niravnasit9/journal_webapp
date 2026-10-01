import React from "react";
import { GoalDoc } from "@/lib/firebase/schema";
import { Badge } from "@/components/ui/Badge";

interface GoalDetailsModalProps {
  goal: GoalDoc;
  currentValue: number;
  formatMoney: (val: number) => string;
  onClose: () => void;
  tradesCount: number;
  winRate: number;
}

export default function GoalDetailsModal({ 
  goal, 
  currentValue, 
  formatMoney, 
  onClose,
  tradesCount,
  winRate
}: GoalDetailsModalProps) {
  const progress = goal.target_value > 0 ? (currentValue / goal.target_value) * 100 : 0;
  const cappedProgress = Math.max(0, Math.min(100, progress));
  const isCompleted = currentValue >= goal.target_value;
  const remaining = Math.max(0, goal.target_value - currentValue);

  const formatDisplay = (val: number) => {
    if (goal.type === 'profit_target') return formatMoney(val);
    if (goal.type === 'win_rate') return `${Number(val.toFixed(2))}%`;
    return Number(val.toFixed(2)).toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-surface border border-default rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header Section */}
        <div className="p-6 border-b border-default bg-elevated/50 flex justify-between items-start">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-surface border border-default flex items-center justify-center text-2xl text-blue-500">
              <i className={`las ${goal.type === 'profit_target' ? 'la-wallet' : goal.type === 'win_rate' ? 'la-chart-pie' : 'la-list-ol'}`}></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary mb-1">{goal.title}</h2>
              <Badge variant={isCompleted ? 'success' : goal.status === 'failed' ? 'danger' : 'info'} size="sm">
                {isCompleted ? 'Completed' : 'In Progress'}
              </Badge>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface text-muted hover:text-primary transition-colors border border-transparent hover:border-default">
            <i className="las la-times text-xl"></i>
          </button>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-6">
          
          {/* Progress Section */}
          <div className="bg-elevated/30 rounded-xl p-5 border border-default">
            <div className="flex justify-between items-end mb-2">
              <div className="text-xs text-secondary font-bold uppercase tracking-widest flex items-center gap-1">
                <i className="las la-chart-bar"></i> Progress
              </div>
              <div className={`text-lg font-bold ${isCompleted ? 'text-emerald-500' : 'text-primary'}`}>
                {cappedProgress.toFixed(1)}%
              </div>
            </div>
            <div className="w-full h-3 bg-elevated rounded-full overflow-hidden border border-subtle relative mb-4">
              <div 
                className={`absolute top-0 left-0 h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${cappedProgress}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-subtle">
              <div>
                <div className="text-xs text-secondary font-medium mb-1">Target</div>
                <div className="text-lg font-bold text-primary">
                  {formatDisplay(goal.target_value)}
                </div>
              </div>
              <div>
                <div className="text-xs text-secondary font-medium mb-1">Current</div>
                <div className="text-lg font-bold text-primary">
                  {formatDisplay(currentValue)}
                </div>
              </div>
            </div>
          </div>

          {!isCompleted && (
            <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/10 flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-500 font-bold uppercase tracking-widest mb-1">Remaining to Target</div>
                <div className="text-lg font-bold text-primary">
                  {formatDisplay(remaining)}
                </div>
              </div>
              <i className="las la-arrow-right text-2xl text-blue-500/50"></i>
            </div>
          )}

          {/* Extra Context */}
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 rounded-xl border border-default bg-elevated/30">
                <div className="text-xs text-secondary font-medium mb-1 flex items-center gap-1"><i className="las la-list"></i> Total Trades</div>
                <div className="text-lg font-bold text-primary">{tradesCount}</div>
             </div>
             <div className="p-4 rounded-xl border border-default bg-elevated/30">
                <div className="text-xs text-secondary font-medium mb-1 flex items-center gap-1"><i className="las la-percentage"></i> Win Rate</div>
                <div className="text-lg font-bold text-primary">{winRate.toFixed(1)}%</div>
             </div>
             {goal.deadline && (
                <div className="col-span-2 p-4 rounded-xl border border-default bg-elevated/30 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-default text-muted">
                    <i className="las la-calendar text-xl"></i>
                  </div>
                  <div>
                    <div className="text-xs text-secondary font-medium mb-0.5">Deadline</div>
                    <div className="text-sm font-bold text-primary">
                      {goal.deadline?.toMillis ? new Date(goal.deadline.toMillis()).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : new Date(goal.deadline).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
