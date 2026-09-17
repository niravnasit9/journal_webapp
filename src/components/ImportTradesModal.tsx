"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import { syncDhanApiAction } from "@/app/actions/importActions";

interface ImportTradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  onSuccess: () => void;
}

export default function ImportTradesModal({ isOpen, onClose, accountId, onSuccess }: ImportTradesModalProps) {
  const [activeTab, setActiveTab] = useState<"api" | "csv">("api");
  const [loading, setLoading] = useState(false);

  // API Sync State
  const [clientId, setClientId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const handleApiSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !accessToken) {
      toast.error("Please provide both Client ID and Access Token.");
      return;
    }

    try {
      setLoading(true);
      const res = await syncDhanApiAction(clientId, accessToken, accountId);
      if (res.success) {
        toast.success(`Successfully imported ${res.count} trades!`);
        onSuccess();
        onClose();
      } else {
        toast.error("Sync failed: " + res.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to sync trades.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Trades" size="lg">
      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-4 border-b border-default mb-6">
          <button
            onClick={() => setActiveTab("api")}
            className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors border-b-2 ${
              activeTab === "api" ? "border-blue-500 text-blue-400" : "border-transparent text-muted hover:text-secondary"
            }`}
          >
            Dhan API Sync
          </button>
          <button
            onClick={() => setActiveTab("csv")}
            className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors border-b-2 ${
              activeTab === "csv" ? "border-blue-500 text-blue-400" : "border-transparent text-muted hover:text-secondary"
            }`}
          >
            CSV Upload
          </button>
        </div>

        {activeTab === "api" && (
          <form onSubmit={handleApiSync} className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg mb-6">
              <h4 className="text-blue-400 font-bold text-sm mb-2 flex items-center gap-2">
                <i className="las la-info-circle text-lg"></i> How to get credentials
              </h4>
              <p className="text-xs text-secondary leading-relaxed">
                1. Go to Dhan Web &gt; My Profile &gt; DhanHQ APIs.<br/>
                2. Switch the toggle to <strong>Access Token</strong> (not API Key).<br/>
                3. Your Client ID is your 10-digit Dhan Login ID.<br/>
                4. Access Tokens are valid for 24 hours. You must generate a new one daily to sync.
              </p>
            </div>

            <Input 
              label="Dhan Client ID"
              placeholder="e.g. 1100001234"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              required
            />
            
            <Input 
              label="Access Token (24h validity)"
              placeholder="eyJ0eXAiOi..."
              type="password"
              value={accessToken}
              onChange={e => setAccessToken(e.target.value)}
              required
            />

            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
              >
                {loading ? <LoadingSpinner className="w-5 h-5 border-white" /> : (
                  <><i className="las la-sync"></i> Sync Trades</>
                )}
              </button>
            </div>
          </form>
        )}

        {activeTab === "csv" && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-elevated rounded-full flex items-center justify-center mx-auto mb-4 border border-default">
              <i className="las la-file-csv text-3xl text-secondary"></i>
            </div>
            <h3 className="text-primary font-bold mb-2">CSV Upload Coming Soon</h3>
            <p className="text-secondary text-sm">We are finalizing the exact column mappings for Dhan CSV exports. Please use the API Sync option in the meantime!</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
