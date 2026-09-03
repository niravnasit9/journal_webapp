import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useTierTheme } from "@/hooks/useTierTheme";
import { AccountDoc, PropFirmDoc } from "@/lib/firebase/schema";
import { doc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: AccountDoc | null;
  onUpdated: () => void;
}

export default function EditAccountModal({ isOpen, onClose, account, onUpdated }: EditAccountModalProps) {
  const [loading, setLoading] = useState(false);
  const theme = useTierTheme();
  const [propFirms, setPropFirms] = useState<PropFirmDoc[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("none");
  const [selectedSize, setSelectedSize] = useState<string>("none");
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>("none");

  const [formData, setFormData] = useState({
    label: "",
    prop_firm: "",
    account_type: "Real",
    market_type: "GLOBAL" as "GLOBAL" | "DOMESTIC",
    currency: "USD" as "USD" | "INR"
  });

  useEffect(() => {
    if (account) {
      setFormData({
        label: account.label,
        prop_firm: account.prop_firm || "",
        account_type: account.account_type || "Real",
        market_type: account.market_type || "GLOBAL",
        currency: account.currency || "USD"
      });
      
      if (account.prop_firm && account.prop_plan_name && propFirms.length > 0) {
        const firm = propFirms.find(f => f.name === account.prop_firm);
        const plan = firm?.plans?.find(p => (p.program_name || p.name) === account.prop_plan_name && p.phase_name === (account.prop_plan_phase || undefined) && p.account_size === account.initial_balance);
        if (plan) {
          setSelectedProgramId(plan.program_id);
          setSelectedSize(plan.account_size.toString());
          setSelectedPhaseId(plan.phase_id || "none");
        }
      }
    }
  }, [account, propFirms]);

  useEffect(() => {
    const fetchFirms = async () => {
      try {
        const snap = await getDocs(query(collection(db, "prop_firms"), where("is_active", "==", true)));
        const firms = snap.docs.map(d => ({ ...d.data(), id: d.id } as PropFirmDoc));
        firms.sort((a, b) => {
          if (a.is_popular !== b.is_popular) return a.is_popular ? -1 : 1;
          return (a.display_order || 0) - (b.display_order || 0);
        });
        setPropFirms(firms);
      } catch (e) {
        console.error("Error fetching prop firms:", e);
      }
    };
    if (isOpen) fetchFirms();
  }, [isOpen]);

  // Reset selections when firm changes manually by the user
  useEffect(() => {
    if (formData.prop_firm && account && formData.prop_firm !== account.prop_firm) {
      setSelectedProgramId("none");
      setSelectedSize("none");
      setSelectedPhaseId("none");
    }
  }, [formData.prop_firm, account]);

  // Handle market type changes
  useEffect(() => {
    if (formData.market_type === "DOMESTIC") {
      setFormData(prev => ({
        ...prev,
        currency: "INR",
        prop_firm: ""
      }));
    }
  }, [formData.market_type]);

  useEffect(() => {
    if (selectedProgramId !== "none" && (!account || (account && selectedProgramId !== account.prop_plan_name))) {
      setSelectedSize("none");
      setSelectedPhaseId("none");
    }
  }, [selectedProgramId, account]);

  useEffect(() => {
    if (selectedSize !== "none" && (!account || (account && selectedSize !== account.initial_balance?.toString()))) {
      setSelectedPhaseId("none");
    }
  }, [selectedSize, account]);

  const activeFirm = propFirms.find(f => f.name === formData.prop_firm);
  const activePlans = activeFirm?.plans || [];
  
  const uniquePrograms = Array.from(new Map(activePlans.map(p => [p.program_id, { id: p.program_id, name: p.program_name }])).values());
  const programPlans = activePlans.filter(p => p.program_id === selectedProgramId);
  const uniqueSizes = Array.from(new Set(programPlans.map(p => p.account_size))).sort((a,b)=>a-b);
  const sizePlans = programPlans.filter(p => p.account_size.toString() === selectedSize);
  const uniquePhases = Array.from(new Map(sizePlans.map(p => [p.phase_id, { id: p.phase_id, name: p.phase_name }])).values());
  const selectedPlanObj = sizePlans.find(p => p.phase_id === selectedPhaseId);

  if (!isOpen || !account) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label.trim()) {
      toast.error("Account name is required");
      return;
    }

    setLoading(true);
    try {
      const accRef = doc(db, "accounts", account.id!);
      
      let updateData: Partial<AccountDoc> = {
        label: formData.label.trim(),
        account_type: formData.account_type,
        market_type: formData.market_type,
        currency: formData.currency
      };

      if (formData.prop_firm && selectedPlanObj) {
        const plan = selectedPlanObj;
        
        if (activeFirm && plan) {
          updateData.prop_firm = activeFirm.name;
          updateData.prop_plan_name = plan.program_name || plan.name;
          updateData.prop_plan_phase = plan.phase_name || undefined;
          updateData.rule_version_id = plan.rule_version_id;
          updateData.drawdown_type = plan.drawdown_type;
          updateData.daily_drawdown_type = plan.daily_drawdown_type;
          updateData.daily_loss_limit_pct = plan.daily_loss_limit_pct;
          updateData.max_drawdown_pct = plan.max_drawdown_pct;
        }
      } else if (!formData.prop_firm) {
        updateData.prop_firm = "";
        updateData.prop_plan_name = "";
        updateData.prop_plan_phase = "";
        updateData.rule_version_id = "";
        updateData.drawdown_type = "";
        updateData.daily_drawdown_type = "";
        updateData.daily_loss_limit_pct = 5;
        updateData.max_drawdown_pct = 10;
      }

      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined)
      );

      await updateDoc(accRef, cleanUpdateData);
      
      toast.success("Account updated successfully");
      onUpdated();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to update account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#fafafa] dark:bg-[#0a0f1c]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-yellow-300 dark:border-slate-700 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-5 border-b border-yellow-200 dark:border-slate-800 bg-gray-50 dark:bg-[#0f1523]">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
            <i className="las la-pen text-2xl text-blue-500"></i> Edit Account
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <i className="las la-times text-2xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest pl-1">
              Account Name
            </label>
            <input 
              required type="text"
              value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})}
              className="w-full bg-gray-50 dark:bg-[#16181d] border border-gray-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest pl-1">
                Account Type
              </label>
              <select 
                value={formData.account_type} 
                onChange={e => setFormData({...formData, account_type: e.target.value})}
                className="w-full bg-gray-50 dark:bg-[#16181d] border border-gray-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold appearance-none"
              >
                <option value="Real">Real</option>
                {formData.market_type === "GLOBAL" && <option value="Funded">Funded</option>}
                <option value="Demo">Demo</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest pl-1">
                Market Type
              </label>
              <select 
                value={formData.market_type} 
                onChange={e => setFormData({...formData, market_type: e.target.value as "GLOBAL" | "DOMESTIC"})}
                className="w-full bg-gray-50 dark:bg-[#16181d] border border-gray-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold appearance-none"
              >
                <option value="GLOBAL">Global</option>
                <option value="DOMESTIC">Domestic</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest pl-1">
                Currency
              </label>
              <select 
                value={formData.currency} 
                onChange={e => setFormData({...formData, currency: e.target.value as "USD" | "INR"})}
                className="w-full bg-gray-50 dark:bg-[#16181d] border border-gray-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold appearance-none"
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>

          {formData.market_type === "GLOBAL" && (
          <div className="space-y-2">
            <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest pl-1">
              Prop Firm Tracker
            </label>
            <select 
              value={formData.prop_firm} 
              onChange={e => setFormData({...formData, prop_firm: e.target.value})}
              className="w-full bg-gray-50 dark:bg-[#16181d] border border-gray-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold appearance-none mb-3"
            >
              <option value="">None (Standard Account)</option>
              {propFirms.map((firm: PropFirmDoc) => (
                <option key={firm.id} value={firm.name}>{firm.name}</option>
              ))}
            </select>
            
            {formData.prop_firm && (
              <div className="mt-3">
                <select
                  value={selectedProgramId}
                  onChange={e => setSelectedProgramId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#16181d] border border-gray-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold appearance-none"
                >
                  <option value="none">Select a Program...</option>
                  {uniquePrograms.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {selectedProgramId !== "none" && (
              <div className="mt-3">
                <select
                  value={selectedSize}
                  onChange={e => setSelectedSize(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#16181d] border border-gray-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold appearance-none"
                >
                  <option value="none">Select Account Size...</option>
                  {uniqueSizes.map(s => (
                    <option key={s} value={s.toString()}>${s.toLocaleString()}</option>
                  ))}
                </select>
              </div>
            )}

            {selectedSize !== "none" && uniquePhases.length > 0 && (
              <div className="mt-3">
                <select
                  value={selectedPhaseId}
                  onChange={e => setSelectedPhaseId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#16181d] border border-gray-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold appearance-none"
                >
                  <option value="none">Select Phase (if applicable)...</option>
                  {uniquePhases.map(p => (
                    <option key={p.id} value={p.id || "funded"}>{p.name || "Evaluation"}</option>
                  ))}
                </select>
              </div>
            )}
            
            {selectedPhaseId !== "none" && selectedPlanObj && (() => {
              const firm = activeFirm;
              const plan = selectedPlanObj;
              if (!firm || !plan) return null;

              // Filter rules
              const applicableRules = (firm.rules || []).filter(rule => {
                if ((!rule.applicable_program_ids || rule.applicable_program_ids.length === 0) &&
                    (!rule.applicable_plan_ids || rule.applicable_plan_ids.length === 0) &&
                    (!rule.applicable_phase_ids || rule.applicable_phase_ids.length === 0)) {
                  return true;
                }
                
                let matchesProgram = true;
                let matchesPhase = true;
                let matchesPlan = true;

                if (rule.applicable_program_ids && rule.applicable_program_ids.length > 0) {
                  matchesProgram = rule.applicable_program_ids.includes(selectedProgramId);
                }
                if (rule.applicable_phase_ids && rule.applicable_phase_ids.length > 0) {
                  matchesPhase = rule.applicable_phase_ids.includes(selectedPhaseId);
                }
                if (rule.applicable_plan_ids && rule.applicable_plan_ids.length > 0) {
                  matchesPlan = rule.applicable_plan_ids.includes(plan.id);
                }
                return matchesProgram && matchesPhase && matchesPlan;
              });

              return (
                <div className="mt-4 border-t border-gray-200 dark:border-white/10 pt-4 animate-in slide-in-from-top-2 duration-300">
                  <h4 className="text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <i className="las la-list-alt text-indigo-500"></i>
                    Account Rules Summary
                  </h4>
                  <div className="bg-[#fafafa] dark:bg-[#0a0f1c] rounded-xl border border-gray-200 dark:border-white/10 p-4 space-y-3 shadow-inner">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-white/5">
                      <span className="text-sm text-gray-500 font-medium">Prop Firm</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                        {firm.name} {firm.is_popular && <i className="las la-star text-yellow-500 text-xs"></i>}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-white/5">
                      <span className="text-sm text-gray-500 font-medium">Account Size</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">${plan.account_size.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-white/5">
                      <span className="text-sm text-gray-500 font-medium">Daily Drawdown</span>
                      <span className="text-sm font-bold text-rose-500">{plan.daily_loss_limit_pct}% <span className="text-[10px] text-gray-400 font-normal">({plan.daily_drawdown_type || 'Balance'})</span></span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-white/5">
                      <span className="text-sm text-gray-500 font-medium">Maximum Drawdown</span>
                      <span className="text-sm font-bold text-rose-500">{plan.max_drawdown_pct}% <span className="text-[10px] text-gray-400 font-normal">({plan.drawdown_type || 'Static'})</span></span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-white/5">
                      <span className="text-sm text-gray-500 font-medium">Phase / Type</span>
                      <span className="text-sm font-bold text-blue-500">{plan.program_name || plan.name} {plan.phase_name ? `- ${plan.phase_name}` : ''}</span>
                    </div>
                    {plan.rule_version_id && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 font-medium">Rule Version</span>
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md tracking-widest">{plan.rule_version_id}</span>
                      </div>
                    )}
                  </div>
                  
                  {applicableRules.length > 0 && (
                    <div className="mt-3 bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-xl p-3 flex gap-3 items-start">
                      <i className="las la-info-circle text-blue-500 text-lg mt-0.5"></i>
                      <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                        This firm has <b>{applicableRules.length} specific rules</b> attached to this phase. They will be actively tracked in your journal dashboard.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          )}

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-300 font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading} className={`flex-1 px-4 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed ' + theme.buttonPrimary : theme.buttonPrimary}`}>
              {loading ? <i className="las la-spinner la-spin text-xl"></i> : <i className="las la-save text-xl"></i>}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
