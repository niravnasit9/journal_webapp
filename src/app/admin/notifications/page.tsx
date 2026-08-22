"use client";

import { useAuth } from "@/lib/firebase/authContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function AdminNotificationsPage() {
  const { role, loading } = useAuth();

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><LoadingSpinner className="w-10 h-10 border-info" /></div>;
  }

  if (role !== 'admin') {
    return <div className="p-8 text-center text-danger font-bold">Access Denied</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-subtle pb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
            <i className="las la-bell text-3xl text-info"></i>
            Admin Notifications
          </h1>
          <p className="text-secondary text-sm mt-1">System alerts, new users, and critical platform events.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" leftIcon={<i className="las la-paper-plane text-lg"></i>}>
            Send Announcement
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-subtle pb-4">
        {["All Alerts", "System", "Users", "Billing", "Security"].map((tab, i) => (
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

      <Card className="p-12 flex flex-col items-center justify-center text-center shadow-sm border-default">
        <div className="w-16 h-16 rounded-full bg-elevated flex items-center justify-center mb-4 border border-default relative">
          <div className="absolute top-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-surface"></div>
          <i className="las la-check-circle text-3xl text-success"></i>
        </div>
        <h3 className="text-lg font-bold text-primary">All Clear</h3>
        <p className="text-secondary text-sm mt-2 max-w-md">
          There are no pending administrative alerts. The system is operating normally.
        </p>
      </Card>
    </div>
  );
}
