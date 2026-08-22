"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { AccountDoc, UserDoc } from "@/lib/firebase/schema";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface AccountWithUser extends AccountDoc {
  userEmail: string;
}

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<AccountWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [uniqueTypes, setUniqueTypes] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchAllAccounts();
  }, []);

  const fetchAllAccounts = async () => {
    try {
      setLoading(true);
      // 1. Fetch all users so we can map uid -> email
      const usersSnap = await getDocs(query(collection(db, "users")));
      const userMap: Record<string, string> = {};
      usersSnap.docs.forEach(d => {
        userMap[d.id] = (d.data() as UserDoc).email;
      });

      // 2. Fetch all accounts
      const accSnap = await getDocs(query(collection(db, "accounts")));
      const accList: AccountWithUser[] = [];
      const types = new Set<string>();

      accSnap.docs.forEach(d => {
        const data = d.data() as AccountDoc;
        accList.push({
          ...data,
          id: d.id,
          userEmail: userMap[data.owner_uid] || "Unknown User"
        });
        types.add(data.account_type);
      });

      setUniqueTypes(Array.from(types));
      setAccounts(accList);
    } catch (error) {
      console.error("Error fetching accounts", error);
      toast.error("Failed to fetch accounts.");
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = filterType === "ALL" 
    ? accounts 
    : accounts.filter(a => a.account_type === filterType);

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-surface p-6 rounded-2xl border border-subtle">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-info-bg rounded-lg border border-info/20 flex items-center justify-center text-info">
              <i className="las la-wallet text-2xl"></i>
            </div>
            Global Accounts List
          </h1>
          <p className="text-secondary text-sm font-medium mt-2">View all trading accounts created by users.</p>
        </div>
        
        <div className="w-full sm:w-64 shrink-0">
          <Select 
            options={[
              { value: "ALL", label: "All Account Types" },
              ...uniqueTypes.map(type => ({ value: type, label: type }))
            ]}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-visible border-default p-0">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm text-secondary">
            <thead className="bg-surface text-xs font-bold text-muted uppercase tracking-widest border-b border-subtle">
              <tr>
                <th className="px-6 py-4">Account Label</th>
                <th className="px-6 py-4">Owner (User)</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Broker</th>
                <th className="px-6 py-4">Currency</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle bg-surface">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted font-bold">
                    No accounts match the criteria.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-elevated transition-colors group cursor-pointer" onClick={() => router.push(`/admin/users/${acc.owner_uid}`)}>
                    <td className="px-6 py-4 font-bold text-primary whitespace-nowrap">
                      {acc.label}
                    </td>
                    <td className="px-6 py-4 text-secondary font-medium">
                      <Link href={`/admin/users/${acc.owner_uid}`} className="hover:text-info transition-colors flex items-center gap-2">
                         <i className="las la-user"></i>
                         {acc.userEmail}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={acc.account_type.toLowerCase() === "real" ? "success" : "info"} size="sm" className="uppercase">
                        {acc.account_type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-secondary">
                      {acc.broker}
                    </td>
                    <td className="px-6 py-4 text-primary font-bold">
                      {acc.currency || "USD"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/users/${acc.owner_uid}`);
                        }}
                        leftIcon={<i className="las la-cog"></i>}
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
