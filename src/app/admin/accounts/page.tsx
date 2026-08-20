"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { AccountDoc, UserDoc } from "@/lib/firebase/schema";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CustomSelect from "@/components/ui/CustomSelect";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

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
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <i className="las la-wallet text-3xl text-purple-500"></i>
            Global Accounts List
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm font-medium mt-1">View all trading accounts created by users.</p>
        </div>
        
        <div className="relative w-full sm:w-64 shrink-0">
          <CustomSelect 
            options={[
              { value: "ALL", label: "All Account Types" },
              ...uniqueTypes.map(type => ({ value: type, label: type }))
            ]}
            value={filterType}
            onChange={setFilterType}
            icon="las la-filter"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#111318] border border-yellow-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700 dark:text-slate-300">
            <thead className="bg-[#fafafa] dark:bg-[#0a0f1c] text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest border-b border-yellow-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Account Label</th>
                <th className="px-6 py-4">Owner (User)</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Broker</th>
                <th className="px-6 py-4">Currency</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8"><LoadingSpinner /></td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400 dark:text-slate-500 font-bold">
                    No accounts match the criteria.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-gray-100 dark:hover:bg-[#16181d] transition-colors group cursor-pointer" onClick={() => router.push(`/admin/users/${acc.owner_uid}`)}>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                      {acc.label}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400 font-medium">
                      <Link href={`/admin/users/${acc.owner_uid}`} className="hover:text-blue-400 transition-colors flex items-center gap-2">
                         <i className="las la-user"></i>
                         {acc.userEmail}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                        acc.account_type.toLowerCase() === "real" 
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                          : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      }`}>
                        {acc.account_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                      {acc.broker}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400 font-bold">
                      {acc.currency || "USD"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin/users/${acc.owner_uid}`}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-[#1f2229] hover:bg-slate-700 text-gray-700 dark:text-slate-300 flex items-center justify-center transition-colors inline-flex"
                        title="Manage Account"
                      >
                        <i className="las la-cog"></i>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
