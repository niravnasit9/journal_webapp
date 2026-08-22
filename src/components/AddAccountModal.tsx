"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useTierTheme } from "@/hooks/useTierTheme";
import CustomSelect from "@/components/ui/CustomSelect";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/authContext";
import { PropFirmDoc } from "@/lib/firebase/schema";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddAccountModal({ isOpen, onClose, onAdded }: AddAccountModalProps) {
  const { user } = useAuth();
  const theme = useTierTheme();
  const [loading, setLoading] = useState(false);

  const [label, setLabel] = useState("");
  const [broker, setBroker] = useState("");
  const [accountType, setAccountType] = useState("Real");
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  const [initialBalance, setInitialBalance] = useState("");
  const [selectedFirm, setSelectedFirm] = useState("none");
  const [selectedProgramId, setSelectedProgramId] = useState<string>("none");
  const [selectedSize, setSelectedSize] = useState<string>("none");
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>("none");

  const [availableTypes, setAvailableTypes] = useState<string[]>(["Real", "Funded", "Demo"]);
  const [propFirms, setPropFirms] = useState<PropFirmDoc[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      try {
        const firmsSnap = await getDocs(query(collection(db, "prop_firms"), where("is_active", "==", true)));
        const firms = firmsSnap.docs.map(d => ({ ...d.data(), id: d.id } as PropFirmDoc));
        firms.sort((a, b) => {
          if (a.is_popular !== b.is_popular) return a.is_popular ? -1 : 1;
          return (a.display_order || 0) - (b.display_order || 0);
        });
        setPropFirms(firms);
      } catch (e) {
        console.error("Error fetching data:", e);
      }
    };
    fetchData();
  }, [isOpen]);

  useEffect(() => {
    if (selectedFirm !== "none") {
      setSelectedProgramId("none");
      setSelectedSize("none");
      setSelectedPhaseId("none");
    } else {
      setSelectedProgramId("none");
      setSelectedSize("none");
      setSelectedPhaseId("none");
    }
  }, [selectedFirm]);

  useEffect(() => {
    if (selectedProgramId !== "none") {
      setSelectedSize("none");
      setSelectedPhaseId("none");
    }
  }, [selectedProgramId]);

  useEffect(() => {
    if (selectedSize !== "none") {
      setSelectedPhaseId("none");
    }
  }, [selectedSize]);

  const activeFirm = propFirms.find(f => f.name === selectedFirm);
  const activePlans = activeFirm?.plans || [];
  
  const uniquePrograms = Array.from(new Map(activePlans.map(p => [p.program_id, { id: p.program_id, name: p.program_name }])).values());
  const programPlans = activePlans.filter(p => p.program_id === selectedProgramId);
  const uniqueSizes = Array.from(new Set(programPlans.map(p => p.account_size))).sort((a,b)=>a-b);
  const sizePlans = programPlans.filter(p => p.account_size.toString() === selectedSize);
  const uniquePhases = Array.from(new Map(sizePlans.map(p => [p.phase_id, { id: p.phase_id, name: p.phase_name }])).values());
  const selectedPlanObj = sizePlans.find(p => p.phase_id === selectedPhaseId);

  useEffect(() => {
    if (selectedSize !== "none") {
      setInitialBalance(selectedSize);
    }
  }, [selectedSize]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!label.trim()) { toast.error("Account name is required"); return; }
    if (!initialBalance || isNaN(Number(initialBalance))) { toast.error("Enter a valid starting balance"); return; }
    
    setLoading(true);
    try {
      const { createManualAccountAction } = await import("@/app/actions/accountActions");
      
      const res = await createManualAccountAction(user.uid, {
        label: label.trim(),
        broker: broker.trim() || "Manual",
        account_type: accountType,
        currency,
        initial_balance: Number(initialBalance),
        prop_firm: activeFirm?.name,
        prop_plan_name: selectedPlanObj?.program_name || selectedPlanObj?.name,
        prop_plan_phase: selectedPlanObj?.phase_name || undefined,
        rule_version_id: selectedPlanObj?.rule_version_id,
        drawdown_type: selectedPlanObj?.drawdown_type,
        daily_drawdown_type: selectedPlanObj?.daily_drawdown_type,
        daily_loss_limit_pct: selectedPlanObj?.daily_loss_limit_pct,
        max_drawdown_pct: selectedPlanObj?.max_drawdown_pct,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to create account");
        return;
      }

      toast.success("Account created successfully!");
      setLabel(""); setBroker(""); setInitialBalance(""); setSelectedFirm("none");
      onAdded();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#fafafa] dark:bg-[#0a0f1c]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-yellow-300 dark:border-slate-700 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b border-yellow-200 dark:border-slate-800 bg-gray-50 dark:bg-[#0f1523]">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
            <i className="las la-plus-circle text-2xl text-blue-500"></i> Add Account
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <i className="las la-times text-2xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest pl-1 mb-2">Account Name</label>
            <input
              required type="text" placeholder="e.g. Main Funded $50k"
              value={label} onChange={e => setLabel(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#16181d] border border-gray-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest pl-1 mb-2">Broker / Platform</label>
            <input
              type="text" placeholder="e.g. Exness, FTMO, GoatFunded"
              value={broker} onChange={e => setBroker(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#16181d] border border-gray-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest pl-1 mb-2">Account Type</label>
              <CustomSelect
                options={availableTypes.map(t => ({ value: t, label: t }))}
                value={accountType}
                onChange={setAccountType}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest pl-1 mb-2">Currency</label>
              <CustomSelect
                options={[{ value: "USD", label: "USD ($)" }, { value: "INR", label: "INR (₹)" }]}
                value={currency}
                onChange={val => setCurrency(val as "USD" | "INR")}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest pl-1 mb-2">Starting Balance</label>
            <input
              required type="number" step="any" placeholder="5000"
              value={initialBalance} onChange={e => setInitialBalance(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#16181d] border border-gray-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest pl-1 mb-2">
              Prop Firm Challenge Tracker
              <span className="ml-2 text-purple-500 font-bold normal-case">(Optional)</span>
            </label>
            <CustomSelect
              options={[
                { value: "none", label: "None — Standard Account" },
                ...propFirms.map(f => ({ value: f.name, label: f.name }))
              ]}
              value={selectedFirm}
              onChange={setSelectedFirm}
            />
            {selectedFirm !== "none" && (
              <div className="mt-3">
                <CustomSelect
                  options={[
                    { value: "none", label: "Select a Program..." },
                    ...uniquePrograms.map(p => ({
                      value: p.id,
                      label: p.name
                    }))
                  ]}
                  value={selectedProgramId}
                  onChange={setSelectedProgramId}
                />
              </div>
            )}
            
            {selectedProgramId !== "none" && (
              <div className="mt-3">
                <CustomSelect
                  options={[
                    { value: "none", label: "Select Account Size..." },
                    ...uniqueSizes.map(s => ({
                      value: s.toString(),
                      label: `$${s.toLocaleString()}`
                    }))
                  ]}
                  value={selectedSize}
                  onChange={setSelectedSize}
                />
              </div>
            )}

            {selectedSize !== "none" && uniquePhases.length > 0 && (
              <div className="mt-3">
                <CustomSelect
                  options={[
                    { value: "none", label: "Select Phase (if applicable)..." },
                    ...uniquePhases.map(p => ({
                      value: p.id || "funded",
                      label: p.name || "Evaluation"
                    }))
                  ]}
                  value={selectedPhaseId}
                  onChange={setSelectedPhaseId}
                />
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
                    <i className="las la-list-alt text-purple-500"></i>
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

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-300 font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading} className={`flex-1 px-4 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 ${theme.buttonPrimary} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {loading ? <i className="las la-spinner la-spin text-xl"></i> : <i className="las la-plus text-xl"></i>}
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
