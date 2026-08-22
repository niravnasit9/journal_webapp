"use client";

import { useAuth } from "@/lib/firebase/authContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-surface p-8 md:p-10 rounded-2xl border border-subtle relative overflow-hidden">
        <div className="relative z-10">
          <Badge variant="info" size="sm" className="mb-4">
            <i className="las la-cog mr-1"></i> Global Configuration
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight flex items-center gap-3 mb-2">
            System Settings
          </h1>
          <p className="text-secondary font-medium">System configuration and preferences.</p>
        </div>
      </div>

      <Card className="p-12 text-center flex flex-col items-center justify-center border-default">
        <div className="w-20 h-20 bg-info-bg rounded-2xl flex items-center justify-center border border-info/20 mb-6">
          <i className="las la-rocket text-4xl text-info"></i>
        </div>
        <h3 className="text-xl font-bold text-primary mb-2">Fully Dynamic System Active</h3>
        <p className="text-secondary max-w-md mx-auto leading-relaxed">
          The legacy Account Types and Prop Firms settings have been completely deprecated and removed. 
          <br/><br/>
          Please navigate to the <b><i className="las la-building"></i> Prop Firms</b> panel in the sidebar to dynamically manage all Firms, Plans, Phases, Rules, and their associated Drawdown Limits.
        </p>
      </Card>
    </div>
  );
}
