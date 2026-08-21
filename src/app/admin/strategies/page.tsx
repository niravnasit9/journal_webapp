"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { StrategyDoc } from "@/lib/firebase/schema";
import Link from "next/link";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function AdminStrategiesPage() {
  const [strategies, setStrategies] = useState<StrategyDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, id: string, name: string}>({isOpen: false, id: "", name: ""});

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "strategies"));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as StrategyDoc));
      // Sort by latest created
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setStrategies(list);
    } catch (error) {
      console.error("Failed to fetch strategies", error);
      toast.error("Failed to fetch strategies.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteStrategy = (id: string, name: string) => {
    setConfirmModal({ isOpen: true, id, name });
  };

  const handleDeleteStrategy = async () => {
    const { id, name } = confirmModal;
    setConfirmModal({ isOpen: false, id: "", name: "" });

    try {
      await deleteDoc(doc(db, "strategies", id));
      toast.success(`Successfully deleted strategy: ${name}`);
      fetchStrategies(); // Refresh list
    } catch (error: any) {
      console.error("Delete failed", error);
      toast.error("Failed to delete strategy: " + error.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <i className="las la-chess-knight text-3xl text-indigo-500"></i>
            Strategy Management
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm font-medium mt-1">View or forcefully remove user strategies.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111318] border border-yellow-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700 dark:text-slate-300">
            <thead className="bg-[#fafafa] dark:bg-[#0a0f1c] text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest border-b border-yellow-200 dark:border-slate-800">
              <tr>
                <th className="px-4 md:px-6 py-4">Strategy</th>
                <th className="px-4 md:px-6 py-4 hidden md:table-cell">Author</th>
                <th className="px-4 md:px-6 py-4 hidden sm:table-cell">Access</th>
                <th className="px-4 md:px-6 py-4 hidden lg:table-cell">Rules</th>
                <th className="px-4 md:px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8"><LoadingSpinner /></td>
                </tr>
              ) : strategies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400 dark:text-slate-500 font-bold">
                    No strategies found on the platform.
                  </td>
                </tr>
              ) : (
                strategies.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0 border border-gray-200 dark:border-white/10 hidden sm:flex">
                          {s.image_url ? (
                            <img src={s.image_url} alt="Cover" className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            <i className="las la-book text-gray-400"></i>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white line-clamp-1">{s.name}</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{new Date(s.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 hidden md:table-cell">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 dark:text-white">{s.owner_name || "Trader"}</span>
                        <span className="text-xs text-gray-400 dark:text-slate-500">{s.owner_email || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 hidden sm:table-cell">
                      {s.is_public ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
                          <i className="las la-lock"></i> Private
                        </span>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-4 hidden lg:table-cell">
                      <span className="font-black text-gray-900 dark:text-white">{s.rules.length}</span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {s.is_public && (
                          <a 
                            href={`/strategy/${s.id}`} 
                            target="_blank"
                            title="View Public Page"
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                          >
                            <i className="las la-external-link-alt text-lg"></i>
                          </a>
                        )}
                        <button 
                          onClick={() => confirmDeleteStrategy(s.id, s.name)}
                          title="Delete Strategy"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        >
                          <i className="las la-trash-alt text-lg"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title="Force Delete Strategy"
        message={`Are you absolutely sure you want to permanently delete the strategy "${confirmModal.name}"? The author will lose access to it.`}
        confirmText="Yes, Delete"
        onConfirm={handleDeleteStrategy}
        onCancel={() => setConfirmModal({isOpen: false, id: "", name: ""})}
      />
    </div>
  );
}
