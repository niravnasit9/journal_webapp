"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import { GoalDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import toast from "react-hot-toast";

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<GoalDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchGoals();
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const q = query(collection(db, "goals"), where("owner_uid", "==", user.uid));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as GoalDoc));
      fetched.sort((a, b) => b.created_at?.toMillis() - a.created_at?.toMillis());
      setGoals(fetched);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;
    try {
      await deleteDoc(doc(db, "goals", goalId));
      toast.success("Goal deleted");
      fetchGoals();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><LoadingSpinner className="w-10 h-10" /></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
            <i className="las la-bullseye text-3xl text-success"></i>
            Trading Goals
          </h1>
          <p className="text-secondary text-sm mt-1">Set targets, track progress, and build discipline.</p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<i className="las la-plus text-lg"></i>}
          onClick={() => toast("Goal creation modal coming soon!")}
        >
          Create Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-elevated flex items-center justify-center mb-4 border border-default">
            <i className="las la-flag text-3xl text-muted"></i>
          </div>
          <h3 className="text-lg font-bold text-primary">No Active Goals</h3>
          <p className="text-secondary text-sm mt-2 max-w-md">
            You haven't set any trading goals yet. Setting clear targets can help maintain focus and discipline.
          </p>
          <Button 
            variant="primary" 
            className="mt-6"
            onClick={() => toast("Goal creation modal coming soon!")}
          >
            Create Your First Goal
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map(goal => {
            const progress = goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0;
            const cappedProgress = Math.max(0, Math.min(100, progress));
            
            return (
              <Card key={goal.id} className="overflow-hidden border-default shadow-sm group">
                <CardHeader className="border-b border-subtle bg-elevated/50 py-4 flex flex-row justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-bold text-primary mb-1">
                      {goal.title}
                    </CardTitle>
                    <Badge 
                      variant={goal.status === 'completed' ? 'success' : goal.status === 'failed' ? 'danger' : 'info'} 
                      size="sm"
                    >
                      {goal.status}
                    </Badge>
                  </div>
                  <button 
                    onClick={() => handleDelete(goal.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-danger/10 text-secondary hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <i className="las la-trash-alt text-lg"></i>
                  </button>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <div className="text-xs text-secondary font-bold uppercase tracking-widest mb-1">Progress</div>
                      <div className="text-xl font-bold text-primary">
                        {goal.type === 'profit_target' ? '$' : ''}{goal.current_value.toLocaleString()} 
                        <span className="text-sm text-secondary font-medium"> / {goal.target_value.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-primary">
                      {cappedProgress.toFixed(0)}%
                    </div>
                  </div>
                  
                  <div className="w-full h-3 bg-elevated rounded-full overflow-hidden border border-subtle relative mt-4">
                    <div 
                      className={`absolute top-0 left-0 h-full transition-all ${cappedProgress >= 100 ? 'bg-success' : 'bg-info'}`}
                      style={{ width: `${cappedProgress}%` }}
                    />
                  </div>

                  {goal.deadline && (
                    <div className="mt-4 pt-4 border-t border-subtle flex items-center gap-2 text-xs text-secondary font-medium">
                      <i className="las la-clock text-lg"></i>
                      Deadline: {new Date(goal.deadline.toMillis()).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
