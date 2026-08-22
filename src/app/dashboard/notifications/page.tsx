"use client";

import { useAuth } from "@/lib/firebase/authContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function NotificationsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><LoadingSpinner className="w-10 h-10" /></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
            <i className="las la-bell text-3xl text-primary"></i>
            Notifications
          </h1>
          <p className="text-secondary text-sm mt-1">Manage your system, risk, and account alerts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="opacity-50 cursor-not-allowed">
            Mark all as read
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-subtle pb-4">
        {["All", "Unread", "Risk", "Account", "System", "Prop Firm", "Goals"].map((tab, i) => (
          <button 
            key={tab} 
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              i === 0 ? "bg-[var(--text-primary)] text-[var(--bg-base)]" : "text-secondary hover:bg-elevated"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <Card className="p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-elevated flex items-center justify-center mb-4 border border-default relative">
          <i className="las la-bell-slash text-3xl text-muted"></i>
        </div>
        <h3 className="text-lg font-bold text-primary">No Notifications</h3>
        <p className="text-secondary text-sm mt-2 max-w-md">
          You don't have any notifications right now. Alerts regarding drawdowns, new prop firm rules, or completed goals will appear here.
        </p>
      </Card>
    </div>
  );
}
