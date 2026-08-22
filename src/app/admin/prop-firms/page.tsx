"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, doc, deleteDoc, query, serverTimestamp, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import toast from "react-hot-toast";
import Link from "next/link";
import { PropFirmDoc } from "@/lib/firebase/schema";
import ConfirmModal from "@/components/ui/ConfirmModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export default function AdminPropFirmsPage() {
  const [firms, setFirms] = useState<PropFirmDoc[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "popular" | "active">("all");

  // Modal State for Adding
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFirmName, setNewFirmName] = useState("");
  const [newWebsite, setNewWebsite] = useState("");
  const [newIsPopular, setNewIsPopular] = useState(false);
  const [newDisplayOrder, setNewDisplayOrder] = useState("0");
  const [isAdding, setIsAdding] = useState(false);
  
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, id: string, name: string}>({isOpen: false, id: "", name: ""});

  useEffect(() => {
    fetchFirms();
  }, []);

  const fetchFirms = async () => {
    try {
      const q = query(collection(db, "prop_firms"));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as PropFirmDoc));
      
      data.sort((a, b) => {
        if (a.is_popular !== b.is_popular) return a.is_popular ? -1 : 1;
        return (a.display_order || 0) - (b.display_order || 0);
      });
      
      setFirms(data);
    } catch (error) {
      console.error("Failed to load prop firms:", error);
      toast.error("Failed to load prop firms");
    } finally {
      setLoading(false);
    }
  };

  const filteredFirms = useMemo(() => {
    return firms.filter(firm => {
      const matchesSearch = firm.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      
      if (filterType === "popular") return firm.is_popular;
      if (filterType === "active") return firm.is_active;
      return true;
    });
  }, [firms, searchQuery, filterType]);

  const handleAddFirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFirmName.trim();
    if (!trimmed) return;

    if (firms.some(f => f.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("A firm with this name already exists.");
      return;
    }

    setIsAdding(true);
    try {
      const newFirm: Omit<PropFirmDoc, 'id'> = {
        name: newFirmName.trim(),
        slug: newFirmName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        is_active: true,
        website_url: newWebsite.trim(),
        is_popular: newIsPopular,
        display_order: parseInt(newDisplayOrder) || 0,
        plans: [],
        rules: [],
        created_at: serverTimestamp() as any
      };
      
      const docRef = await addDoc(collection(db, "prop_firms"), newFirm);
      setFirms([{ ...newFirm, id: docRef.id } as PropFirmDoc, ...firms]);
      setIsAddModalOpen(false);
      setNewFirmName("");
      setNewWebsite("");
      setNewIsPopular(false);
      setNewDisplayOrder("0");
      toast.success("Prop firm created!");
    } catch (error) {
      console.error("Error creating firm:", error);
      toast.error("Failed to create prop firm");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmModal.id) return;
    try {
      await deleteDoc(doc(db, "prop_firms", confirmModal.id));
      setFirms(firms.filter(f => f.id !== confirmModal.id));
      toast.success("Firm deleted successfully.");
    } catch (error) {
      console.error("Error deleting firm:", error);
      toast.error("Failed to delete firm");
    } finally {
      setConfirmModal({ isOpen: false, id: "", name: "" });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (loading) return <div className="p-8 text-center flex justify-center"><LoadingSpinner className="w-8 h-8" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto pb-12 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-subtle pb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">
            Prop Firms
          </h1>
          <p className="text-sm text-secondary mt-1">
            Manage prop firms, programs, account plans and trading rules.
          </p>
        </div>
        <Button 
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<i className="las la-plus text-lg"></i>}
        >
          Add Prop Firm
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:max-w-xs">
          <Input
            placeholder="Search firms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<i className="las la-search text-lg"></i>}
          />
        </div>
        
        <div className="flex items-center gap-1 w-full sm:w-auto bg-elevated p-1 rounded-lg border border-default">
          {(["all", "popular", "active"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
                filterType === f 
                  ? "bg-[var(--text-primary)] text-[var(--bg-base)] shadow-sm" 
                  : "text-secondary hover:text-primary"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="text-sm font-medium text-muted">
        {filteredFirms.length} {filteredFirms.length === 1 ? 'firm' : 'firms'}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFirms.map(firm => (
          <Card key={firm.id} className="group flex flex-col border-default hover:border-strong transition-all overflow-hidden p-0">
            <div className="p-5 flex-1 bg-surface">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-elevated border border-default flex items-center justify-center text-sm font-bold text-secondary">
                    {getInitials(firm.name)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-primary leading-tight flex items-center gap-2">
                      {firm.name}
                      <span className={`w-1.5 h-1.5 rounded-full ${firm.is_active ? 'bg-success' : 'bg-muted'}`} title={firm.is_active ? 'Active' : 'Inactive'}></span>
                    </h3>
                  </div>
                </div>
                
                <button 
                  onClick={() => setConfirmModal({ isOpen: true, id: firm.id, name: firm.name })}
                  className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Firm"
                >
                  <i className="las la-trash-alt text-lg"></i>
                </button>
              </div>
              
              <div className="text-xs text-secondary flex items-center gap-2 mt-4 font-medium">
                <span>{firm.plans?.length || 0} plans</span>
                <span>·</span>
                <span>{firm.rules?.length || 0} rules</span>
                {firm.is_popular && (
                  <>
                    <span>·</span>
                    <Badge variant="info" size="sm" className="uppercase">Popular</Badge>
                  </>
                )}
              </div>
            </div>
            
            <div className="border-t border-subtle p-3 flex justify-end bg-elevated">
              <Link 
                href={`/admin/prop-firms/${firm.id}`}
                className="text-sm font-bold text-info hover:text-primary transition-colors flex items-center gap-1"
              >
                Manage <i className="las la-arrow-right"></i>
              </Link>
            </div>
          </Card>
        ))}
        {filteredFirms.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted font-bold bg-surface border border-dashed border-subtle rounded-xl">
            <i className="las la-building text-4xl mb-3 opacity-50 block"></i>
            <p>No prop firms found.</p>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-lg overflow-hidden flex flex-col p-0">
            <div className="p-5 border-b border-subtle flex justify-between items-center bg-elevated">
              <h2 className="text-lg font-bold text-primary">Add New Prop Firm</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-muted hover:text-primary transition-colors">
                <i className="las la-times text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleAddFirm} className="p-5 flex flex-col gap-4 bg-surface">
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Firm Name *</label>
                <Input 
                  value={newFirmName}
                  onChange={(e) => setNewFirmName(e.target.value)}
                  placeholder="e.g. FTMO, FundedNext"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Website URL</label>
                <Input 
                  type="url" 
                  value={newWebsite}
                  onChange={(e) => setNewWebsite(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">Display Order</label>
                <Input 
                  type="number" 
                  value={newDisplayOrder}
                  onChange={(e) => setNewDisplayOrder(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="popularCheck"
                  checked={newIsPopular}
                  onChange={(e) => setNewIsPopular(e.target.checked)}
                  className="w-4 h-4 rounded border-default text-info focus:ring-info/50"
                />
                <label htmlFor="popularCheck" className="text-sm font-medium text-primary cursor-pointer">
                  Mark as Popular
                </label>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-subtle">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={isAdding || !newFirmName.trim()}
                >
                  {isAdding ? "Adding..." : "Add Firm"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Prop Firm"
        message={`Are you sure you want to delete ${confirmModal.name}? This will remove all its plans and rules permanently.`}
        confirmText="Delete Firm"
        onConfirm={handleDelete}
        onCancel={() => setConfirmModal({ isOpen: false, id: "", name: "" })}
        isDanger={true}
      />
    </div>
  );
}
