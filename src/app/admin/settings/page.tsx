"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import { GlobalSettings, PropFirmPreset } from "@/lib/firebase/schema";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<GlobalSettings>({
    ai_revenge_gap_mins: 15,
    ai_bad_session_threshold: 30,
    maintenance_mode: false,
    global_announcement: "",
    max_free_accounts: 1,
    crypto_price_starter: 12,
    crypto_price_pro: 39,
    crypto_price_elite: 89,
    crypto_wallet_address: "",
    crypto_network: "USDT (TRC20)",
  });
  const [presets, setPresets] = useState<PropFirmPreset[]>([]);
  const [newPreset, setNewPreset] = useState({ name: "", target_pct: 8, daily_loss_pct: 5, max_loss_pct: 10, consistency_rule_pct: 50 });
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, "settings", "global");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(prev => ({ ...prev, ...(docSnap.data() as GlobalSettings) }));
      }

      const presetSnap = await getDocs(collection(db, "presets"));
      setPresets(presetSnap.docs.map(d => ({ id: d.id, ...d.data() } as PropFirmPreset)));
    };
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "settings", "global"), settings, { merge: true });
      alert("Global settings updated!");
    } catch (error) {
      console.error(error);
      alert("Failed to save.");
    }
    setIsSaving(false);
  };

  const handleAddPreset = async () => {
    if (!newPreset.name) return;
    try {
      const docRef = await addDoc(collection(db, "presets"), newPreset);
      setPresets([...presets, { id: docRef.id, ...newPreset }]);
      setNewPreset({ name: "", target_pct: 8, daily_loss_pct: 5, max_loss_pct: 10, consistency_rule_pct: 50 });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeletePreset = async (id: string) => {
    try {
      await deleteDoc(doc(db, "presets", id));
      setPresets(presets.filter(p => p.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Command Center</h1>
        <p className="text-neutral-400 mt-1">Manage global platform configurations and crypto billing.</p>
      </div>

      {/* SECTION A: CRYPTO BILLING ENGINE (NEW) */}
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <i className="las la-wallet text-blue-500"></i> Crypto Billing & Pricing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase">Starter Tier Price (USDT/USDC)</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2.5 text-neutral-500">$</span>
                <input type="number" value={settings.crypto_price_starter} onChange={(e) => setSettings({ ...settings, crypto_price_starter: Number(e.target.value) })} className="w-full bg-[#121212] border border-neutral-800 focus:border-blue-500 focus:ring-1 text-white rounded-lg pl-8 pr-3 py-2" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase">Pro Tier Price (USDT/USDC)</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2.5 text-neutral-500">$</span>
                <input type="number" value={settings.crypto_price_pro} onChange={(e) => setSettings({ ...settings, crypto_price_pro: Number(e.target.value) })} className="w-full bg-[#121212] border border-neutral-800 focus:border-blue-500 focus:ring-1 text-white rounded-lg pl-8 pr-3 py-2" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase">Elite Tier Price (USDT/USDC)</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2.5 text-neutral-500">$</span>
                <input type="number" value={settings.crypto_price_elite} onChange={(e) => setSettings({ ...settings, crypto_price_elite: Number(e.target.value) })} className="w-full bg-[#121212] border border-neutral-800 focus:border-blue-500 focus:ring-1 text-white rounded-lg pl-8 pr-3 py-2" />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase">Receiving Wallet Address</label>
              <input type="text" value={settings.crypto_wallet_address} onChange={(e) => setSettings({ ...settings, crypto_wallet_address: e.target.value })} className="w-full bg-[#121212] border border-neutral-800 text-white rounded-lg px-3 py-2 mt-1 font-mono text-sm" placeholder="0x..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase">Accepted Network</label>
              <input type="text" value={settings.crypto_network} onChange={(e) => setSettings({ ...settings, crypto_network: e.target.value })} className="w-full bg-[#121212] border border-neutral-800 text-white rounded-lg px-3 py-2 mt-1" placeholder="e.g., USDT (TRC20)" />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B: PROP FIRM PRESET MANAGER */}
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <i className="las la-building text-blue-500"></i> Prop Firm Presets
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <input type="text" placeholder="Preset Name (e.g. FTMO)" value={newPreset.name} onChange={e => setNewPreset({...newPreset, name: e.target.value})} className="bg-[#121212] border border-neutral-800 text-white rounded-lg px-3 py-2 col-span-2 md:col-span-1" />
          <input type="number" placeholder="Target %" value={newPreset.target_pct} onChange={e => setNewPreset({...newPreset, target_pct: Number(e.target.value)})} className="bg-[#121212] border border-neutral-800 text-white rounded-lg px-3 py-2" />
          <input type="number" placeholder="Daily Loss %" value={newPreset.daily_loss_pct} onChange={e => setNewPreset({...newPreset, daily_loss_pct: Number(e.target.value)})} className="bg-[#121212] border border-neutral-800 text-white rounded-lg px-3 py-2" />
          <input type="number" placeholder="Max Loss %" value={newPreset.max_loss_pct} onChange={e => setNewPreset({...newPreset, max_loss_pct: Number(e.target.value)})} className="bg-[#121212] border border-neutral-800 text-white rounded-lg px-3 py-2" />
          <button onClick={handleAddPreset} className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 font-semibold transition-colors">Add</button>
        </div>

        <div className="space-y-2">
          {presets.map(p => (
            <div key={p.id} className="flex justify-between items-center bg-[#121212] border border-neutral-800 p-3 rounded-lg">
              <span className="text-white font-medium">{p.name}</span>
              <div className="flex gap-4 text-sm text-neutral-400">
                <span>Target: {p.target_pct}%</span>
                <span>Daily Loss: {p.daily_loss_pct}%</span>
                <span>Max Loss: {p.max_loss_pct}%</span>
                <button onClick={() => handleDeletePreset(p.id!)} className="text-rose-500 hover:text-rose-400"><i className="las la-trash"></i></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SECTION C: SYSTEM LIMITS & AI */}
        <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <i className="las la-lock text-blue-500"></i> Platform Limits
            </h2>
            <label className="text-xs font-semibold text-neutral-400 uppercase">Max Free Accounts</label>
            <input type="number" value={settings.max_free_accounts} onChange={(e) => setSettings({ ...settings, max_free_accounts: Number(e.target.value) })} className="w-full bg-[#121212] border border-neutral-800 text-white rounded-lg px-3 py-2 mt-1" />
            <p className="text-[11px] text-neutral-500 mt-1">Number of accounts allowed before triggering the paywall.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <i className="las la-brain text-blue-500"></i> AI Strictness
            </h2>
            <label className="text-xs font-semibold text-neutral-400 uppercase">Revenge Gap (Minutes)</label>
            <input type="number" value={settings.ai_revenge_gap_mins} onChange={(e) => setSettings({ ...settings, ai_revenge_gap_mins: Number(e.target.value) })} className="w-full bg-[#121212] border border-neutral-800 text-white rounded-lg px-3 py-2 mt-1 mb-3" />
            <label className="text-xs font-semibold text-neutral-400 uppercase">Bad Session Threshold (%)</label>
            <input type="number" value={settings.ai_bad_session_threshold} onChange={(e) => setSettings({ ...settings, ai_bad_session_threshold: Number(e.target.value) })} className="w-full bg-[#121212] border border-neutral-800 text-white rounded-lg px-3 py-2 mt-1" />
          </div>
        </div>

        {/* SECTION D: BROADCAST */}
        <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <i className="las la-bullhorn text-blue-500"></i> Global Broadcast System
          </h2>
          <label className="text-xs font-semibold text-neutral-400 uppercase">Dashboard Banner</label>
          <textarea value={settings.global_announcement} onChange={(e) => setSettings({ ...settings, global_announcement: e.target.value })} className="w-full bg-[#121212] border border-neutral-800 text-white rounded-lg px-3 py-2 mt-1 min-h-[150px]" />
        </div>
      </div>

      <button onClick={handleSaveSettings} disabled={isSaving} className="w-full lg:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-8 rounded-lg shadow-lg flex items-center justify-center gap-2">
        <i className="las la-save text-xl"></i> {isSaving ? "Syncing..." : "Save Global Settings"}
      </button>
    </div>
  );
}
