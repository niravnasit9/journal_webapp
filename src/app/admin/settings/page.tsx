"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { GlobalSettings } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState<GlobalSettings>({
    ai_revenge_gap_mins: 15,
    ai_bad_session_threshold: 3,
    maintenance_mode: false,
    global_announcement: "",
    max_free_accounts: 1,
    crypto_price_starter: 19.99,
    crypto_price_pro: 49.99,
    crypto_price_elite: 99.99,
    crypto_wallet_address: "",
    crypto_network: "TRC20"
  });

  // Additional mock settings for UI requested
  const [newRegistrations, setNewRegistrations] = useState(true);
  const [strictAiEnforcement, setStrictAiEnforcement] = useState(true);
  const [defaultFreeTrialDays, setDefaultFreeTrialDays] = useState(14);
  const [supportEmail, setSupportEmail] = useState("support@profitpulse.com");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const docSnap = await getDoc(doc(db, "settings", "main"));
      if (docSnap.exists()) {
        setSettings(docSnap.data() as GlobalSettings);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, "settings", "main"), settings, { merge: true });
      toast.success("Global settings updated");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[60vh]"><LoadingSpinner className="w-10 h-10 border-blue-500" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in font-sans">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-page text-white">Global Platform Settings</h1>
        <p className="text-sm text-neutral-400 mt-1">Comprehensive configuration panel for platform-wide toggles.</p>
      </div>

      <form onSubmit={handleSave}>
        <div className="premium-card p-0 shadow-2xl border border-neutral-800 mb-8">
          
          <div className="p-6 md:p-8 space-y-8">
            
            {/* Section: Access & Operations */}
            <div>
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-neutral-800 pb-3">
                <i className="las la-shield-alt text-blue-500"></i> Access & Operations
              </h2>
              
              <div className="space-y-6">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
                  <div>
                    <h3 className="text-sm font-bold text-white">Maintenance Mode</h3>
                    <p className="text-xs text-neutral-500 mt-1">Disables login and shows maintenance page to all non-admin users.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.maintenance_mode} 
                      onChange={e => setSettings({...settings, maintenance_mode: e.target.checked})} 
                    />
                    <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
                  <div>
                    <h3 className="text-sm font-bold text-white">New User Registrations</h3>
                    <p className="text-xs text-neutral-500 mt-1">Allow new users to sign up for the platform.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={newRegistrations} 
                      onChange={e => setNewRegistrations(e.target.checked)} 
                    />
                    <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

              </div>
            </div>

            {/* Section: AI & Trading Engine */}
            <div>
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-neutral-800 pb-3">
                <i className="las la-brain text-purple-500"></i> AI & Trading Engine
              </h2>
              
              <div className="space-y-6">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
                  <div>
                    <h3 className="text-sm font-bold text-white">Strict AI Enforcement</h3>
                    <p className="text-xs text-neutral-500 mt-1">If enabled, AI rigidly flags trades that violate rules and decreases trust scores.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={strictAiEnforcement} 
                      onChange={e => setStrictAiEnforcement(e.target.checked)} 
                    />
                    <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="md:w-1/2">
                    <h3 className="text-sm font-bold text-white">AI Revenge Trading Gap (Mins)</h3>
                    <p className="text-xs text-neutral-500 mt-1">Minimum time gap between trades before AI flags it as revenge trading.</p>
                  </div>
                  <div className="md:w-1/3">
                    <input 
                      type="number" 
                      value={settings.ai_revenge_gap_mins}
                      onChange={e => setSettings({...settings, ai_revenge_gap_mins: Number(e.target.value)})}
                      className="input-premium w-full bg-black border-neutral-800 text-sm"
                      min="1" max="120"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Section: Account Defaults */}
            <div>
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-neutral-800 pb-3">
                <i className="las la-user-cog text-emerald-500"></i> Account Defaults
              </h2>
              
              <div className="space-y-6">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="md:w-1/2">
                    <h3 className="text-sm font-bold text-white">Default Free Trial (Days)</h3>
                    <p className="text-xs text-neutral-500 mt-1">Number of days a newly registered user gets on the Free tier before expiry.</p>
                  </div>
                  <div className="md:w-1/3">
                    <input 
                      type="number" 
                      value={defaultFreeTrialDays}
                      onChange={e => setDefaultFreeTrialDays(Number(e.target.value))}
                      className="input-premium w-full bg-black border-neutral-800 text-sm"
                      min="0" max="365"
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="md:w-1/2">
                    <h3 className="text-sm font-bold text-white">Support Email</h3>
                    <p className="text-xs text-neutral-500 mt-1">The global email address for customer support inquiries.</p>
                  </div>
                  <div className="md:w-1/3">
                    <input 
                      type="email" 
                      value={supportEmail}
                      onChange={e => setSupportEmail(e.target.value)}
                      className="input-premium w-full bg-black border-neutral-800 text-sm"
                    />
                  </div>
                </div>

              </div>
            </div>

          </div>

          <div className="p-6 border-t border-neutral-800 bg-[#121212] flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-primary py-3 px-8 text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            >
              {isSubmitting ? <LoadingSpinner className="w-5 h-5 border-white" /> : <><i className="las la-save text-lg"></i> Save Changes</>}
            </button>
          </div>
        </div>
      </form>

    </div>
  );
}
