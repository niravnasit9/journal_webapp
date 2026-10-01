import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { GoalDoc } from "@/lib/firebase/schema";
import { useAuth } from "@/lib/firebase/authContext";
import toast from "react-hot-toast";
import DatePicker from "@/components/ui/DatePicker";

interface GoalModalProps {
  onClose: () => void;
  onSuccess: () => void;
  editingGoal?: GoalDoc | null;
}

export default function GoalModal({ onClose, onSuccess, editingGoal }: GoalModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    type: GoalDoc["type"];
    target_value: string;
    deadline: string;
  }>({
    title: editingGoal?.title || "",
    type: editingGoal?.type || "profit_target",
    target_value: editingGoal?.target_value?.toString() || "",
    deadline: editingGoal?.deadline ? new Date(editingGoal.deadline.toMillis ? editingGoal.deadline.toMillis() : editingGoal.deadline).toISOString().split('T')[0] : ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!formData.title || !formData.target_value) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      
      let deadlineDate = null;
      if (formData.deadline) {
        deadlineDate = new Date(formData.deadline);
        // Set to end of day
        deadlineDate.setHours(23, 59, 59, 999);
      }

      if (editingGoal) {
        await updateDoc(doc(db, "goals", editingGoal.id), {
          title: formData.title,
          type: formData.type,
          target_value: Number(formData.target_value),
          deadline: deadlineDate,
          updated_at: serverTimestamp()
        });
        toast.success("Goal updated successfully!");
      } else {
        await addDoc(collection(db, "goals"), {
          owner_uid: user.uid,
          title: formData.title,
          type: formData.type,
          target_value: Number(formData.target_value),
          current_value: 0,
          status: "active",
          deadline: deadlineDate,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
        toast.success("Goal created successfully!");
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create goal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-surface border border-default rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-default bg-elevated/50">
          <h2 className="text-xl font-bold text-primary tracking-tight">{editingGoal ? "Edit Goal" : "Create New Goal"}</h2>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <i className="las la-times text-2xl"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-secondary uppercase tracking-widest mb-2 block">Goal Title</label>
            <input 
              type="text" 
              required
              className="w-full bg-elevated border border-default rounded-lg px-4 py-3 text-sm text-primary focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              placeholder="e.g., $10k Profit Month, 60% Win Rate"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-secondary uppercase tracking-widest mb-2 block">Goal Type</label>
            <select 
              className="w-full bg-elevated border border-default rounded-lg px-4 py-3 text-sm text-primary focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all appearance-none"
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value as GoalDoc["type"]})}
            >
              <option value="profit_target">Profit Target (Net PnL)</option>
              <option value="win_rate">Win Rate %</option>
              <option value="trades_count">Total Trades (Count)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-secondary uppercase tracking-widest mb-2 block">Target Value</label>
            <input 
              type="number" 
              required
              step="any"
              className="w-full bg-elevated border border-default rounded-lg px-4 py-3 text-sm text-primary focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              placeholder={formData.type === 'win_rate' ? "e.g., 65" : formData.type === 'profit_target' ? "e.g., 5000" : "e.g., 100"}
              value={formData.target_value}
              onChange={e => setFormData({...formData, target_value: e.target.value})}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-secondary uppercase tracking-widest mb-2 block">Deadline (Optional)</label>
            <DatePicker 
              value={formData.deadline}
              onChange={(val) => setFormData({...formData, deadline: val})}
              className="w-full bg-elevated border border-default rounded-lg px-4 py-3 text-sm text-primary focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg text-sm font-bold text-secondary bg-elevated hover:bg-surface border border-default transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {loading ? "Saving..." : (editingGoal ? "Save Changes" : "Create Goal")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
