"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { PropFirmDoc, AccountDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

interface FirmData extends PropFirmDoc {
  challenges: number;
  funded: number;
  passRate: number;
}

export default function AdminPropFirmsPage() {
  const [loading, setLoading] = useState(true);
  const [firms, setFirms] = useState<FirmData[]>([]);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "delete">("add");
  const [currentFirm, setCurrentFirm] = useState<FirmData | null>(null);

  // Form States
  const [formData, setFormData] = useState({ 
    name: "", 
    description: "", 
    is_active: true, 
    website_url: "",
    slug: "",
    logo_url: "",
    country: "",
    is_popular: false,
    display_order: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFirmsAndStats();
  }, []);

  const fetchFirmsAndStats = async () => {
    try {
      setLoading(true);
      const firmSnap = await getDocs(query(collection(db, "prop_firms")));
      const dbFirms = firmSnap.docs.map(d => ({ ...d.data(), id: d.id } as PropFirmDoc));
      
      const accSnap = await getDocs(query(collection(db, "accounts")));
      const accounts = accSnap.docs.map(d => d.data() as AccountDoc);

      const firmStats = dbFirms.map(firm => {
        const firmAccounts = accounts.filter(a => 
          a.prop_firm === firm.id || 
          (a.label && a.label.toLowerCase().includes(firm.name.toLowerCase()))
        );

        const challenges = firmAccounts.filter(a => !a.account_type?.toUpperCase().includes('FUNDED') && !a.account_type?.toUpperCase().includes('REAL')).length;
        const funded = firmAccounts.filter(a => a.account_type?.toUpperCase().includes('FUNDED')).length;
        const total = challenges + funded;
        const passRate = total > 0 ? Math.round((funded / total) * 100) : 0;

        return {
          ...firm,
          challenges,
          funded,
          passRate
        };
      });

      firmStats.sort((a, b) => b.challenges - a.challenges);
      setFirms(firmStats);
    } catch (error) {
      console.error("Failed to load prop firms:", error);
      toast.error("Failed to load prop firm analytics");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setFormData({ 
      name: "", 
      description: "", 
      is_active: true, 
      website_url: "",
      slug: "",
      logo_url: "",
      country: "",
      is_popular: false,
      display_order: 0 
    });
    setModalMode("add");
    setCurrentFirm(null);
    setIsModalOpen(true);
  };

  const openEdit = (firm: FirmData) => {
    setFormData({ 
      name: firm.name, 
      description: firm.description || "", 
      is_active: firm.is_active,
      website_url: firm.website_url || "",
      slug: firm.slug || "",
      logo_url: firm.logo_url || "",
      country: firm.country || "",
      is_popular: firm.is_popular || false,
      display_order: firm.display_order || 0
    });
    setModalMode("edit");
    setCurrentFirm(firm);
    setIsModalOpen(true);
  };

  const openDelete = (firm: FirmData) => {
    setModalMode("delete");
    setCurrentFirm(firm);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() && modalMode !== "delete") {
      toast.error("Firm name is required");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const baseFirm = {
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active,
        website_url: formData.website_url,
        slug: formData.slug,
        logo_url: formData.logo_url,
        country: formData.country,
        is_popular: formData.is_popular,
        display_order: Number(formData.display_order)
      };

      if (modalMode === "add") {
        const newFirm: Partial<PropFirmDoc> = {
          ...baseFirm,
          created_at: new Date().toISOString(),
          plans: [],
          rules: []
        };
        await addDoc(collection(db, "prop_firms"), newFirm);
        toast.success("Firm created successfully");
      } 
      
      else if (modalMode === "edit" && currentFirm) {
        await updateDoc(doc(db, "prop_firms", currentFirm.id), {
          ...baseFirm,
          updated_at: new Date().toISOString()
        });
        toast.success("Firm updated successfully");
      }
      
      else if (modalMode === "delete" && currentFirm) {
        await deleteDoc(doc(db, "prop_firms", currentFirm.id));
        toast.success("Firm deleted successfully");
      }

      setIsModalOpen(false);
      fetchFirmsAndStats();
    } catch (error: any) {
      console.error("Action failed:", error);
      toast.error("Action failed: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalFirms = firms.length;
  const globalPassRate = firms.length > 0 
    ? Math.round(firms.reduce((acc, firm) => acc + firm.passRate, 0) / firms.length)
    : 0;
  const totalFundedCapital = firms.reduce((acc, firm) => acc + (firm.funded * 100000), 0);

  return (
    <div className="space-y-6 animate-in fade-in font-sans">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="heading-page text-white">Prop Firm Analytics</h1>
          <p className="text-sm text-secondary mt-1">
            Monitor performance metrics and pass rates across all connected proprietary trading firms.
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <i className="las la-plus"></i> Add New Firm
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="premium-card p-6 shadow-xl relative overflow-hidden group border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.05)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
          <div className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Total Tracked Firms</div>
          <div className="text-3xl font-bold text-white">{totalFirms}</div>
        </div>
        
        <div className="premium-card p-6 shadow-xl relative overflow-hidden group border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Global Pass Rate</div>
          <div className="text-3xl font-bold text-white">{globalPassRate}%</div>
        </div>
        
        <div className="premium-card p-6 shadow-xl relative overflow-hidden group border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Estimated Funded Capital</div>
          <div className="text-3xl font-bold text-white">${totalFundedCapital.toLocaleString()}</div>
        </div>
      </div>

      {/* The Grid Layout */}
      {loading ? (
        <div className="flex justify-center p-12">
          <LoadingSpinner className="w-10 h-10 border-blue-500" />
        </div>
      ) : firms.length === 0 ? (
        <div className="premium-card p-12 text-center text-muted font-bold">
          No prop firms found in database.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {firms.map((firm) => (
            <div key={firm.id} className="premium-card p-6 shadow-xl flex flex-col hover:border-strong transition-colors">
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{firm.name}</h3>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${firm.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                  {firm.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="premium-inner-box p-4 mb-6 flex-1">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-default pb-2">
                    <span className="text-xs text-muted font-bold uppercase tracking-widest">Challenges</span>
                    <span className="text-sm font-bold text-white">{firm.challenges.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-default pb-2">
                    <span className="text-xs text-muted font-bold uppercase tracking-widest">Funded</span>
                    <span className="text-sm font-bold text-amber-400">{firm.funded.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted font-bold uppercase tracking-widest">Pass Rate</span>
                    <span className="text-sm font-bold text-blue-400">{firm.passRate}%</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => openEdit(firm)}
                  className="btn-ghost w-full py-2 flex items-center justify-center gap-2 text-xs"
                >
                  <i className="las la-cog text-lg"></i> Edit Firm
                </button>
                <button 
                  onClick={() => openDelete(firm)}
                  className="btn-ghost py-2 px-3 flex items-center justify-center hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                  title="Delete Firm"
                >
                  <i className="las la-trash text-lg"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="premium-card w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative border border-default">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 text-muted hover:text-white transition-colors"
            >
              <i className="las la-times text-2xl"></i>
            </button>
            
            {modalMode === "delete" ? (
              <>
                <h2 className="text-xl font-bold text-white tracking-tight mb-4 flex items-center gap-2">
                  <i className="las la-exclamation-triangle text-amber-500"></i> Delete Prop Firm
                </h2>
                <div className="premium-inner-box p-4 text-center border-amber-500/20 bg-amber-500/5">
                  <p className="text-sm text-amber-500/80 mb-2">
                    Are you sure you want to delete <strong>{currentFirm?.name}</strong>?
                  </p>
                  <p className="text-xs text-secondary">
                    This will remove the firm from the database. Note: Existing user accounts tied to this firm will lose their firm analytics association.
                  </p>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setIsModalOpen(false)} className="btn-ghost" disabled={isSubmitting}>Cancel</button>
                  <button onClick={handleSubmit} className="px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-sm rounded-xl hover:bg-rose-500/20 transition-all flex items-center gap-2" disabled={isSubmitting}>
                    {isSubmitting ? <LoadingSpinner className="w-4 h-4" /> : <i className="las la-trash"></i>} Confirm Delete
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white tracking-tight mb-6">
                  {modalMode === "add" ? "Add New Prop Firm" : "Edit Prop Firm"}
                </h2>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Firm Name</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="input-premium w-full bg-[#121212] border-default"
                        placeholder="e.g. FTMO"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Slug</label>
                      <input 
                        type="text" 
                        value={formData.slug}
                        onChange={e => setFormData({...formData, slug: e.target.value})}
                        className="input-premium w-full bg-[#121212] border-default"
                        placeholder="e.g. ftmo"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Website URL</label>
                      <input 
                        type="text" 
                        value={formData.website_url}
                        onChange={e => setFormData({...formData, website_url: e.target.value})}
                        className="input-premium w-full bg-[#121212] border-default"
                        placeholder="https://"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Logo URL</label>
                      <input 
                        type="text" 
                        value={formData.logo_url}
                        onChange={e => setFormData({...formData, logo_url: e.target.value})}
                        className="input-premium w-full bg-[#121212] border-default"
                        placeholder="https://"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Country</label>
                      <input 
                        type="text" 
                        value={formData.country}
                        onChange={e => setFormData({...formData, country: e.target.value})}
                        className="input-premium w-full bg-[#121212] border-default"
                        placeholder="e.g. CZ"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Display Order</label>
                      <input 
                        type="number" 
                        value={formData.display_order}
                        onChange={e => setFormData({...formData, display_order: Number(e.target.value)})}
                        className="input-premium w-full bg-[#121212] border-default"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Description</label>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="input-premium w-full bg-[#121212] border-default h-20 resize-none"
                      placeholder="Firm details..."
                    />
                  </div>
                  <div className="flex items-center gap-6 pt-2">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="isActiveFirm"
                        checked={formData.is_active}
                        onChange={e => setFormData({...formData, is_active: e.target.checked})}
                        className="w-4 h-4 rounded border-strong bg-neutral-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-neutral-900"
                      />
                      <label htmlFor="isActiveFirm" className="text-sm font-bold text-neutral-300">Active</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="isPopularFirm"
                        checked={formData.is_popular}
                        onChange={e => setFormData({...formData, is_popular: e.target.checked})}
                        className="w-4 h-4 rounded border-strong bg-neutral-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-neutral-900"
                      />
                      <label htmlFor="isPopularFirm" className="text-sm font-bold text-neutral-300">Popular</label>
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-default">
                  <button onClick={() => setIsModalOpen(false)} className="btn-ghost" disabled={isSubmitting}>Cancel</button>
                  <button onClick={handleSubmit} className="btn-primary flex items-center gap-2" disabled={isSubmitting}>
                    {isSubmitting ? <LoadingSpinner className="w-4 h-4" /> : <i className="las la-save"></i>} Save Firm
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
