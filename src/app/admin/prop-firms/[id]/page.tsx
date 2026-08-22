"use client";

import { useState, useEffect, useMemo } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import toast from "react-hot-toast";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PropFirmDoc, PropFirmPlan, PropFirmRule } from "@/lib/firebase/schema";
import ConfirmModal from "@/components/ui/ConfirmModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type Tab = "overview" | "programs" | "plans" | "rules" | "verification";

export default function AdminPropFirmDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [firm, setFirm] = useState<PropFirmDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("plans");
  
  // Filtering for Overview
  const [selectedProgram, setSelectedProgram] = useState<string>("all");
  const [selectedSize, setSelectedSize] = useState<number | "all">("all");
  const [selectedPhase, setSelectedPhase] = useState<string>("all");

  // Forms State
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [newPlan, setNewPlan] = useState<Partial<PropFirmPlan>>({ 
    name: "", program_id: "", program_name: "", account_size: 10000, daily_loss_limit_pct: 5, max_drawdown_pct: 10, phase_id: "", phase_name: "",
    drawdown_type: "static", daily_drawdown_type: "balance", purchase_price: 0, rule_version_id: "v1"
  });

  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [newRule, setNewRule] = useState<Partial<PropFirmRule>>({ 
    title: "", description: "", is_hidden: false, verification_status: "needs_review", source_url: "",
    applicable_program_ids: null, applicable_phase_ids: null, applicable_plan_ids: null
  });

  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, id: string, type: "plan" | "rule"}>({isOpen: false, id: "", type: "plan"});

  useEffect(() => {
    if (id) fetchFirm();
  }, [id]);

  const fetchFirm = async () => {
    try {
      const snap = await getDoc(doc(db, "prop_firms", id));
      if (snap.exists()) {
        setFirm({ ...snap.data(), plans: snap.data().plans || [], rules: snap.data().rules || [] } as PropFirmDoc);
      } else {
        toast.error("Prop firm not found");
        router.push("/admin/prop-firms");
      }
    } catch (error) {
      console.error("Failed to load firm:", error);
      toast.error("Failed to load prop firm");
    } finally {
      setLoading(false);
    }
  };

  const saveUpdates = async (updatedFirm: PropFirmDoc) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "prop_firms", firm!.id), {
        plans: updatedFirm.plans,
        rules: updatedFirm.rules
      });
      setFirm(updatedFirm);
      toast.success("Saved successfully");
    } catch (error) {
      console.error("Error saving updates:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.name || !newPlan.account_size) return;

    const plan: PropFirmPlan = {
      id: crypto.randomUUID(),
      name: newPlan.name || "",
      program_id: newPlan.program_id || "",
      program_name: newPlan.program_name || "",
      account_size: Number(newPlan.account_size),
      daily_loss_limit_pct: Number(newPlan.daily_loss_limit_pct),
      max_drawdown_pct: Number(newPlan.max_drawdown_pct),
      phase_id: newPlan.phase_id || null,
      phase_name: newPlan.phase_name || null,
      drawdown_type: newPlan.drawdown_type || 'static',
      daily_drawdown_type: newPlan.daily_drawdown_type || 'balance',
      purchase_price: Number(newPlan.purchase_price) || 0,
      rule_version_id: newPlan.rule_version_id || 'v1'
    };

    saveUpdates({ ...firm!, plans: [...firm!.plans, plan] });
    setIsAddPlanOpen(false);
    setNewPlan({ 
      name: "", program_id: "", program_name: "", account_size: 10000, daily_loss_limit_pct: 5, max_drawdown_pct: 10, phase_id: "", phase_name: "",
      drawdown_type: "static", daily_drawdown_type: "balance", purchase_price: 0, rule_version_id: "v1"
    });
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.title || !newRule.description) return;

    const rule: PropFirmRule = {
      id: crypto.randomUUID(),
      title: newRule.title,
      description: newRule.description,
      applicable_program_ids: newRule.applicable_program_ids?.length ? newRule.applicable_program_ids : null,
      applicable_phase_ids: newRule.applicable_phase_ids?.length ? newRule.applicable_phase_ids : null,
      applicable_plan_ids: newRule.applicable_plan_ids?.length ? newRule.applicable_plan_ids : null,
      is_hidden: newRule.is_hidden || false,
      source_url: newRule.source_url || "",
      verification_status: newRule.verification_status || "needs_review",
      last_verified_at: new Date().toISOString()
    };

    saveUpdates({ ...firm!, rules: [...firm!.rules, rule] });
    setIsAddRuleOpen(false);
    setNewRule({ title: "", description: "", is_hidden: false, verification_status: "needs_review", source_url: "", applicable_program_ids: null, applicable_phase_ids: null, applicable_plan_ids: null });
  };

  const handleDelete = () => {
    if (confirmModal.type === "plan") {
      saveUpdates({ ...firm!, plans: firm!.plans.filter(p => p.id !== confirmModal.id) });
    } else {
      saveUpdates({ ...firm!, rules: firm!.rules.filter(r => r.id !== confirmModal.id) });
    }
    setConfirmModal({ isOpen: false, id: "", type: "plan" });
  };

  const uniquePrograms = useMemo(() => {
    if (!firm) return [];
    const map = new Map<string, {id: string, name: string}>();
    firm.plans.forEach(p => {
      if (p.program_id) map.set(p.program_id, {id: p.program_id, name: p.program_name || p.program_id});
    });
    return Array.from(map.values());
  }, [firm]);

  const uniqueSizesForProgram = useMemo(() => {
    if (!firm || selectedProgram === "all") return [];
    return Array.from(new Set(firm.plans.filter(p => p.program_id === selectedProgram).map(p => p.account_size))).sort((a,b)=>a-b);
  }, [firm, selectedProgram]);

  const uniquePhasesForSize = useMemo(() => {
    if (!firm || selectedProgram === "all" || selectedSize === "all") return [];
    const map = new Map<string, {id: string, name: string}>();
    firm.plans.filter(p => p.program_id === selectedProgram && p.account_size === selectedSize).forEach(p => {
      if (p.phase_id) map.set(p.phase_id, {id: p.phase_id, name: p.phase_name || p.phase_id});
    });
    return Array.from(map.values());
  }, [firm, selectedProgram, selectedSize]);

  const selectedPlan = useMemo(() => {
    if (!firm || selectedProgram === "all" || selectedSize === "all" || selectedPhase === "all") return null;
    return firm.plans.find(p => p.program_id === selectedProgram && p.account_size === selectedSize && p.phase_id === selectedPhase) || null;
  }, [firm, selectedProgram, selectedSize, selectedPhase]);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === "overview") {
      setSelectedProgram("all");
      setSelectedSize("all");
      setSelectedPhase("all");
    }
  };

  if (loading) return <div className="p-8 text-center min-h-[60vh] flex items-center justify-center"><LoadingSpinner className="w-10 h-10" /></div>;
  if (!firm) return null;

  return (
    <div className="animate-in fade-in max-w-7xl mx-auto pb-12 space-y-6 font-sans">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-subtle pb-6">
        <div>
          <Link href="/admin/prop-firms" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-primary transition-colors mb-3 uppercase tracking-widest">
            <i className="las la-arrow-left"></i> Prop Firms
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-primary tracking-tight">{firm.name}</h1>
            <Badge variant={firm.is_active ? 'success' : 'neutral'} size="sm" className="uppercase">
              {firm.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-sm text-secondary mt-1">
            Configure programs, account plans and trading rules.
          </p>
          <div className="text-xs font-bold text-muted mt-2 flex items-center gap-3 uppercase tracking-widest">
            <span>{firm.plans.length} plans</span>
            <span>·</span>
            <span>{firm.rules.length} rules</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary"
            onClick={() => setIsAddPlanOpen(true)}
            leftIcon={<i className="las la-plus"></i>}
          >
            Add Plan
          </Button>
          <Button 
            variant="primary"
            onClick={() => setIsAddRuleOpen(true)}
            leftIcon={<i className="las la-plus"></i>}
          >
            Add Rule
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-6 border-b border-subtle overflow-x-auto no-scrollbar">
        {(["overview", "programs", "plans", "rules", "verification"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className={`whitespace-nowrap pb-3 text-sm font-bold uppercase tracking-widest transition-colors relative ${
              activeTab === tab 
                ? "text-info" 
                : "text-muted hover:text-primary"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-info rounded-t-full"></div>
            )}
          </button>
        ))}
      </div>

      <div className="pt-4">
        
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">1. Select Program</h3>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => { setSelectedProgram("all"); setSelectedSize("all"); setSelectedPhase("all"); }}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all border ${selectedProgram === "all" ? "bg-[var(--text-primary)] text-[var(--bg-base)] border-[var(--text-primary)]" : "bg-elevated text-secondary border-default hover:border-strong"}`}
                  >
                    All Programs
                  </button>
                  {uniquePrograms.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => { setSelectedProgram(p.id); setSelectedSize("all"); setSelectedPhase("all"); }}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all border ${selectedProgram === p.id ? "bg-[var(--text-primary)] text-[var(--bg-base)] border-[var(--text-primary)]" : "bg-elevated text-secondary border-default hover:border-strong"}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {selectedProgram !== "all" && uniqueSizesForProgram.length > 0 && (
                <div className="animate-in slide-in-from-top-2 fade-in">
                  <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">2. Select Account Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {uniqueSizesForProgram.map(s => (
                      <button 
                        key={s}
                        onClick={() => { setSelectedSize(s); setSelectedPhase("all"); }}
                        className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all border ${selectedSize === s ? "bg-[var(--text-primary)] text-[var(--bg-base)] border-[var(--text-primary)]" : "bg-elevated text-secondary border-default hover:border-strong"}`}
                      >
                        ${s.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedSize !== "all" && uniquePhasesForSize.length > 0 && (
                <div className="animate-in slide-in-from-top-2 fade-in">
                  <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">3. Select Phase</h3>
                  <div className="flex flex-wrap gap-2">
                    {uniquePhasesForSize.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => setSelectedPhase(p.id)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all border ${selectedPhase === p.id ? "bg-[var(--text-primary)] text-[var(--bg-base)] border-[var(--text-primary)]" : "bg-elevated text-secondary border-default hover:border-strong"}`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedPlan ? (
              <Card className="overflow-hidden p-0 animate-in fade-in border-default">
                <div className="p-4 border-b border-subtle bg-elevated flex items-center justify-between">
                  <h3 className="font-bold text-primary">
                    {selectedPlan.program_name} · ${selectedPlan.account_size.toLocaleString()} · {selectedPlan.phase_name}
                  </h3>
                  <span className="text-xs font-bold text-muted uppercase tracking-widest">ID: {selectedPlan.id}</span>
                </div>
                
                <div className="p-6 bg-surface">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    
                    <div>
                      <h4 className="text-xs font-bold text-secondary border-b border-subtle pb-2 mb-4 uppercase tracking-widest">Risk Limits</h4>
                      <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-secondary font-medium">Daily Loss</dt>
                          <dd className="font-bold text-primary">{selectedPlan.daily_loss_limit_pct}%</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-secondary font-medium">Daily Calculation</dt>
                          <dd className="font-bold text-primary capitalize">{selectedPlan.daily_drawdown_type}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-secondary font-medium">Maximum Drawdown</dt>
                          <dd className="font-bold text-primary">{selectedPlan.max_drawdown_pct}%</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-secondary font-medium">Drawdown Type</dt>
                          <dd className="font-bold text-primary capitalize">{selectedPlan.drawdown_type}</dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-secondary border-b border-subtle pb-2 mb-4 uppercase tracking-widest">Trading Rules</h4>
                      <dl className="space-y-3 text-sm">
                        {firm.rules.map(rule => {
                          const applies = (!rule.applicable_program_ids || rule.applicable_program_ids.includes(selectedPlan.program_id)) &&
                                          (!rule.applicable_phase_ids || rule.applicable_phase_ids.includes(selectedPlan.phase_id || "")) &&
                                          (!rule.applicable_plan_ids || rule.applicable_plan_ids.includes(selectedPlan.id));
                          
                          if (!applies) return null;

                          return (
                            <div key={rule.id} className="flex justify-between gap-4">
                              <dt className="text-secondary font-medium shrink-0">{rule.title}</dt>
                              <dd className="font-bold text-primary text-right text-xs bg-elevated border border-default px-2 py-0.5 rounded">{rule.description}</dd>
                            </div>
                          );
                        })}
                      </dl>
                    </div>

                  </div>
                </div>
              </Card>
            ) : selectedProgram !== "all" ? (
              <div className="p-12 text-center text-muted font-bold border border-subtle rounded-2xl border-dashed bg-elevated">
                Select a size and phase to view account details.
              </div>
            ) : (
              <div className="p-12 text-center text-muted font-bold border border-subtle rounded-2xl border-dashed bg-elevated">
                Select a program to begin exploring rules and limits.
              </div>
            )}
          </div>
        )}

        {activeTab === "plans" && (
          <Card className="overflow-hidden p-0 border-default">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface text-muted border-b border-subtle">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Program</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Size</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Phase</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Daily Loss</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Max DD</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Type</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle bg-surface">
                  {firm.plans.map(plan => (
                    <tr key={plan.id} className="hover:bg-elevated transition-colors">
                      <td className="px-6 py-4 font-bold text-primary">{plan.program_name}</td>
                      <td className="px-6 py-4 font-medium text-secondary">${plan.account_size.toLocaleString()}</td>
                      <td className="px-6 py-4 font-medium text-secondary">{plan.phase_name || "-"}</td>
                      <td className="px-6 py-4 font-medium text-secondary">{plan.daily_loss_limit_pct}%</td>
                      <td className="px-6 py-4 font-medium text-secondary">{plan.max_drawdown_pct}%</td>
                      <td className="px-6 py-4 font-medium text-secondary capitalize">{plan.drawdown_type}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setConfirmModal({ isOpen: true, id: plan.id, type: "plan" })}
                          className="text-muted hover:text-danger hover:bg-danger-bg font-medium w-8 h-8 rounded-lg inline-flex items-center justify-center transition-colors"
                        >
                          <i className="las la-trash-alt text-lg"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {firm.plans.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted font-bold">No account plans found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === "rules" && (
          <Card className="overflow-hidden p-0 border-default">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface text-muted border-b border-subtle">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Title</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Description</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Target Programs</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle bg-surface">
                  {firm.rules.map(rule => (
                    <tr key={rule.id} className="hover:bg-elevated transition-colors">
                      <td className="px-6 py-4 font-bold text-primary whitespace-nowrap">{rule.title}</td>
                      <td className="px-6 py-4 font-medium text-secondary max-w-xs truncate" title={rule.description}>{rule.description}</td>
                      <td className="px-6 py-4 font-medium text-secondary">
                        {rule.applicable_program_ids ? (
                          <div className="flex gap-1 flex-wrap">
                            {rule.applicable_program_ids.map(pid => (
                              <Badge key={pid} variant="neutral" size="sm" className="uppercase">{pid.split('-').pop()}</Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted font-bold uppercase tracking-widest">All</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setConfirmModal({ isOpen: true, id: rule.id, type: "rule" })}
                          className="text-muted hover:text-danger hover:bg-danger-bg font-medium w-8 h-8 rounded-lg inline-flex items-center justify-center transition-colors"
                        >
                          <i className="las la-trash-alt text-lg"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {firm.rules.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted font-bold">No trading rules found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === "verification" && (
          <Card className="border-default bg-surface">
            <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Rule Verification Status</h3>
            <div className="space-y-4">
              {firm.rules.map(rule => (
                <div key={rule.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-default rounded-xl bg-elevated">
                  <div>
                    <h4 className="font-bold text-primary">{rule.title}</h4>
                    {rule.source_url ? (
                      <a href={rule.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-info hover:underline flex items-center gap-1 mt-1 font-bold">
                        <i className="las la-external-link-alt"></i> {rule.source_url}
                      </a>
                    ) : (
                      <span className="text-xs text-muted font-medium mt-1 block">No source URL provided</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={
                        rule.verification_status === 'verified' ? 'success' : 
                        rule.verification_status === 'outdated' ? 'danger' : 'warning'
                      } 
                      size="sm"
                      className="uppercase"
                    >
                      {rule.verification_status?.replace('_', ' ').toUpperCase() || 'NEEDS REVIEW'}
                    </Badge>
                    {rule.last_verified_at && (
                      <span className="text-[10px] text-muted font-bold uppercase tracking-wider">
                        {new Date(rule.last_verified_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

      </div>

      {isAddPlanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] p-0">
            <div className="p-5 border-b border-subtle flex justify-between items-center bg-elevated">
              <h2 className="text-lg font-bold text-primary">Add Account Plan</h2>
              <button onClick={() => setIsAddPlanOpen(false)} className="text-muted hover:text-primary transition-colors">
                <i className="las la-times text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleAddPlan} className="p-5 overflow-y-auto bg-surface">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Plan Display Name *</label>
                  <Input value={newPlan.name} onChange={(e) => setNewPlan({...newPlan, name: e.target.value})} required placeholder="e.g. $10K 2-Step Phase 1" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Program ID</label>
                  <Input value={newPlan.program_id} onChange={(e) => setNewPlan({...newPlan, program_id: e.target.value})} placeholder="e.g. 2step" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Program Name</label>
                  <Input value={newPlan.program_name} onChange={(e) => setNewPlan({...newPlan, program_name: e.target.value})} placeholder="e.g. 2-Step Evaluation" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Phase ID</label>
                  <Input value={newPlan.phase_id || ""} onChange={(e) => setNewPlan({...newPlan, phase_id: e.target.value})} placeholder="e.g. phase1" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Phase Name</label>
                  <Input value={newPlan.phase_name || ""} onChange={(e) => setNewPlan({...newPlan, phase_name: e.target.value})} placeholder="e.g. Phase 1" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Account Size ($) *</label>
                  <Input type="number" value={newPlan.account_size} onChange={(e) => setNewPlan({...newPlan, account_size: Number(e.target.value)})} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Purchase Price ($)</label>
                  <Input type="number" value={newPlan.purchase_price} onChange={(e) => setNewPlan({...newPlan, purchase_price: Number(e.target.value)})} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Daily Loss Limit (%)</label>
                  <Input type="number" step="0.1" value={newPlan.daily_loss_limit_pct} onChange={(e) => setNewPlan({...newPlan, daily_loss_limit_pct: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Daily DD Type</label>
                  <Select 
                    options={[
                      {value: "balance", label: "Balance Based"},
                      {value: "equity", label: "Equity Based"}
                    ]}
                    value={newPlan.daily_drawdown_type} 
                    onChange={(e) => setNewPlan({...newPlan, daily_drawdown_type: e.target.value as "balance"|"equity"})} 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Max Drawdown (%)</label>
                  <Input type="number" step="0.1" value={newPlan.max_drawdown_pct} onChange={(e) => setNewPlan({...newPlan, max_drawdown_pct: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Drawdown Type</label>
                  <Select 
                    options={[
                      {value: "static", label: "Static"},
                      {value: "trailing", label: "Trailing"},
                      {value: "trailing_watermark", label: "Trailing Watermark"},
                      {value: "eod", label: "End of Day"}
                    ]}
                    value={newPlan.drawdown_type} 
                    onChange={(e) => setNewPlan({...newPlan, drawdown_type: e.target.value as "static"|"trailing"|"trailing_watermark"|"eod"})} 
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-subtle">
                <Button type="button" variant="outline" onClick={() => setIsAddPlanOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={saving}>Save Plan</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {isAddRuleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] p-0">
            <div className="p-5 border-b border-subtle flex justify-between items-center bg-elevated">
              <h2 className="text-lg font-bold text-primary">Add Trading Rule</h2>
              <button onClick={() => setIsAddRuleOpen(false)} className="text-muted hover:text-primary transition-colors">
                <i className="las la-times text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleAddRule} className="p-5 overflow-y-auto bg-surface">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Rule Title *</label>
                  <Input value={newRule.title} onChange={(e) => setNewRule({...newRule, title: e.target.value})} required placeholder="e.g. News Trading, Max Drawdown" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Description *</label>
                  <textarea value={newRule.description} onChange={(e) => setNewRule({...newRule, description: e.target.value})} className="w-full bg-surface border border-default rounded-lg px-3 py-2 text-sm font-medium text-primary focus:outline-none focus:border-strong focus:ring-1 focus:ring-strong h-24 resize-none transition-all" required placeholder="Explain the rule in detail..." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Applicable Programs</label>
                    <Input value={newRule.applicable_program_ids?.join(", ") || ""} onChange={(e) => setNewRule({...newRule, applicable_program_ids: e.target.value ? e.target.value.split(',').map(s=>s.trim()) : null})} placeholder="comma separated, empty for all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Applicable Phases</label>
                    <Input value={newRule.applicable_phase_ids?.join(", ") || ""} onChange={(e) => setNewRule({...newRule, applicable_phase_ids: e.target.value ? e.target.value.split(',').map(s=>s.trim()) : null})} placeholder="comma separated, empty for all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Source URL</label>
                    <Input type="url" value={newRule.source_url} onChange={(e) => setNewRule({...newRule, source_url: e.target.value})} placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Verification Status</label>
                    <Select 
                      options={[
                        {value: "needs_review", label: "Needs Review"},
                        {value: "verified", label: "Verified"},
                        {value: "outdated", label: "Outdated"}
                      ]}
                      value={newRule.verification_status} 
                      onChange={(e) => setNewRule({...newRule, verification_status: e.target.value as any})} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-subtle">
                <Button type="button" variant="outline" onClick={() => setIsAddRuleOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={saving}>Save Rule</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={`Delete ${confirmModal.type === 'plan' ? 'Account Plan' : 'Rule'}`}
        message="Are you sure you want to delete this? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmModal({ isOpen: false, id: "", type: "plan" })}
        isDanger={true}
      />
    </div>
  );
}
