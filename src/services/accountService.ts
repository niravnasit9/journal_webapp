import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { AccountDoc } from "@/lib/firebase/schema";

export const accountService = {
  /**
   * Fetches all accounts owned by a specific user ID.
   */
  async fetchUserAccounts(uid: string): Promise<AccountDoc[]> {
    if (!uid) return [];
    
    const accQuery = query(collection(db, "accounts"), where("owner_uid", "==", uid));
    const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Firestore timeout")), 10000));
    
    const accSnap: any = await Promise.race([getDocs(accQuery), timeoutPromise]);
    return accSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as AccountDoc));
  }
};
