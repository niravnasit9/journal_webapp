"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/authContext";
import { useTierTheme } from "@/hooks/useTierTheme";
import { PropFirmDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function PropFirmsPage() {
  const { tier } = useAuth();
  const theme = useTierTheme();
  const [firms, setFirms] = useState<PropFirmDoc[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedFirm, setSelectedFirm] = useState<PropFirmDoc | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  
  const isPremium = tier === "pro" || tier === "elite";

  useEffect(() => {
    fetchFirms();
  }, []);

  const fetchFirms = async () => {
    try {
      const q = query(collection(db, "prop_firms"), where("is_active", "==", true));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ ...doc.data() } as PropFirmDoc));
      data.sort((a, b) => (a.display_order || 99) - (b.display_order || 99));
      setFirms(data);
    } catch (error) {
      console.error("Failed to load prop firms:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedProgramId(null);
    setSelectedSize(null);
    setSelectedPhaseId(null);
  }, [selectedFirm]);

  useEffect(() => {
    if (!selectedFirm) return;
    const plans = selectedFirm.plans || [];
    
    if (!selectedProgramId && plans.length > 0) {
      const uniquePrograms = Array.from(new Set(plans.map(p => p.program_id)));
      if (uniquePrograms.length > 0) setSelectedProgramId(uniquePrograms[0] || null);
    }
  }, [selectedFirm, selectedProgramId]);

  useEffect(() => {
    if (!selectedFirm || !selectedProgramId) return;
    const plans = selectedFirm.plans || [];
    const programPlans = plans.filter(p => p.program_id === selectedProgramId);
    
    const uniqueSizes = Array.from(new Set(programPlans.map(p => p.account_size))).sort((a,b)=>a-b);
    if (uniqueSizes.length > 0 && (!selectedSize || !uniqueSizes.includes(selectedSize))) {
      setSelectedSize(uniqueSizes[0]);
    }
  }, [selectedFirm, selectedProgramId, selectedSize]);

  useEffect(() => {
    if (!selectedFirm || !selectedProgramId || !selectedSize) return;
    const plans = selectedFirm.plans || [];
    const sizePlans = plans.filter(p => p.program_id === selectedProgramId && p.account_size === selectedSize);
    
    const uniquePhases = Array.from(new Set(sizePlans.map(p => p.phase_id)));
    if (uniquePhases.length > 0 && (!selectedPhaseId || !uniquePhases.includes(selectedPhaseId))) {
      setSelectedPhaseId(uniquePhases[0] || null);
    }
  }, [selectedFirm, selectedProgramId, selectedSize, selectedPhaseId]);

  if (loading) return <div className="p-12 text-center flex justify-center"><LoadingSpinner className="w-10 h-10" /></div>;

  const allPlans = selectedFirm?.plans || [];
  const uniquePrograms = Array.from(new Map(allPlans.map(p => [p.program_id, { id: p.program_id, name: p.program_name }])).values());
  const programPlans = allPlans.filter(p => p.program_id === selectedProgramId);
  const uniqueSizes = Array.from(new Set(programPlans.map(p => p.account_size))).sort((a,b)=>a-b);
  const sizePlans = programPlans.filter(p => p.account_size === selectedSize);
  const uniquePhases = Array.from(new Map(sizePlans.map(p => [p.phase_id, { id: p.phase_id, name: p.phase_name }])).values());

  const selectedPlan = sizePlans.find(p => p.phase_id === selectedPhaseId);

  const allRules = selectedFirm?.rules || [];
  const applicableRules = allRules.filter(rule => {
    if ((!rule.applicable_program_ids || rule.applicable_program_ids.length === 0) &&
        (!rule.applicable_plan_ids || rule.applicable_plan_ids.length === 0) &&
        (!rule.applicable_phase_ids || rule.applicable_phase_ids.length === 0)) {
      return true;
    }
    
    let matchesProgram = true;
    let matchesPhase = true;
    let matchesPlan = true;

    if (rule.applicable_program_ids && rule.applicable_program_ids.length > 0) {
      matchesProgram = selectedProgramId ? rule.applicable_program_ids.includes(selectedProgramId) : false;
    }
    if (rule.applicable_phase_ids && rule.applicable_phase_ids.length > 0) {
      matchesPhase = selectedPhaseId ? rule.applicable_phase_ids.includes(selectedPhaseId) : false;
    }
    if (rule.applicable_plan_ids && rule.applicable_plan_ids.length > 0) {
      matchesPlan = selectedPlan ? rule.applicable_plan_ids.includes(selectedPlan.id) : false;
    }

    return matchesProgram && matchesPhase && matchesPlan;
  });

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto font-sans">
      {!selectedFirm ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-primary tracking-tight flex items-center gap-3">
                <i className={`las la-building text-4xl ${theme.icon}`}></i>
                Prop Firm Directory
              </h1>
              <p className="text-secondary text-sm mt-1 max-w-2xl">
                Explore rules, plans, and hidden criteria for all supported proprietary trading firms.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {firms.map((firm) => (
              <Card 
                key={firm.id} 
                className="cursor-pointer hover:border-strong transition-all flex flex-col items-center justify-center text-center p-6"
                onClick={() => setSelectedFirm(firm)}
              >
                <div className="w-16 h-16 rounded-2xl bg-elevated border border-default flex items-center justify-center mb-4">
                  <i className={`las la-building text-3xl ${theme.icon}`}></i>
                </div>
                <h2 className="text-lg font-bold text-primary">{firm.name}</h2>
                <div className="mt-2">
                  <Badge variant="info" size="sm">{firm.plans?.length || 0} Plans</Badge>
                </div>
              </Card>
            ))}

            {firms.length === 0 && (
              <div className="col-span-full p-12 text-center border border-dashed border-subtle rounded-2xl bg-elevated">
                <h3 className="text-xl font-bold text-primary mb-2">No Prop Firms Found</h3>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <Button 
            variant="ghost"
            onClick={() => setSelectedFirm(null)}
            leftIcon={<i className="las la-arrow-left"></i>}
          >
            Back to Directory
          </Button>

          <Card className="p-6 md:p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-elevated border border-default flex items-center justify-center shrink-0">
                <i className={`las la-building text-3xl ${theme.icon}`}></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">{selectedFirm.name}</h1>
                <a href={selectedFirm.website_url} target="_blank" rel="noreferrer" className="text-sm text-info hover:underline flex items-center gap-1 mt-1">
                  Visit Website <i className="las la-external-link-alt"></i>
                </a>
              </div>
            </div>

            <div className="space-y-6">
              {uniquePrograms.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">Program / Account Type</h3>
                  <div className="flex flex-wrap gap-2">
                    {uniquePrograms.map(prog => (
                      <button
                        key={prog.id}
                        onClick={() => setSelectedProgramId(prog.id || null)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${selectedProgramId === prog.id ? 'bg-[var(--text-primary)] text-[var(--bg-base)] border-strong' : 'bg-elevated text-secondary border-default hover:border-strong hover:text-primary'}`}
                      >
                        {prog.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {uniqueSizes.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">Account Size</h3>
                  <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
                    {uniqueSizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border shrink-0 ${selectedSize === size ? 'bg-[var(--text-primary)] text-[var(--bg-base)] border-strong' : 'bg-elevated text-secondary border-default hover:border-strong hover:text-primary'}`}
                      >
                        ${size.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {uniquePhases.length > 1 && (
                <div>
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">Phase</h3>
                  <div className="flex flex-wrap gap-2">
                    {uniquePhases.map(phase => (
                      <button
                        key={phase.id}
                        onClick={() => setSelectedPhaseId(phase.id || null)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${selectedPhaseId === phase.id ? 'bg-[var(--text-primary)] text-[var(--bg-base)] border-strong' : 'bg-elevated text-secondary border-default hover:border-strong hover:text-primary'}`}
                      >
                        {phase.name || "Evaluation"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="my-8 h-px w-full bg-subtle"></div>

            {selectedPlan ? (
              <div className="space-y-6 animate-in fade-in">
                <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                  <i className={`las la-clipboard-list text-2xl ${theme.icon}`}></i> Account Rules & Limits
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="p-5 border-default">
                    <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4 border-b border-subtle pb-2">Drawdown & Limits</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-secondary">Daily Loss</span>
                        <span className="font-bold text-danger">{selectedPlan.daily_loss_limit_pct}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-secondary">Max Drawdown</span>
                        <span className="font-bold text-danger">{selectedPlan.max_drawdown_pct}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-secondary">Drawdown Type</span>
                        <span className="text-sm font-semibold text-primary capitalize">{selectedPlan.drawdown_type?.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </Card>

                  {applicableRules.map(rule => {
                    const isLocked = rule.is_hidden && !isPremium;
                    return (
                      <Card key={rule.id} className="p-5 relative overflow-hidden border-default">
                        <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3 border-b border-subtle pb-2 flex items-center gap-2">
                          {rule.title}
                          {rule.is_hidden && (
                            <i className="las la-lock text-info"></i>
                          )}
                        </h3>
                        
                        <div className={isLocked ? 'blur-sm select-none opacity-50' : ''}>
                          <p className="text-sm text-primary leading-relaxed">
                            {isLocked ? "Premium rule description hidden. Upgrade to Pro to view exact firm constraints." : rule.description}
                          </p>
                        </div>
                        
                        {isLocked && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-surface/80 backdrop-blur-sm">
                            <Badge variant="info" size="sm" className="mb-2 uppercase">Premium</Badge>
                            <Link href="/dashboard/settings" className="text-xs font-bold text-primary underline hover:text-info">Upgrade to unlock</Link>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center p-8 bg-elevated rounded-2xl border border-dashed border-subtle">
                <p className="text-secondary">Select an account size and phase to view rules.</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
