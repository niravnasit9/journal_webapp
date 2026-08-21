"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { StrategyDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export default function StrategiesPage() {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<StrategyDoc[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStrategyId, setCurrentStrategyId] = useState("");
  
  // Share Modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [strategyToShare, setStrategyToShare] = useState<StrategyDoc | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState<string[]>([""]);
  const [imageUrl, setImageUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStrategies();
    }
  }, [user]);

  const fetchStrategies = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const q = query(collection(db, "strategies"), where("owner_uid", "==", user.uid));
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ ...d.data(), id: d.id } as StrategyDoc));
      docs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setStrategies(docs);
    } catch (error) {
      console.error("Failed to fetch strategies", error);
      toast.error("Failed to load strategies.");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setName("");
    setDescription("");
    setRules([""]);
    setImageUrl("");
    setIsModalOpen(true);
  };

  const openEditModal = (strategy: StrategyDoc) => {
    setIsEditing(true);
    setCurrentStrategyId(strategy.id);
    setName(strategy.name);
    setDescription(strategy.description);
    setRules(strategy.rules.length > 0 ? [...strategy.rules] : [""]);
    setImageUrl(strategy.image_url || "");
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      toast.error("Image must be less than 30MB");
      return;
    }

    try {
      setUploadingImage(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        try {
          const base64data = reader.result;
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64data })
          });
          const data = await response.json();
          
          if (response.ok && data.url) {
            setImageUrl(data.url);
            toast.success("Image uploaded!");
          } else {
            throw new Error(data.error || "Upload failed");
          }
        } catch (error) {
          console.error(error);
          toast.error("Failed to upload image");
        } finally {
          setUploadingImage(false);
        }
      };
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image");
      setUploadingImage(false);
    }
  };

  const handleAddRule = () => {
    setRules([...rules, ""]);
  };

  const handleRuleChange = (index: number, value: string) => {
    const newRules = [...rules];
    newRules[index] = value;
    setRules(newRules);
  };

  const handleRemoveRule = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index);
    if (newRules.length === 0) newRules.push(""); // always keep at least one input
    setRules(newRules);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) return toast.error("Strategy name is required.");

    try {
      setIsSaving(true);
      const cleanedRules = rules.filter(r => r.trim() !== "");
      
      let docRef;
      if (isEditing) {
        docRef = doc(db, "strategies", currentStrategyId);
      } else {
        docRef = doc(collection(db, "strategies"));
      }

      const strategyData = {
        id: docRef.id,
        owner_uid: user.uid,
        owner_email: user.email || "",
        owner_photo_url: user.photoURL || "",
        name: name.trim(),
        description: description.trim(),
        rules: cleanedRules,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
        ...(isEditing ? {} : { created_at: new Date().toISOString() })
      };

      await setDoc(docRef, strategyData, { merge: true });
      toast.success(`Strategy ${isEditing ? 'updated' : 'created'} successfully!`);
      setIsModalOpen(false);
      fetchStrategies();
    } catch (error) {
      console.error("Error saving strategy", error);
      toast.error("Failed to save strategy.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, "strategies", id));
      toast.success("Strategy deleted.");
      fetchStrategies();
    } catch (error) {
      console.error("Error deleting strategy", error);
      toast.error("Failed to delete strategy.");
    }
  };

  const openShareModal = (strategy: StrategyDoc) => {
    setStrategyToShare(strategy);
    setIsShareModalOpen(true);
  };

  const togglePublicStatus = async () => {
    if (!strategyToShare) return;
    try {
      const newStatus = !strategyToShare.is_public;
      await setDoc(doc(db, "strategies", strategyToShare.id), { is_public: newStatus }, { merge: true });
      
      setStrategyToShare({ ...strategyToShare, is_public: newStatus });
      setStrategies(strategies.map(s => s.id === strategyToShare.id ? { ...s, is_public: newStatus } : s));
      
      toast.success(newStatus ? "Strategy is now public!" : "Strategy is now private.");
    } catch (error) {
      console.error("Error toggling public status", error);
      toast.error("Failed to update sharing settings.");
    }
  };

  const copyPublicLink = () => {
    if (!strategyToShare) return;
    const url = `${window.location.origin}/strategy/${strategyToShare.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto font-sans pb-24 px-4 sm:px-6 lg:px-8 pt-8">
      
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white dark:bg-[#111318] p-8 md:p-10 rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 text-xs font-black uppercase tracking-widest mb-4">
            <i className="las la-book"></i> Playbooks
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-2">
            My Strategies
          </h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium">
            Document your edge, define strict rules, and build unbreakable discipline.
          </p>
        </div>
        
        <button 
          onClick={openCreateModal}
          className="relative z-10 flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black text-sm font-black rounded-2xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:scale-105 w-full md:w-auto shrink-0"
        >
          <i className="las la-plus text-lg"></i>
          Create Strategy
        </button>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-32">
          <LoadingSpinner className="w-12 h-12 border-[3px]" />
          <p className="mt-4 text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest text-sm animate-pulse">Loading Playbooks</p>
        </div>
      ) : strategies.length === 0 ? (
        <div className="bg-white/50 dark:bg-[#111318]/50 backdrop-blur-xl border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-[3rem] p-12 md:p-20 text-center shadow-lg transition-all hover:bg-white dark:hover:bg-[#111318]">
          <div className="w-24 h-24 bg-gradient-to-tr from-yellow-100 to-yellow-50 dark:from-yellow-500/20 dark:to-yellow-500/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner rotate-3">
            <i className="las la-chess-knight text-5xl text-yellow-500"></i>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tighter mb-4">No Strategies Yet</h2>
          <p className="text-gray-500 dark:text-slate-400 max-w-lg mx-auto mb-10 font-medium text-lg">
            A trader without a strategy is just a gambler. Build your first playbook to define your edge in the market.
          </p>
          <button 
            onClick={openCreateModal}
            className="px-8 py-4 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black font-black rounded-2xl transition-all shadow-xl hover:-translate-y-1 w-full sm:w-auto"
          >
            Draft Your First Strategy
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {strategies.map(strategy => (
            <div key={strategy.id} className="bg-white dark:bg-[#111318] rounded-[2.5rem] shadow-sm hover:shadow-2xl border border-gray-100 dark:border-white/5 hover:border-yellow-500/50 transition-all duration-500 group flex flex-col h-full relative overflow-hidden">
              
              {/* Card Image Header */}
              {strategy.image_url ? (
                <div className="w-full h-48 relative overflow-hidden shrink-0">
                  <img src={strategy.image_url} alt={strategy.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#111318] via-transparent to-black/20"></div>
                  
                  {/* Status Badge overlay on image */}
                  <div className="absolute top-6 left-6">
                    {strategy.is_public ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-50 text-[10px] font-black uppercase tracking-widest shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Public
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase tracking-widest shadow-sm">
                        <i className="las la-lock"></i>
                        Private
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full h-32 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-white/5 dark:to-transparent relative overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  
                  <div className="absolute top-6 left-6 z-10">
                    {strategy.is_public ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Public
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest shadow-sm">
                        <i className="las la-lock"></i>
                        Private
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="px-8 pb-8 pt-4 flex-grow flex flex-col relative z-10 -mt-6">
                
                {/* Floating Action Buttons */}
                <div className="absolute -top-12 right-6 flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:translate-y-4 md:group-hover:translate-y-0 transition-all duration-300">
                  <button 
                    onClick={() => openShareModal(strategy)}
                    className="w-10 h-10 rounded-full bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white hover:text-blue-500 hover:border-blue-500/50 flex items-center justify-center transition-all shadow-lg hover:shadow-blue-500/20"
                    title="Share Strategy"
                  >
                    <i className="las la-share-alt text-lg"></i>
                  </button>
                  <button 
                    onClick={() => openEditModal(strategy)}
                    className="w-10 h-10 rounded-full bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white hover:text-yellow-500 hover:border-yellow-500/50 flex items-center justify-center transition-all shadow-lg hover:shadow-yellow-500/20"
                    title="Edit Strategy"
                  >
                    <i className="las la-pen text-lg"></i>
                  </button>
                  <button 
                    onClick={() => handleDelete(strategy.id, strategy.name)}
                    className="w-10 h-10 rounded-full bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white hover:text-rose-500 hover:border-rose-500/50 flex items-center justify-center transition-all shadow-lg hover:shadow-rose-500/20"
                    title="Delete Strategy"
                  >
                    <i className="las la-trash-alt text-lg"></i>
                  </button>
                </div>

                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight line-clamp-2 mb-3 mt-4">
                  {strategy.name}
                </h3>

                <p className="text-gray-500 dark:text-slate-400 mb-8 font-medium line-clamp-3 leading-relaxed">
                  {strategy.description || "No philosophy documented."}
                </p>

                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                      Core Rules
                    </h4>
                    <span className="px-2.5 py-1 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 rounded-lg text-[10px] font-black uppercase tracking-wider">
                      {strategy.rules.length} Rules
                    </span>
                  </div>
                  
                  {strategy.rules.length > 0 ? (
                    <div className="space-y-2">
                      {strategy.rules.slice(0, 3).map((rule, idx) => (
                        <div key={idx} className="flex gap-3 text-sm text-gray-700 dark:text-slate-300 font-medium bg-gray-50/50 dark:bg-white/5 p-2.5 rounded-xl border border-gray-100 dark:border-transparent">
                          <span className="text-yellow-500 font-black shrink-0">{idx + 1}.</span>
                          <span className="line-clamp-1">{rule}</span>
                        </div>
                      ))}
                      {strategy.rules.length > 3 && (
                        <div className="text-xs font-bold text-gray-400 dark:text-slate-500 pt-2 flex items-center justify-center gap-1 w-full">
                          <i className="las la-ellipsis-h"></i> {strategy.rules.length - 3} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-slate-800 text-xs text-gray-400 text-center font-medium">
                      No rules defined yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Modal - Premium Redesign */}
      {isShareModalOpen && strategyToShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#111318] rounded-[2rem] w-full max-w-lg shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-white/10 overflow-hidden scale-in-95 duration-300">
            
            <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center text-blue-500">
                  <i className="las la-share-alt text-2xl"></i>
                </div>
                Share Strategy
              </h2>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="w-10 h-10 rounded-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors shadow-sm"
              >
                <i className="las la-times text-xl"></i>
              </button>
            </div>

            <div className="p-8">
              <p className="text-gray-600 dark:text-slate-400 mb-8 font-medium leading-relaxed">
                Generate a beautiful public page for <strong className="text-gray-900 dark:text-white">{strategyToShare.name}</strong>. Anyone with the link will be able to read your philosophy and rules.
              </p>

              <div className="bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl p-5 flex items-center justify-between mb-8 shadow-sm">
                <div className="flex gap-4 items-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${strategyToShare.is_public ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-500' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                    <i className={`las text-2xl ${strategyToShare.is_public ? 'la-globe' : 'la-lock'}`}></i>
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 dark:text-white">Public Access</h4>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Let others view this playbook.</p>
                  </div>
                </div>
                <button 
                  onClick={togglePublicStatus}
                  className={`w-14 h-8 rounded-full transition-colors relative flex items-center shrink-0 border-2 ${strategyToShare.is_public ? 'bg-emerald-500 border-emerald-500' : 'bg-gray-200 dark:bg-slate-700 border-gray-200 dark:border-slate-700'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full absolute transition-all duration-300 shadow-sm ${strategyToShare.is_public ? 'left-7' : 'left-0.5'}`}></div>
                </button>
              </div>

              {strategyToShare.is_public ? (
                <div className="animate-in slide-in-from-bottom-4 duration-500 bg-gray-50 dark:bg-[#0a0f1c] rounded-2xl p-5 border border-gray-100 dark:border-white/5">
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 mb-3">Your Shareable Link</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm text-gray-900 dark:text-white font-medium truncate overflow-hidden shadow-inner">
                      {window.location.origin}/strategy/{strategyToShare.id}
                    </div>
                    <button 
                      onClick={copyPublicLink}
                      className="w-14 h-[52px] shrink-0 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                      title="Copy Link"
                    >
                      <i className="las la-copy text-2xl"></i>
                    </button>
                  </div>
                  <div className="mt-4 text-center">
                    <a href={`/strategy/${strategyToShare.id}`} target="_blank" className="text-sm font-bold text-blue-500 hover:text-blue-600 transition-colors">
                      Preview public page &rarr;
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-2xl p-5 text-sm text-yellow-700 dark:text-yellow-400 font-medium text-center">
                  This strategy is completely hidden from the public. Enable access above to get your link.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Create/Edit Modal - Premium Redesign */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white dark:bg-[#111318] rounded-[2rem] w-full max-w-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-white/10 my-auto scale-in-95 duration-300">
            
            <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center sticky top-0 bg-white/90 dark:bg-[#111318]/90 backdrop-blur-xl rounded-t-[2rem] z-10">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {isEditing ? "Manage Playbook" : "Draft New Playbook"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors shadow-sm"
              >
                <i className="las la-times text-xl"></i>
              </button>
            </div>

            <div className="p-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <form id="strategy-form" onSubmit={handleSave} className="space-y-8">
                
                <div className="space-y-6 bg-gray-50/50 dark:bg-black/10 p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                  {/* Image Upload Area */}
                  <div>
                    <label className="block text-sm font-black text-gray-900 dark:text-white mb-2">Cover Image (Optional)</label>
                    <div className="flex items-center gap-4">
                      {imageUrl ? (
                        <div className="relative w-32 h-20 rounded-xl overflow-hidden shadow-sm group">
                          <img src={imageUrl} alt="Cover" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                              type="button" 
                              onClick={() => setImageUrl("")}
                              className="text-white hover:text-rose-400"
                            >
                              <i className="las la-trash-alt text-xl"></i>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-32 h-20 rounded-xl bg-gray-100 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 flex items-center justify-center">
                          <i className="las la-image text-3xl text-gray-400"></i>
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm font-bold text-sm">
                          {uploadingImage ? <LoadingSpinner className="w-4 h-4 border-[2px]" /> : <i className="las la-upload text-lg"></i>}
                          {uploadingImage ? "Uploading..." : "Upload Image"}
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                          />
                        </label>
                        <p className="text-xs text-gray-500 dark:text-slate-500 mt-2 font-medium">Recommended size: 800x400px. Max 30MB.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-gray-900 dark:text-white mb-2">Playbook Name <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. The London Breakout"
                      className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 font-bold transition-all shadow-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-black text-gray-900 dark:text-white mb-2">Core Philosophy</label>
                    <textarea 
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Describe the overall edge and market condition this strategy exploits..."
                      rows={4}
                      className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 font-medium transition-all resize-none shadow-sm"
                    ></textarea>
                  </div>
                </div>

                <div className="p-6 rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111318]">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
                    <div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white">Strict Rules</h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">If these rules are broken, you do not take the trade.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleAddRule}
                      className="px-4 py-2 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 font-bold rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-500/20 transition-colors flex items-center gap-2"
                    >
                      <i className="las la-plus"></i> Add Rule
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {rules.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-3 group/rule">
                        <div className="w-12 h-[52px] shrink-0 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-400 dark:text-slate-500 font-black text-lg">
                          {idx + 1}
                        </div>
                        <input 
                          type="text" 
                          value={rule}
                          onChange={(e) => handleRuleChange(idx, e.target.value)}
                          placeholder="What must happen for this trade to be valid?"
                          className="flex-1 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 font-medium transition-all shadow-sm"
                        />
                        <button 
                          type="button"
                          onClick={() => handleRemoveRule(idx)}
                          className="w-12 h-[52px] shrink-0 rounded-xl bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-400 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-500 dark:hover:bg-rose-500/10 dark:hover:border-rose-500/30 transition-all flex items-center justify-center shadow-sm opacity-0 group-hover/rule:opacity-100 focus:opacity-100"
                        >
                          <i className="las la-trash-alt text-xl"></i>
                        </button>
                      </div>
                    ))}
                    {rules.length === 0 && (
                      <div className="text-center py-6 text-gray-400 dark:text-slate-500 font-medium border-2 border-dashed border-gray-100 dark:border-white/5 rounded-2xl">
                        Click "Add Rule" to define your parameters.
                      </div>
                    )}
                  </div>
                </div>

              </form>
            </div>

            <div className="px-8 py-6 bg-gray-50/50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row justify-end gap-4 shrink-0 rounded-b-[2rem]">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-gray-600 dark:text-slate-300 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm order-2 sm:order-1"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                form="strategy-form"
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-black rounded-2xl shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:translate-y-0 order-1 sm:order-2"
              >
                {isSaving ? <LoadingSpinner className="w-5 h-5 border-[2.5px] border-black/30 border-t-black" /> : (isEditing ? "Save Changes" : "Publish Strategy")}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
