"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function AdminSettingsPage() {
  const [accountTypes, setAccountTypes] = useState<string[]>([]);
  const [newType, setNewType] = useState("");
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, type: string}>({isOpen: false, type: ""});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, "settings", "platform");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setAccountTypes(data.accountTypes || ["Real", "Funded", "Goat Funded Challenge Phase-1", "Goat Funded Challenge Phase-2"]);
      } else {
        // Initialize default
        const defaults = ["Real", "Funded", "Goat Funded Challenge Phase-1", "Goat Funded Challenge Phase-2"];
        await setDoc(docRef, { accountTypes: defaults });
        setAccountTypes(defaults);
      }
    } catch (error) {
      console.error("Failed to load settings", error);
      toast.error("Failed to load platform settings.");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newTypes: string[]) => {
    try {
      setSaving(true);
      await setDoc(doc(db, "settings", "platform"), { accountTypes: newTypes }, { merge: true });
      setAccountTypes(newTypes);
      toast.success("Settings saved successfully.");
    } catch (error) {
      console.error("Failed to save settings", error);
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddType = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newType.trim();
    if (!trimmed) return;
    if (accountTypes.includes(trimmed)) {
      toast.error("This account type already exists.");
      return;
    }
    const updated = [...accountTypes, trimmed];
    saveSettings(updated);
    setNewType("");
  };

  const confirmRemoveType = (typeToRemove: string) => {
    setConfirmModal({ isOpen: true, type: typeToRemove });
  };

  const handleRemoveType = () => {
    const typeToRemove = confirmModal.type;
    setConfirmModal({ isOpen: false, type: "" });
    const updated = accountTypes.filter(t => t !== typeToRemove);
    saveSettings(updated);
  };

  if (loading) {
    return <div className="text-gray-900 dark:text-white p-6 text-center font-bold">Loading Settings...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <i className="las la-cog text-3xl text-purple-500"></i>
            Global Settings
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm font-medium mt-1">Configure platform-wide parameters.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111318] rounded-2xl border border-yellow-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-yellow-200 dark:border-slate-800 bg-[#fafafa] dark:bg-[#0a0f1c]/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
            <i className="las la-list-ul text-xl text-blue-500"></i>
            Dynamic Account Types
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Define the list of available account types (e.g., "Real", "Funded", "Phase-3") that users can select when creating a new trading account.
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          <form onSubmit={handleAddType} className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              placeholder="e.g. Prop Firm Evaluation"
              className="flex-1 bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-200 dark:border-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 font-medium transition-all"
            />
            <button 
              type="submit" 
              disabled={saving || !newType.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-gray-900 dark:text-white font-bold rounded-xl transition-colors whitespace-nowrap disabled:opacity-50 border border-transparent shadow-[0_0_20px_rgba(37,99,235,0.2)]"
            >
              Add Type
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
            {accountTypes.map((type, idx) => (
              <div key={idx} className="flex items-center justify-between bg-[#f9fafb] dark:bg-[#1a1d24] border border-yellow-200 dark:border-slate-800 rounded-xl p-4 group">
                <span className="font-bold text-gray-900 dark:text-white">{type}</span>
                <button 
                  onClick={() => confirmRemoveType(type)}
                  className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-rose-500 hover:text-gray-900 dark:text-white"
                  title="Remove"
                >
                  <i className="las la-trash-alt"></i>
                </button>
              </div>
            ))}
            {accountTypes.length === 0 && (
              <div className="col-span-full text-center p-4 text-gray-400 dark:text-slate-500 font-bold border border-dashed border-yellow-200 dark:border-slate-800 rounded-xl">
                No account types defined. Users will not be able to create accounts.
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Remove Account Type"
        message={`Are you sure you want to remove "${confirmModal.type}"? Existing accounts with this type will not be changed, but users won't be able to select it anymore.`}
        confirmText="Remove Type"
        onConfirm={handleRemoveType}
        onCancel={() => setConfirmModal({ isOpen: false, type: "" })}
        isDanger={true}
      />
    </div>
  );
}
