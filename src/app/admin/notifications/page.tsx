"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

interface Broadcast {
  id: string;
  title: string;
  message: string;
  target: "ALL" | "PRO_ELITE" | "SPECIFIC";
  sender: string;
  created_at: any;
  reach_count: number;
}

export default function AdminNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<"ALL" | "PRO_ELITE" | "SPECIFIC">("ALL");

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const fetchBroadcasts = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "broadcasts"));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as Broadcast));
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setBroadcasts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error("Title and message are required.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        title,
        message,
        target,
        sender: "Admin", // Should be auth user in real app
        created_at: new Date().toISOString(),
        reach_count: target === "ALL" ? 15200 : target === "PRO_ELITE" ? 3450 : 1
      };
      await addDoc(collection(db, "broadcasts"), payload);
      toast.success("Broadcast published globally!");
      setTitle("");
      setMessage("");
      setTarget("ALL");
      fetchBroadcasts();
    } catch (error) {
      toast.error("Failed to publish broadcast.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in font-sans">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-page text-white">Notifications & System Broadcasts</h1>
        <p className="text-sm text-secondary mt-1">Send immediate platform-wide alerts and announcements.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Section: Broadcast Form */}
        <div className="premium-card p-6 shadow-2xl relative overflow-hidden group border border-default">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <i className="las la-broadcast-tower text-blue-500"></i> New Broadcast
          </h2>
          
          <form onSubmit={handlePublish} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Announcement Title</label>
              <input 
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Scheduled Maintenance Notice"
                className="input-premium w-full bg-elevated border-default text-sm"
              />
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Message Body</label>
              <textarea 
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Write your alert here..."
                className="input-premium w-full bg-elevated border-default h-32 resize-none text-sm"
              ></textarea>
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Target Audience</label>
              <select 
                value={target}
                onChange={e => setTarget(e.target.value as any)}
                className="input-premium w-full bg-elevated border-default text-sm font-bold text-secondary"
              >
                <option value="ALL">All Users (Platform-Wide)</option>
                <option value="PRO_ELITE">Pro & Elite Members Only</option>
                <option value="SPECIFIC">Specific User ID</option>
              </select>
            </div>
            
            <div className="pt-4 mt-4 border-t border-default">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-primary w-full py-4 text-base shadow-[0_0_20px_rgba(59,130,246,0.3)] flex justify-center items-center gap-2"
              >
                {isSubmitting ? <LoadingSpinner className="w-5 h-5 border-white" /> : <><i className="las la-paper-plane text-xl"></i> Publish Global Alert</>}
              </button>
            </div>
          </form>
        </div>

        {/* Right Section: Broadcast History */}
        <div className="premium-card p-0 shadow-2xl border border-default flex flex-col h-full">
          <div className="p-6 border-b border-default bg-elevated">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <i className="las la-history text-secondary"></i> Broadcast History
            </h2>
          </div>
          
          <div className="overflow-y-auto flex-1 p-4 space-y-4 max-h-[600px] no-scrollbar">
            {loading ? (
              <div className="flex justify-center p-12">
                <LoadingSpinner className="w-8 h-8 border-blue-500" />
              </div>
            ) : broadcasts.length === 0 ? (
              <div className="text-center text-muted py-12 italic">No broadcasts sent yet.</div>
            ) : (
              broadcasts.map(b => (
                <div key={b.id} className="premium-inner-box p-4 border border-default hover:border-strong transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white text-sm">{b.title}</h3>
                    <span className="text-[10px] text-muted uppercase tracking-widest font-mono">
                      {new Date(b.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-secondary mb-4 line-clamp-2">{b.message}</p>
                  
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest pt-3 border-t border-default">
                    <div className="flex items-center gap-2 text-muted">
                      <i className="las la-user-shield"></i> {b.sender}
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                      <i className="las la-satellite-dish"></i> Reached: {b.reach_count.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
